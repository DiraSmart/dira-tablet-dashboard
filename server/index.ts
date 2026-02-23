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
const HA_WS_URL = 'ws://supervisor/core/websocket';

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
  res.json({ status: 'ok', version: '0.8.0', addon: IS_ADDON });
});

// Auth info endpoint - tells the frontend how to connect
app.get('/api/auth', (_req, res) => {
  if (IS_ADDON) {
    // In ingress mode, the frontend connects through our WebSocket proxy
    // so it doesn't need OAuth or tokens at all
    res.json({ mode: 'ingress' });
  } else {
    res.json({ mode: 'standalone' });
  }
});

// Debug endpoint - helps diagnose connection issues
app.get('/api/debug', async (_req, res) => {
  const info: Record<string, unknown> = {
    version: '0.8.0',
    addon: IS_ADDON,
    supervisorToken: !!SUPERVISOR_TOKEN,
    nodeVersion: process.version,
  };

  if (IS_ADDON && SUPERVISOR_TOKEN) {
    try {
      const r = await fetch('http://supervisor/core/api/', {
        headers: { Authorization: `Bearer ${SUPERVISOR_TOKEN}` },
      });
      info.supervisorCoreApi = { status: r.status, ok: r.ok };
    } catch (e: any) {
      info.supervisorCoreApi = { error: e.message };
    }
  }

  res.json(info);
});

// ─── WebSocket proxy (ingress mode only) ───
// The frontend connects to our /api/websocket, and we proxy to HA Core's
// WebSocket using the Supervisor token. This avoids OAuth redirect issues
// and works from ANY device that can access HA ingress.
if (IS_ADDON && SUPERVISOR_TOKEN) {
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (req, socket, head) => {
    // Accept WebSocket upgrades on /api/websocket (with or without ingress path prefix)
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
    // Connect to HA Core via Supervisor internal network
    const haWs = new WebSocket(HA_WS_URL);
    let haAuthenticated = false;
    let clientAuthenticated = false;
    const pendingMessages: string[] = [];

    haWs.on('open', () => {
      console.log('[WS Proxy] Connected to HA Core');
    });

    haWs.on('message', (data) => {
      const msg = data.toString();
      try {
        const parsed = JSON.parse(msg);

        // HA sends auth_required - we authenticate with Supervisor token
        if (parsed.type === 'auth_required') {
          haWs.send(JSON.stringify({
            type: 'auth',
            access_token: SUPERVISOR_TOKEN,
          }));
          return;
        }

        // HA confirms our auth - now tell the client it can proceed
        if (parsed.type === 'auth_ok') {
          haAuthenticated = true;
          // If client already sent auth, confirm them too
          if (!clientAuthenticated) {
            clientAuthenticated = true;
            clientWs.send(JSON.stringify({ type: 'auth_ok', ha_version: parsed.ha_version }));
          }
          // Flush any messages the client sent while we were authenticating
          for (const queued of pendingMessages) {
            haWs.send(queued);
          }
          pendingMessages.length = 0;
          return;
        }

        if (parsed.type === 'auth_invalid') {
          console.error('[WS Proxy] HA rejected Supervisor token:', parsed.message);
          clientWs.send(JSON.stringify({ type: 'auth_invalid', message: 'Proxy auth failed' }));
          clientWs.close();
          return;
        }

        // All other messages: forward to client
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(msg);
        }
      } catch {
        // Non-JSON message, forward as-is
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(msg);
        }
      }
    });

    clientWs.on('message', (data) => {
      const msg = data.toString();
      try {
        const parsed = JSON.parse(msg);

        // Client sends auth - we handle it ourselves (the proxy authenticates for them)
        if (parsed.type === 'auth') {
          // Send auth_required first so the library protocol is satisfied
          // then auth_ok if HA is already authenticated
          if (haAuthenticated) {
            clientAuthenticated = true;
            clientWs.send(JSON.stringify({ type: 'auth_ok', ha_version: '' }));
          }
          // If HA isn't authenticated yet, we'll send auth_ok when it is
          return;
        }

        // All other messages: forward to HA (or queue if not yet authenticated)
        if (haAuthenticated) {
          if (haWs.readyState === WebSocket.OPEN) {
            haWs.send(msg);
          }
        } else {
          pendingMessages.push(msg);
        }
      } catch {
        // Non-JSON, forward
        if (haAuthenticated && haWs.readyState === WebSocket.OPEN) {
          haWs.send(msg);
        }
      }
    });

    // Clean up on close
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
      console.error('[WS Proxy] HA WebSocket error:', err.message);
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.close();
      }
    });

    // Send auth_required to client to start the protocol
    clientWs.send(JSON.stringify({ type: 'auth_required', ha_version: '' }));
  }

  console.log('[WS Proxy] WebSocket proxy enabled for ingress mode');
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
  console.log(`Dira Dashboard server running on port ${PORT}`);
  console.log(`Mode: ${IS_ADDON ? 'Add-on (ingress + WS proxy)' : 'Standalone'}`);
  console.log(`Data dir: ${DATA_DIR}`);
});
