import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { configRoutes } from './routes/config.js';
import { discoveryRoutes } from './routes/discovery.js';
import { ConfigService } from './services/configService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = parseInt(process.env.PORT || '3000');
const IS_ADDON = process.env.ADDON === 'true';
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');

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
    supervisorToken: !!process.env.SUPERVISOR_TOKEN,
    nodeVersion: process.version,
  };

  if (IS_ADDON && process.env.SUPERVISOR_TOKEN) {
    try {
      const r = await fetch('http://supervisor/core/api/', {
        headers: { Authorization: `Bearer ${process.env.SUPERVISOR_TOKEN}` },
      });
      info.supervisorCoreApi = { status: r.status, ok: r.ok };
    } catch (e: any) {
      info.supervisorCoreApi = { error: e.message };
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

app.listen(PORT, () => {
  console.log(`Dira Dashboard server running on port ${PORT}`);
  console.log(`Mode: ${IS_ADDON ? 'Add-on' : 'Standalone'}`);
  console.log(`Data dir: ${DATA_DIR}`);
});
