// Re-export from AuthContext
export { useAuth, AuthProvider } from '@/contexts/AuthContext';
export type { User, UserRole } from '@/contexts/AuthContext';

import api, { setAccessToken } from './axios';
import { AxiosError } from 'axios';
import type { User, UserRole } from '@/contexts/AuthContext';

interface AuthResponse {
  success: boolean;
  role?: string;
  data?: User;
  access_token?: string;
}

// Utility function untuk component yang tidak menggunakan hooks
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    // Try to refresh token first if needed
    const refreshResponse = await api.post<AuthResponse>('/auth/refresh-token')
      .catch((error: AxiosError) => {
        console.log('Token refresh failed:', error.message);
        return null;
      });

    if (refreshResponse?.data.access_token) {
      setAccessToken(refreshResponse.data.access_token);
    }

    const response = await api.get<AuthResponse>('/auth/me');
    
    if (response.data.success && response.data.data) {
      const userRole = (response.data.role || response.data.data.role) as UserRole;
      return {
        ...response.data.data,
        role: userRole
      };
    }
    return null;
  } catch (error: unknown) {
    console.error('Failed to get current user:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
};
