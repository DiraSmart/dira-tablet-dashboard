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

// Connect in ingress mode using HA's existing auth session
// The ingress page is on the same origin as HA, so we can read
// the user's auth tokens from localStorage (key: hassTokens)
export async function connectViaIngress(): Promise<Connection> {
  const hassUrl = window.location.origin;

  // getAuth() will:
  // 1. Try to load tokens from localStorage (same origin = HA's tokens)
  // 2. If tokens found but expired, auto-refresh them
  // 3. If no tokens, redirect to HA auth page (user will come back authenticated)
  const auth = await getAuth({
    hassUrl,
    loadTokens: async () => {
      try {
        const stored = localStorage.getItem('hassTokens');
        if (stored) {
          return JSON.parse(stored);
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
