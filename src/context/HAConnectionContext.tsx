import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { Connection } from 'home-assistant-js-websocket';
import { connectToHA, type ConnectionOptions } from '@/api/connection';
import { useEntityStore } from '@/store/entityStore';

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

interface HAConnectionContextValue {
  connection: Connection | null;
  status: ConnectionStatus;
  error: string | null;
  connect: (options: ConnectionOptions) => Promise<void>;
  disconnect: () => void;
}

const HAConnectionContext = createContext<HAConnectionContextValue>({
  connection: null,
  status: 'disconnected',
  error: null,
  connect: async () => {},
  disconnect: () => {},
});

export function HAConnectionProvider({ children }: { children: ReactNode }) {
  const [connection, setConnection] = useState<Connection | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const subscribeEntities = useEntityStore((s) => s.subscribe);

  const disconnect = useCallback(() => {
    if (connection) {
      connection.close();
      setConnection(null);
      setStatus('disconnected');
    }
  }, [connection]);

  const connect = useCallback(async (options: ConnectionOptions) => {
    setStatus('connecting');
    setError(null);
    try {
      const conn = await connectToHA(options);
      setConnection(conn);
      setStatus('connected');

      const unsub = subscribeEntities(conn);

      conn.addEventListener('disconnected', () => setStatus('disconnected'));
      conn.addEventListener('ready', () => setStatus('connected'));
      conn.addEventListener('reconnect-error', () => {
        setStatus('error');
        setError('Failed to reconnect');
      });

      // Store cleanup function
      (conn as any).__unsub = unsub;
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Connection failed');
      throw err;
    }
  }, [subscribeEntities]);

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
    <HAConnectionContext.Provider value={{ connection, status, error, connect, disconnect }}>
      {children}
    </HAConnectionContext.Provider>
  );
}

export function useHAConnection() {
  return useContext(HAConnectionContext);
}
