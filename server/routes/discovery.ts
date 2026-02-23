import { Router } from 'express';
import type { ConfigService } from '../services/configService.js';

export function discoveryRoutes(configService: ConfigService): Router {
  const router = Router();

  // Trigger auto-discovery - the frontend handles the actual HA connection
  // This endpoint receives discovered data from the frontend and generates config
  router.post('/discover', async (req, res) => {
    try {
      const { hassUrl, hassToken, areas, devices, entities } = req.body;

      if (!hassUrl || !areas || !entities) {
        return res.status(400).json({ error: 'Missing required discovery data' });
      }

      // Build device -> area map
      const deviceAreaMap = new Map<string, string>();
      for (const d of devices || []) {
        if (d.area_id) deviceAreaMap.set(d.id, d.area_id);
      }

      // Build area -> entity list
      const areaEntities = new Map<string, string[]>();
      for (const e of entities) {
        if (e.disabled_by || e.hidden_by) continue;
        const areaId = e.area_id || (e.device_id ? deviceAreaMap.get(e.device_id) : undefined);
        if (!areaId) continue;
        const list = areaEntities.get(areaId) || [];
        list.push(e.entity_id);
        areaEntities.set(areaId, list);
      }

      const areaConfigs = areas.map((area: any, index: number) => ({
        areaId: area.area_id,
        displayName: area.name,
        icon: area.icon || 'mdi:home-floor-1',
        order: index,
        visible: true,
        entityIds: areaEntities.get(area.area_id) || [],
        entityOverrides: {},
      }));

      const config = {
        version: 1,
        hassUrl,
        hassToken: hassToken || '',
        areas: areaConfigs,
        globalEntityOverrides: {},
        sidebar: {
          items: [
            { id: 'home', label: 'Home', icon: 'mdi:home', visible: true, order: 0 },
            { id: 'lights', label: 'Lights', icon: 'mdi:lightbulb-group', visible: true, order: 1 },
            { id: 'climate', label: 'Climate', icon: 'mdi:thermometer', visible: true, order: 2 },
            { id: 'covers', label: 'Covers', icon: 'mdi:blinds', visible: true, order: 3 },
            { id: 'cameras', label: 'Cameras', icon: 'mdi:cctv', visible: true, order: 4 },
            { id: 'security', label: 'Security', icon: 'mdi:shield-home', visible: true, order: 5 },
            { id: 'settings', label: 'Settings', icon: 'mdi:cog', visible: true, order: 6 },
          ],
          showConnectionStatus: true,
          showClock: true,
        },
        theme: { mode: 'dark', accentColor: '#3B82F6', reducedMotion: false },
        performance: {
          sensorDebounceMs: 2000,
          enableCameraStreams: false,
          maxVisibleEntities: 50,
          enableBackdropBlur: true,
        },
      };

      await configService.saveConfig(config);
      res.json(config);
    } catch {
      res.status(500).json({ error: 'Failed to generate config' });
    }
  });

  return router;
}
