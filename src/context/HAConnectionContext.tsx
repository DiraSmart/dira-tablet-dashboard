import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { Connection } from 'home-assistant-js-websocket';
import { connectToHA, connectViaIngress, fetchAuthInfo, type ConnectionOptions } from '@/api/connection';
import { useEntityStore } from '@/store/entityStore';

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

interface HAConnectionContextValue {
  connection: Connection | null;
  status: ConnectionStatus;
  error: string | null;
  authMode: 'ingress' | 'standalone' | null;
  connect: (options: ConnectionOptions) => Promise<void>;
  connectIngress: () => Promise<void>;
  disconnect: () => void;
}

const HAConnectionContext = createContext<HAConnectionContextValue>({
  connection: null,
  status: 'disconnected',
  error: null,
  authMode: null,
  connect: async () => {},
  connectIngress: async () => {},
  disconnect: () => {},
});

export function HAConnectionProvider({ children }: { children: ReactNode }) {
  const [connection, setConnection] = useState<Connection | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<'ingress' | 'standalone' | null>(null);
  const subscribeEntities = useEntityStore((s) => s.subscribe);

  const setupConnection = useCallback((conn: Connection) => {
    setConnection(conn);
    setStatus('connected');

    const unsub = subscribeEntities(conn);

    conn.addEventListener('disconnected', () => setStatus('disconnected'));
    conn.addEventListener('ready', () => setStatus('connected'));
    conn.addEventListener('reconnect-error', () => {
      setStatus('error');
      setError('Failed to reconnect');
    });

    (conn as any).__unsub = unsub;
  }, [subscribeEntities]);

  const disconnect = useCallback(() => {
    if (connection) {
      const unsub = (connection as any).__unsub;
      if (unsub) unsub();
      connection.close();
      setConnection(null);
      setStatus('disconnected');
    }
  }, [connection]);

  // Connect with token (standalone mode)
  const connect = useCallback(async (options: ConnectionOptions) => {
    setStatus('connecting');
    setError(null);
    try {
      const conn = await connectToHA(options);
      setupConnection(conn);
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Connection failed');
      throw err;
    }
  }, [setupConnection]);

  // Connect via ingress (add-on mode)
  const connectIngress = useCallback(async () => {
    setStatus('connecting');
    setError(null);
    try {
      const conn = await connectViaIngress();
      setupConnection(conn);
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Ingress connection failed');
      throw err;
    }
  }, [setupConnection]);

  // On mount: detect auth mode and auto-connect if ingress
  useEffect(() => {
    fetchAuthInfo().then((info) => {
      setAuthMode(info.mode);
      if (info.mode === 'ingress') {
        connectIngress().catch(() => {
          // Error is set in state, UI will show it
        });
      }
    });
  }, [connectIngress]);

  useEffect(() => {
    return () => {
      if (connection) {
        const unsub = (connection as any).__unsub;
        if (unsub) unsub();
        connection.close();
      }
    };
  }, [connection]);

  return (
    <HAConnectionContext.Provider value={{ connection, status, error, authMode, connect, connectIngress, disconnect }}>
      {children}
    </HAConnectionContext.Provider>
  );
}

export function useHAConnection() {
  return useContext(HAConnectionContext);
}
