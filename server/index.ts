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
  res.json({ status: 'ok', version: '0.3.0', addon: IS_ADDON });
});

// Auth info endpoint - tells the frontend how to connect
app.get('/api/auth', (_req, res) => {
  if (IS_ADDON) {
    res.json({ mode: 'ingress' });
  } else {
    res.json({ mode: 'standalone' });
  }
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
// Proxies frontend WS connections to HA Core via Supervisor internal network
if (IS_ADDON) {
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request: IncomingMessage, socket: Duplex, head: Buffer) => {
    const url = request.url || '';
    if (url === '/api/websocket' || url.endsWith('/api/websocket')) {
      wss.handleUpgrade(request, socket, head, (ws) => {
        handleHAProxy(ws);
      });
    }
  });

  function handleHAProxy(clientWs: WsWebSocket) {
    const supervisorToken = process.env.SUPERVISOR_TOKEN;
    if (!supervisorToken) {
      console.error('[WS Proxy] No SUPERVISOR_TOKEN available');
      clientWs.send(JSON.stringify({ type: 'auth_invalid', message: 'No supervisor token available' }));
      clientWs.close();
      return;
    }

    console.log('[WS Proxy] Client connected, opening connection to HA Core...');

    const haWs = new WsWebSocket('ws://supervisor/core/websocket');
    let haAuthenticated = false;
    const pendingMessages: string[] = [];

    haWs.on('open', () => {
      console.log('[WS Proxy] Connected to HA Core WebSocket');
    });

    haWs.on('message', (data) => {
      const str = data.toString();
      try {
        const msg = JSON.parse(str);

        if (msg.type === 'auth_required') {
          if (clientWs.readyState === WsWebSocket.OPEN) {
            clientWs.send(str);
          }
          return;
        }

        if (msg.type === 'auth_ok') {
          haAuthenticated = true;
          console.log('[WS Proxy] Authenticated with HA Core');
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
          console.error('[WS Proxy] Auth invalid from HA Core');
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
