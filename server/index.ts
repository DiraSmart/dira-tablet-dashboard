import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocket, WebSocketServer } from 'ws';
import { configRoutes } from './routes/config.js';
import { discoveryRoutes } from './routes/discovery.js';
import { ConfigService } from './services/configService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const server = http.createServer(app);
const PORT = parseInt(process.env.PORT || '3000');
const IS_ADDON = process.env.ADDON === 'true';
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const SUPERVISOR_TOKEN = process.env.SUPERVISOR_TOKEN || '';

// Try multiple HA Core WebSocket URLs - different HA versions use different internal hostnames
const HA_WS_URLS = [
  'ws://supervisor/core/websocket',
  'ws://homeassistant:8123/api/websocket',
  'ws://localhost:8123/api/websocket',
  'ws://127.0.0.1:8123/api/websocket',
];

app.use(express.json({ limit: '10mb' }));

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
  res.json({ status: 'ok', version: '0.8.1', addon: IS_ADDON });
});

// Auth info endpoint
app.get('/api/auth', (_req, res) => {
  if (IS_ADDON) {
    res.json({ mode: 'ingress' });
  } else {
    res.json({ mode: 'standalone' });
  }
});

// Enhanced debug endpoint - tests connectivity to HA Core
app.get('/api/debug', async (_req, res) => {
  const info: Record<string, unknown> = {
    version: '0.8.1',
    addon: IS_ADDON,
    supervisorToken: !!SUPERVISOR_TOKEN,
    supervisorTokenLength: SUPERVISOR_TOKEN.length,
    nodeVersion: process.version,
    env: {
      ADDON: process.env.ADDON,
      SUPERVISOR_TOKEN: SUPERVISOR_TOKEN ? `${SUPERVISOR_TOKEN.substring(0, 8)}...` : 'not set',
    },
  };

  // Test Supervisor REST API
  if (IS_ADDON && SUPERVISOR_TOKEN) {
    try {
      const r = await fetch('http://supervisor/core/api/', {
        headers: { Authorization: `Bearer ${SUPERVISOR_TOKEN}` },
      });
      info.supervisorCoreApi = { status: r.status, ok: r.ok };
    } catch (e: any) {
      info.supervisorCoreApi = { error: e.message };
    }

    // Test direct HA Core REST API
    try {
      const r = await fetch('http://homeassistant:8123/api/', {
        headers: { Authorization: `Bearer ${SUPERVISOR_TOKEN}` },
      });
      const body = await r.text();
      info.directHaCoreApi = { status: r.status, ok: r.ok, body: body.substring(0, 200) };
    } catch (e: any) {
      info.directHaCoreApi = { error: e.message };
    }
  }

  // Test WebSocket connectivity
  if (IS_ADDON && SUPERVISOR_TOKEN) {
    const wsResults: Record<string, unknown> = {};
    const testPromises = HA_WS_URLS.map((url) =>
      testWsConnection(url).then((result) => {
        wsResults[url] = result;
      }),
    );
    await Promise.all(testPromises);
    info.wsTests = wsResults;
  }

  res.json(info);
});

// Test a WebSocket connection to HA Core
function testWsConnection(url: string): Promise<Record<string, unknown>> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      ws.close();
      resolve({ error: 'timeout (5s)', connected: false });
    }, 5000);

    const ws = new WebSocket(url);

    ws.on('open', () => {
      // Connected, wait for auth_required
    });

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'auth_required') {
          // Try authenticating with Supervisor token
          ws.send(JSON.stringify({ type: 'auth', access_token: SUPERVISOR_TOKEN }));
        } else if (msg.type === 'auth_ok') {
          clearTimeout(timeout);
          ws.close();
          resolve({ connected: true, authenticated: true, ha_version: msg.ha_version });
        } else if (msg.type === 'auth_invalid') {
          clearTimeout(timeout);
          ws.close();
          resolve({ connected: true, authenticated: false, message: msg.message });
        }
      } catch {
        clearTimeout(timeout);
        ws.close();
        resolve({ connected: true, parseError: true });
      }
    });

    ws.on('error', (err) => {
      clearTimeout(timeout);
      resolve({ connected: false, error: err.message });
    });
  });
}

// ─── WebSocket proxy (ingress mode only) ───
// Finds a working HA Core WebSocket URL and proxies connections through it.
let workingWsUrl: string | null = null;

if (IS_ADDON && SUPERVISOR_TOKEN) {
  const wss = new WebSocketServer({ noServer: true });

  // On startup, find a working HA WebSocket URL
  (async () => {
    for (const url of HA_WS_URLS) {
      console.log(`[WS Proxy] Testing ${url}...`);
      const result = await testWsConnection(url);
      console.log(`[WS Proxy] ${url} →`, JSON.stringify(result));
      if (result.authenticated) {
        workingWsUrl = url;
        console.log(`[WS Proxy] Using ${url} for WebSocket proxy`);
        break;
      }
    }
    if (!workingWsUrl) {
      console.error('[WS Proxy] No working HA WebSocket URL found! Proxy will not work.');
    }
  })();

  server.on('upgrade', (req, socket, head) => {
    const url = req.url || '';
    if (url.endsWith('/api/websocket') || url === '/api/websocket') {
      wss.handleUpgrade(req, socket, head, (clientWs) => {
        handleWsProxy(clientWs);
      });
    } else {
      socket.destroy();
    }
  });

  function handleWsProxy(clientWs: WebSocket) {
    if (!workingWsUrl) {
      console.error('[WS Proxy] No working HA URL available');
      clientWs.send(JSON.stringify({ type: 'auth_invalid', message: 'No HA connection available' }));
      clientWs.close();
      return;
    }

    const haWs = new WebSocket(workingWsUrl);
    let haAuthenticated = false;
    let clientAuthPending = false;
    const pendingMessages: string[] = [];

    haWs.on('open', () => {
      console.log('[WS Proxy] Connected to HA Core at', workingWsUrl);
    });

    haWs.on('message', (data) => {
      const msg = data.toString();
      try {
        const parsed = JSON.parse(msg);

        if (parsed.type === 'auth_required') {
          haWs.send(JSON.stringify({ type: 'auth', access_token: SUPERVISOR_TOKEN }));
          return;
        }

        if (parsed.type === 'auth_ok') {
          haAuthenticated = true;
          console.log('[WS Proxy] Authenticated with HA Core');
          // If client already sent auth, respond now
          if (clientAuthPending) {
            clientWs.send(JSON.stringify({ type: 'auth_ok', ha_version: parsed.ha_version }));
          }
          // Flush queued messages
          for (const queued of pendingMessages) {
            haWs.send(queued);
          }
          pendingMessages.length = 0;
          return;
        }

        if (parsed.type === 'auth_invalid') {
          console.error('[WS Proxy] Auth rejected:', parsed.message);
          clientWs.send(JSON.stringify({ type: 'auth_invalid', message: 'Proxy auth failed' }));
          clientWs.close();
          return;
        }

        // Forward all other messages to client
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(msg);
        }
      } catch {
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(msg);
        }
      }
    });

    clientWs.on('message', (data) => {
      const msg = data.toString();
      try {
        const parsed = JSON.parse(msg);

        // Intercept client auth - we handle auth ourselves
        if (parsed.type === 'auth') {
          clientAuthPending = true;
          if (haAuthenticated) {
            clientWs.send(JSON.stringify({ type: 'auth_ok', ha_version: '' }));
          }
          return;
        }

        // Forward to HA or queue
        if (haAuthenticated && haWs.readyState === WebSocket.OPEN) {
          haWs.send(msg);
        } else {
          pendingMessages.push(msg);
        }
      } catch {
        if (haAuthenticated && haWs.readyState === WebSocket.OPEN) {
          haWs.send(msg);
        }
      }
    });

    clientWs.on('close', () => {
      if (haWs.readyState === WebSocket.OPEN || haWs.readyState === WebSocket.CONNECTING) {
        haWs.close();
      }
    });

    haWs.on('close', () => {
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.close();
      }
    });

    clientWs.on('error', () => haWs.close());
    haWs.on('error', (err) => {
      console.error('[WS Proxy] Error:', err.message);
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.close();
      }
    });

    // Start the protocol with the client
    clientWs.send(JSON.stringify({ type: 'auth_required', ha_version: '' }));
  }

  console.log('[WS Proxy] WebSocket proxy enabled');
}

// Serve SPA in production
const clientDir = path.join(__dirname, '../client');
app.use(express.static(clientDir));
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(clientDir, 'index.html'));
  }
});

server.listen(PORT, () => {
  console.log(`Dira Dashboard v0.8.1 running on port ${PORT}`);
  console.log(`Mode: ${IS_ADDON ? 'Add-on (ingress + WS proxy)' : 'Standalone'}`);
  console.log(`Data dir: ${DATA_DIR}`);
});
