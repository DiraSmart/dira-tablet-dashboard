import fs from 'fs/promises';
import path from 'path';

export interface DashboardConfigJSON {
  version: number;
  hassUrl: string;
  hassToken: string;
  areas: any[];
  globalEntityOverrides: Record<string, any>;
  sidebar: any;
  theme: any;
  performance: any;
}

export class ConfigService {
  private configPath: string;
  private cache: DashboardConfigJSON | null = null;

  constructor(configPath: string) {
    this.configPath = configPath;
  }

  async getConfig(): Promise<DashboardConfigJSON | null> {
    if (this.cache) return this.cache;
    try {
      const data = await fs.readFile(this.configPath, 'utf-8');
      this.cache = JSON.parse(data);
      return this.cache;
    } catch (err: any) {
      if (err.code === 'ENOENT') return null;
      throw err;
    }
  }

  async saveConfig(config: DashboardConfigJSON): Promise<void> {
    await fs.mkdir(path.dirname(this.configPath), { recursive: true });
    await fs.writeFile(this.configPath, JSON.stringify(config, null, 2));
    this.cache = config;
  }

  async mergeConfig(partial: Partial<DashboardConfigJSON>): Promise<DashboardConfigJSON> {
    const current = await this.getConfig();
    if (!current) throw new Error('No config to merge with');
    const merged = { ...current, ...partial } as DashboardConfigJSON;
    await this.saveConfig(merged);
    return merged;
  }
}
