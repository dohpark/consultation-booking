import { createContext } from 'react';
import type { ReactNode } from 'react';
import type { AuthContextType, User } from '../types';
import { useAuthQuery } from '../hooks/useAuthQuery';
import { useQueryClient } from '@tanstack/react-query';
import { AUTH_QUERY_KEYS } from '../hooks/useAuthQuery';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, isLoading, isAuthenticated, refetch, logout } = useAuthQuery();
  const queryClient = useQueryClient();

  const login = (userData: User) => {
    // react-query의 setQueryData를 사용하여 사용자 데이터 업데이트
    queryClient.setQueryData(AUTH_QUERY_KEYS.profile(), userData);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        login,
        logout,
        checkAuth: async () => {
          await refetch();
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
