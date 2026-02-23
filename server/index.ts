import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket as WsWebSocket } from 'ws';
import type { IncomingMessage } from 'http';
import type { Duplex } from 'stream';
import { configRoutes } from './routes/config.js';
import { discoveryRoutes } from './routes/discovery.js';
import { ConfigService } from './services/configService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = parseInt(process.env.PORT || '3000');
const IS_ADDON = process.env.ADDON === 'true';
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');

app.use(express.json());

// Ingress header forwarding
if (IS_ADDON) {
  app.use((req, _res, next) => {
    const ingressPath = req.headers['x-ingress-path'] as string | undefined;
    if (ingressPath) {
      (req as any).ingressPath = ingressPath;
    }
    next();
  });
}

// API routes
const configService = new ConfigService(path.join(DATA_DIR, 'config.json'));
app.use('/api', configRoutes(configService));
app.use('/api', discoveryRoutes(configService));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', version: '0.5.0', addon: IS_ADDON });
});

// Auth info endpoint - tells the frontend how to connect
app.get('/api/auth', (_req, res) => {
  if (IS_ADDON) {
    res.json({ mode: 'ingress' });
  } else {
    res.json({ mode: 'standalone' });
  }
});

// Debug endpoint - helps diagnose connection issues in add-on mode
app.get('/api/debug', async (_req, res) => {
  const info: Record<string, unknown> = {
    version: '0.5.0',
    addon: IS_ADDON,
    supervisorToken: !!process.env.SUPERVISOR_TOKEN,
    nodeVersion: process.version,
    env: {
      ADDON: process.env.ADDON,
      PORT: process.env.PORT,
      DATA_DIR: process.env.DATA_DIR,
      NODE_ENV: process.env.NODE_ENV,
    },
  };

  if (IS_ADDON && process.env.SUPERVISOR_TOKEN) {
    // Test Supervisor API connectivity
    try {
      const r = await fetch('http://supervisor/core/api/', {
        headers: { Authorization: `Bearer ${process.env.SUPERVISOR_TOKEN}` },
      });
      info.supervisorCoreApi = { status: r.status, ok: r.ok };
    } catch (e: any) {
      info.supervisorCoreApi = { error: e.message };
    }

    // Test direct HA Core connectivity
    try {
      const r = await fetch('http://homeassistant:8123/api/', {
        headers: { Authorization: `Bearer ${process.env.SUPERVISOR_TOKEN}` },
      });
      info.haCoreDirect = { status: r.status, ok: r.ok };
    } catch (e: any) {
      info.haCoreDirect = { error: e.message };
    }
  }

  res.json(info);
});

// Serve SPA in production
const clientDir = path.join(__dirname, '../client');
app.use(express.static(clientDir));
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(clientDir, 'index.html'));
  }
});

const server = app.listen(PORT, () => {
  console.log(`Dira Dashboard server running on port ${PORT}`);
  console.log(`Mode: ${IS_ADDON ? 'Add-on' : 'Standalone'}`);
  console.log(`Data dir: ${DATA_DIR}`);
  if (IS_ADDON) {
    console.log(`Supervisor token: ${process.env.SUPERVISOR_TOKEN ? 'present' : 'MISSING'}`);
  }
});

// WebSocket proxy for ingress mode
// Proxies frontend WS connections to HA Core via internal Docker network
if (IS_ADDON) {
  // HA WebSocket URLs to try (in order of preference)
  const HA_WS_URLS = [
    'ws://homeassistant:8123/api/websocket',      // Direct to HA Core
    'ws://supervisor/core/api/websocket',           // Via Supervisor proxy (with /api)
    'ws://supervisor/core/websocket',               // Via Supervisor proxy (legacy)
  ];

  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request: IncomingMessage, socket: Duplex, head: Buffer) => {
    const url = request.url || '';
    console.log(`[WS Proxy] Upgrade request for: ${url}`);
    if (url === '/api/websocket' || url.endsWith('/api/websocket')) {
      wss.handleUpgrade(request, socket, head, (ws) => {
        handleHAProxy(ws);
      });
    } else {
      console.log(`[WS Proxy] Ignoring upgrade for: ${url}`);
    }
  });

  function tryConnectHA(urls: string[], index: number): Promise<WsWebSocket> {
    return new Promise((resolve, reject) => {
      if (index >= urls.length) {
        reject(new Error(`All WebSocket URLs failed: ${urls.join(', ')}`));
        return;
      }

      const url = urls[index];
      console.log(`[WS Proxy] Trying HA WebSocket: ${url}`);
      const ws = new WsWebSocket(url);
      const timeout = setTimeout(() => {
        ws.close();
        console.log(`[WS Proxy] Timeout connecting to ${url}, trying next...`);
        tryConnectHA(urls, index + 1).then(resolve).catch(reject);
      }, 5000);

      ws.on('open', () => {
        clearTimeout(timeout);
        console.log(`[WS Proxy] Connected to HA at ${url}`);
        resolve(ws);
      });

      ws.on('error', (err) => {
        clearTimeout(timeout);
        console.log(`[WS Proxy] Failed to connect to ${url}: ${err.message}`);
        tryConnectHA(urls, index + 1).then(resolve).catch(reject);
      });
    });
  }

  async function handleHAProxy(clientWs: WsWebSocket) {
    const supervisorToken = process.env.SUPERVISOR_TOKEN;
    if (!supervisorToken) {
      console.error('[WS Proxy] No SUPERVISOR_TOKEN available');
      clientWs.send(JSON.stringify({ type: 'auth_invalid', message: 'No supervisor token available' }));
      clientWs.close();
      return;
    }

    console.log('[WS Proxy] Client connected, finding HA Core...');

    let haWs: WsWebSocket;
    try {
      haWs = await tryConnectHA(HA_WS_URLS, 0);
    } catch (err: any) {
      console.error(`[WS Proxy] Could not connect to HA Core: ${err.message}`);
      clientWs.send(JSON.stringify({ type: 'auth_invalid', message: 'Could not reach HA Core' }));
      clientWs.close();
      return;
    }

    let haAuthenticated = false;
    const pendingMessages: string[] = [];

    haWs.on('message', (data) => {
      const str = data.toString();
      try {
        const msg = JSON.parse(str);

        if (msg.type === 'auth_required') {
          console.log('[WS Proxy] HA requires auth, forwarding to client');
          if (clientWs.readyState === WsWebSocket.OPEN) {
            clientWs.send(str);
          }
          return;
        }

        if (msg.type === 'auth_ok') {
          haAuthenticated = true;
          console.log(`[WS Proxy] Auth OK! HA version: ${msg.ha_version}`);
          if (clientWs.readyState === WsWebSocket.OPEN) {
            clientWs.send(str);
          }
          for (const m of pendingMessages) {
            if (haWs.readyState === WsWebSocket.OPEN) {
              haWs.send(m);
            }
          }
          pendingMessages.length = 0;
          return;
        }

        if (msg.type === 'auth_invalid') {
          console.error(`[WS Proxy] Auth INVALID: ${msg.message}`);
          if (clientWs.readyState === WsWebSocket.OPEN) {
            clientWs.send(str);
          }
          cleanup();
          return;
        }
      } catch {
        // Not JSON, forward as-is
      }

      if (clientWs.readyState === WsWebSocket.OPEN) {
        clientWs.send(str);
      }
    });

    clientWs.on('message', (data) => {
      const str = data.toString();
      try {
        const msg = JSON.parse(str);

        if (msg.type === 'auth') {
          console.log('[WS Proxy] Intercepting client auth, using SUPERVISOR_TOKEN');
          if (haWs.readyState === WsWebSocket.OPEN) {
            haWs.send(JSON.stringify({
              type: 'auth',
              access_token: supervisorToken,
            }));
          }
          return;
        }
      } catch {
        // Not JSON, forward as-is
      }

      if (!haAuthenticated) {
        pendingMessages.push(str);
        return;
      }

      if (haWs.readyState === WsWebSocket.OPEN) {
        haWs.send(str);
      }
    });

    function cleanup() {
      if (haWs.readyState === WsWebSocket.OPEN || haWs.readyState === WsWebSocket.CONNECTING) {
        haWs.close();
      }
      if (clientWs.readyState === WsWebSocket.OPEN || clientWs.readyState === WsWebSocket.CONNECTING) {
        clientWs.close();
      }
    }

    clientWs.on('close', () => {
      console.log('[WS Proxy] Client disconnected');
      cleanup();
    });

    haWs.on('close', () => {
      console.log('[WS Proxy] HA Core disconnected');
      cleanup();
    });

    clientWs.on('error', (err) => {
      console.error('[WS Proxy] Client error:', err.message);
      cleanup();
    });

    haWs.on('error', (err) => {
      console.error('[WS Proxy] HA Core error:', err.message);
      cleanup();
    });
  }

  console.log('[WS Proxy] WebSocket proxy enabled for ingress mode');
}
