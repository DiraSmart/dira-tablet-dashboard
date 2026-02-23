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

// ─── Companion App detection & auth ───

// Check if running inside HA Companion App (Android or iOS)
function isCompanionApp(): boolean {
  return !!(window as any).externalApp ||
         !!(window as any).webkit?.messageHandlers?.getExternalAuth;
}

// Request auth token from the Companion App's native bridge.
// The app injects window.externalApp (Android) or webkit messageHandlers (iOS).
// Protocol: call getExternalAuth with a callback name, the app calls the callback
// with (success: boolean, data: {access_token, expires_in}).
function requestExternalToken(): Promise<{ access_token: string; expires_in: number }> {
  return new Promise((resolve, reject) => {
    const callbackName = `_diraAuth_${Date.now()}`;
    const timeout = setTimeout(() => {
      delete (window as any)[callbackName];
      reject(new Error('External auth timeout'));
    }, 10000);

    (window as any)[callbackName] = (success: boolean, data: any) => {
      clearTimeout(timeout);
      delete (window as any)[callbackName];
      if (success) {
        const parsed = typeof data === 'string' ? JSON.parse(data) : data;
        resolve(parsed);
      } else {
        reject(new Error('External auth denied'));
      }
    };

    const payload = JSON.stringify({ callback: callbackName });
    if ((window as any).externalApp) {
      (window as any).externalApp.getExternalAuth(payload);
    } else {
      (window as any).webkit.messageHandlers.getExternalAuth.postMessage({ callback: callbackName });
    }
  });
}

// ─── Public API ───

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
// 1. Companion App native auth (window.externalApp / webkit)
// 2. localStorage tokens from HA frontend (with hassUrl override)
// 3. OAuth redirect via getAuth() (last resort, may cause redirect URI issues)
export async function connectViaIngress(): Promise<Connection> {
  const hassUrl = window.location.origin;

  // Strategy 1: Companion App - get token from native app bridge
  if (isCompanionApp()) {
    try {
      const tokenData = await requestExternalToken();
      const auth = createLongLivedTokenAuth(hassUrl, tokenData.access_token);
      const connection = await createConnection({ auth });
      return connection;
    } catch {
      // Fall through to browser strategies
    }
  }

  // Strategy 2 & 3: Browser - try localStorage tokens, then OAuth redirect
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
