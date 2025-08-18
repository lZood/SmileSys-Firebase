'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getUserData } from '@/app/user/actions';

type UserData = Awaited<ReturnType<typeof getUserData>>;

interface UserDataContextType {
  userData: UserData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const UserDataContext = createContext<UserDataContextType | undefined>(undefined);

export function UserDataProvider({ children }: { children: React.ReactNode }) {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isFetchingRef = React.useRef(false);
  const mountedRef = React.useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const fetchUserData = async () => {
    // Prevent concurrent/duplicate fetches
    if (isFetchingRef.current) {
      console.debug('[UserDataProvider] fetch already in progress, skipping.');
      return;
    }
    isFetchingRef.current = true;

    try {
      console.debug('[UserDataProvider] fetchUserData start');
      setIsLoading(true);
      setError(null);
      const data = await getUserData();
      console.debug('[UserDataProvider] fetchUserData received data:', data);
      if (!mountedRef.current) {
        console.debug('[UserDataProvider] component unmounted before setting state, aborting setUserData');
        return;
      }
      setUserData(data);
      console.debug('[UserDataProvider] userData set in context');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos del usuario');
      console.error('[UserDataProvider] Error fetching user data:', err);
    } finally {
      isFetchingRef.current = false;
      if (mountedRef.current) setIsLoading(false);
      console.debug('[UserDataProvider] fetchUserData finished. isLoading:', mountedRef.current ? false : 'unmounted');
    }
  };

  const refetch = async () => {
    await fetchUserData();
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  return (
    <UserDataContext.Provider value={{ userData, isLoading, error, refetch }}>
      {children}
    </UserDataContext.Provider>
  );
}

export function useUserData() {
  const context = useContext(UserDataContext);
  if (context === undefined) {
    throw new Error('useUserData must be used within a UserDataProvider');
  }
  console.debug('[useUserData] returning context', { isLoading: context.isLoading, hasUser: !!context.userData });
  return context;
}