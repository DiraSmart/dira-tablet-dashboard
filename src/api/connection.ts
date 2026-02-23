import {
  createConnection,
  createLongLivedTokenAuth,
  getAuth,
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

// Connect in ingress mode through our server's WebSocket proxy.
// The server authenticates with HA using the Supervisor token,
// so the frontend doesn't need any OAuth or tokens.
export async function connectViaIngress(): Promise<Connection> {
  // Use the ingress base URL so the WebSocket goes through our server proxy
  // e.g. ws://ha-ip:8123/hassio/ingress/slug/api/websocket
  const hassUrl = getApiBaseUrl();

  // Use a dummy token - the server proxy handles real auth with HA
  const auth = createLongLivedTokenAuth(hassUrl, 'proxy');
  const connection = await createConnection({ auth });
  return connection;
}

export type { Connection };
