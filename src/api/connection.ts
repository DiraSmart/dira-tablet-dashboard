import {
  createConnection,
  createLongLivedTokenAuth,
  type Connection,
} from 'home-assistant-js-websocket';
import { getApiBaseUrl } from '@/utils/urlHelpers';

export interface ConnectionOptions {
  hassUrl: string;
  accessToken: string;
}

export interface AuthInfo {
  mode: 'ingress' | 'standalone';
}

// Fetch auth mode from our backend
export async function fetchAuthInfo(): Promise<AuthInfo> {
  try {
    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}/api/auth`);
    return await res.json();
  } catch {
    return { mode: 'standalone' };
  }
}

// Connect in standalone mode with a long-lived token
export async function connectToHA(options: ConnectionOptions): Promise<Connection> {
  const auth = createLongLivedTokenAuth(options.hassUrl, options.accessToken);
  const connection = await createConnection({ auth });
  return connection;
}

// Connect in ingress mode via our backend WebSocket proxy
// The backend proxies WS connections to HA Core using SUPERVISOR_TOKEN
export async function connectViaIngress(): Promise<Connection> {
  const baseUrl = getApiBaseUrl();
  // createLongLivedTokenAuth generates wsUrl as: hassUrl.replace('http','ws') + '/api/websocket'
  // So if baseUrl = 'https://host/hassio/ingress/slug', wsUrl = 'wss://host/hassio/ingress/slug/api/websocket'
  // HA ingress proxies this to our backend at ws://addon:3000/api/websocket
  // Our backend then proxies to ws://supervisor/core/websocket with SUPERVISOR_TOKEN
  const auth = createLongLivedTokenAuth(baseUrl, 'ingress-proxy');
  const connection = await createConnection({ auth });
  return connection;
}

export type { Connection };
