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

// Connect in ingress mode using HA's existing auth session
// Strategy:
// 1. If a Supervisor token is provided, use it directly (most reliable, works on all devices)
// 2. Fallback: try localStorage tokens via getAuth() (works if user already logged into HA)
export async function connectViaIngress(supervisorToken?: string | null): Promise<Connection> {
  const hassUrl = window.location.origin;

  // Strategy 1: Use Supervisor token directly - bypasses OAuth entirely
  // This works on ANY device that can access the ingress page
  if (supervisorToken) {
    const auth = createLongLivedTokenAuth(hassUrl, supervisorToken);
    const connection = await createConnection({ auth });
    return connection;
  }

  // Strategy 2: Fallback to OAuth (dev mode, or if no Supervisor token available)
  const auth = await getAuth({
    hassUrl,
    redirectUrl: `${window.location.origin}${window.location.pathname}`,
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
