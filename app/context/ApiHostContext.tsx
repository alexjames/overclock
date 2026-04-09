import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

//export const DEFAULT_API_HOST = 'http://192.168.0.24';
export const DEFAULT_API_HOST = 'https://overclock.buildbreak.net';
const STORAGE_KEY = '@overclock_api_host';

interface ApiHostContextValue {
  apiHost: string;
  setApiHost: (host: string) => Promise<void>;
}

const ApiHostContext = createContext<ApiHostContextValue | null>(null);

export function ApiHostProvider({ children }: { children: ReactNode }) {
  const [apiHost, setApiHostState] = useState<string>(DEFAULT_API_HOST);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored) setApiHostState(stored);
    });
  }, []);

  const setApiHost = useCallback(async (host: string) => {
    await AsyncStorage.setItem(STORAGE_KEY, host);
    setApiHostState(host);
  }, []);

  return (
    <ApiHostContext.Provider value={{ apiHost, setApiHost }}>
      {children}
    </ApiHostContext.Provider>
  );
}

export function useApiHost(): ApiHostContextValue {
  const context = useContext(ApiHostContext);
  if (!context) {
    throw new Error('useApiHost must be used within an ApiHostProvider');
  }
  return context;
}
