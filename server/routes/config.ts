import { Router } from 'express';
import type { ConfigService } from '../services/configService.js';

export function configRoutes(configService: ConfigService): Router {
  const router = Router();

  router.get('/config', async (_req, res) => {
    try {
      const config = await configService.getConfig();
      if (!config) {
        return res.status(404).json({ error: 'No configuration found' });
      }
      res.json(config);
    } catch {
      res.status(500).json({ error: 'Failed to read config' });
    }
  });

  router.put('/config', async (req, res) => {
    try {
      await configService.saveConfig(req.body);
      res.json({ success: true });
    } catch {
      res.status(500).json({ error: 'Failed to save config' });
    }
  });

  router.patch('/config', async (req, res) => {
    try {
      const updated = await configService.mergeConfig(req.body);
      res.json(updated);
    } catch {
      res.status(500).json({ error: 'Failed to update config' });
    }
  });

  router.get('/config/export', async (_req, res) => {
    try {
      const config = await configService.getConfig();
      if (!config) {
        return res.status(404).json({ error: 'No configuration found' });
      }
      res.setHeader('Content-Disposition', 'attachment; filename=dira-config.json');
      res.json(config);
    } catch {
      res.status(500).json({ error: 'Failed to export config' });
    }
  });

  router.post('/config/import', async (req, res) => {
    try {
      if (!req.body.version) {
        return res.status(400).json({ error: 'Invalid config format' });
      }
      await configService.saveConfig(req.body);
      res.json({ success: true });
    } catch {
      res.status(500).json({ error: 'Failed to import config' });
    }
  });

  return router;
}
