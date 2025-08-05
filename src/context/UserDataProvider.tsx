// src/context/UserDataProvider.tsx
'use client';

import * as React from 'react';
import { getUserData } from '@/app/user/actions'; // Tu server action existente

// Definimos los tipos de datos que proveerá el contexto
type UserData = Awaited<ReturnType<typeof getUserData>>;
type UserDataContextType = {
  userData: UserData | null;
  isLoading: boolean;
  refetch: () => void;
};

// Creamos el contexto
const UserDataContext = React.createContext<UserDataContextType | undefined>(undefined);

// Creamos el proveedor
export function UserDataProvider({ children }: { children: React.ReactNode }) {
  const [userData, setUserData] = React.useState<UserData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchUserData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getUserData();
      setUserData(data);
    } catch (error) {
      console.error("Failed to fetch user data:", error);
      setUserData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  return (
    <UserDataContext.Provider value={{ userData, isLoading, refetch: fetchUserData }}>
      {children}
    </UserDataContext.Provider>
  );
}

// Hook personalizado para usar el contexto fácilmente
export function useUserData() {
  const context = React.useContext(UserDataContext);
  if (context === undefined) {
    throw new Error('useUserData must be used within a UserDataProvider');
  }
  return context;
}