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

  const fetchUserData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getUserData();
      setUserData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos del usuario');
      console.error('Error fetching user data:', err);
    } finally {
      setIsLoading(false);
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
  return context;
}