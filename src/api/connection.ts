import {
  createConnection,
  createLongLivedTokenAuth,
  getAuth,
  type Connection,
  type Auth,
} from 'home-assistant-js-websocket';

export interface ConnectionOptions {
  hassUrl: string;
  accessToken: string;
}

export interface AuthInfo {
  mode: 'ingress' | 'standalone';
  supervisorToken?: string | null;
}

// Fetch auth mode from our backend
export async function fetchAuthInfo(): Promise<AuthInfo> {
  try {
    const res = await fetch('./api/auth');
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
export async function connectViaIngress(): Promise<Connection> {
  // When running under ingress, the page is served from the same origin as HA.
  // We use getAuth() which leverages the existing HA session (user is already logged in).
  const hassUrl = window.location.origin;

  let auth: Auth;
  try {
    auth = await getAuth({ hassUrl });
  } catch {
    // Fallback: try without hassUrl (auto-detect)
    auth = await getAuth();
  }

  const connection = await createConnection({ auth });
  return connection;
}

export type { Connection };
