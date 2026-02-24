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
// Long-lived access token configured by the user in the add-on settings
const HA_ACCESS_TOKEN = process.env.HA_ACCESS_TOKEN || '';

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
  res.json({ status: 'ok', version: '0.8.3', addon: IS_ADDON });
});

// Auth info endpoint - provides token to frontend in ingress mode
app.get('/api/auth', (_req, res) => {
  if (IS_ADDON) {
    res.json({
      mode: 'ingress',
      // Provide the configured token so the frontend can connect
      // to HA WebSocket from ANY device (browser, Companion App, etc.)
      // Safe because ingress already requires HA authentication.
      token: HA_ACCESS_TOKEN || null,
    });
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

app.listen(PORT, () => {
  console.log(`Dira Dashboard v0.8.3 running on port ${PORT}`);
  console.log(`Mode: ${IS_ADDON ? 'Add-on' : 'Standalone'}`);
  console.log(`Access token: ${HA_ACCESS_TOKEN ? 'configured' : 'NOT configured'}`);
  console.log(`Data dir: ${DATA_DIR}`);
});
