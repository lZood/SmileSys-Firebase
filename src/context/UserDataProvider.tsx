'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getUserData } from '@/app/user/actions';
import { createClient } from '@/lib/supabase/client';

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

  // Supabase client to listen for auth changes
  const supabase = React.useMemo(() => createClient(), []);

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
    // Initial load
    fetchUserData();

    // Subscribe to auth state changes to clear/refetch cached user data
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      console.debug('[UserDataProvider] auth state changed', event);
      if (event === 'SIGNED_OUT' || event === 'INITIAL_SESSION') {
        // Clear local context immediately
        setUserData(null);
        // Trigger a refetch to ensure fresh state (getUserData will return null/no-user)
        fetchUserData();
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        // On sign in or token refresh, refetch user data for the new session
        fetchUserData();
      }
    });

    return () => {
      // cleanup listener
      try { data?.subscription?.unsubscribe(); } catch (e) { /* ignore */ }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
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