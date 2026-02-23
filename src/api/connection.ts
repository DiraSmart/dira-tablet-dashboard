import {
  createConnection,
  createLongLivedTokenAuth,
  getAuth,
  type Connection,
  type AuthData,
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

// Connect in ingress mode using HA's existing auth session.
// Since ingress runs on the same origin as HA frontend,
// we can read auth tokens directly from localStorage.
// In the Companion App, getAuth() handles auth via OAuth redirect
// which the app manages natively.
export async function connectViaIngress(): Promise<Connection> {
  const hassUrl = window.location.origin;

  const auth = await getAuth({
    hassUrl,
    loadTokens: async () => {
      try {
        const raw = localStorage.getItem('hassTokens');
        if (raw) {
          const tokens = JSON.parse(raw) as AuthData;
          // Override hassUrl to match current origin.
          // Tokens might have been saved with a different hostname
          // (e.g., homeassistant.local vs 192.168.1.x) but they're
          // still valid - the access_token/refresh_token work regardless.
          tokens.hassUrl = hassUrl;
          return tokens;
        }
      } catch {
        // ignore parse errors
      }
      return undefined;
    },
    saveTokens: (tokens) => {
      try {
        if (tokens) {
          localStorage.setItem('hassTokens', JSON.stringify(tokens));
        }
      } catch {
        // ignore storage errors
      }
    },
  });

  const connection = await createConnection({ auth });
  return connection;
}

export type { Connection };
