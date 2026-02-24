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
  token?: string | null;
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

// Connect in ingress mode.
// Strategy order:
// 1. Server-provided token (configured in add-on settings) — works everywhere
// 2. localStorage tokens from HA frontend session (browser only)
// 3. OAuth redirect via getAuth() (last resort)
export async function connectViaIngress(serverToken?: string | null): Promise<Connection> {
  const hassUrl = window.location.origin;

  // Strategy 1: Use the long-lived token configured in the add-on settings.
  // This works on ALL devices (browser, Companion App, any tablet).
  if (serverToken) {
    const auth = createLongLivedTokenAuth(hassUrl, serverToken);
    const connection = await createConnection({ auth });
    return connection;
  }

  // Strategy 2 & 3: Browser fallback — localStorage tokens, then OAuth redirect
  const auth = await getAuth({
    hassUrl,
    loadTokens: async () => {
      try {
        const raw = localStorage.getItem('hassTokens');
        if (raw) {
          const tokens = JSON.parse(raw) as AuthData;
          // Override hassUrl to match current origin (cross-hostname support)
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
