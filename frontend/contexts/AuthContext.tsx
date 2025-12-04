"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import api, { setAccessToken } from "@/lib/axios";
import { AxiosError } from "axios";

export type UserRole = "admin" | "teacher" | "student";

export interface User {
  uuid: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  image?: string; // Backend uses 'image' field
}

interface AuthResponse {
  success: boolean;
  role?: string;
  data?: User;
  access_token?: string;
  error?: string;
  message?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUser = async () => {
    try {
      setLoading(true);
      // Try to refresh token first
      const refreshResponse = await api
        .post<AuthResponse>("/auth/refresh-token")
        .catch((error: AxiosError<AuthResponse>) => {
          console.log("Token refresh failed:", error.message);
          // Check if user was deleted
          if (error.response?.data?.error === "user_deleted") {
            document.cookie =
              "refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
          }
          return null;
        });

      if (refreshResponse?.data.access_token) {
        setAccessToken(refreshResponse.data.access_token);
      }

      const response = await api.get<AuthResponse>("/auth/me");
      if (response.data.success && response.data.data) {
        const userRole = (response.data.role ||
          response.data.data.role) as UserRole;
        const userData = response.data.data;

        // Map 'image' field to 'avatar' for consistency
        setUser({
          ...userData,
          role: userRole,
          avatar: userData.image || userData.avatar,
        });
      }
    } catch (error: unknown) {
      let message = "Sesi berakhir";
      if (error instanceof AxiosError) {
        // Check if user was deleted
        const errorData = error.response?.data as AuthResponse | undefined;
        if (errorData?.error === "user_deleted") {
          message = "Akun telah dihapus";
          document.cookie =
            "refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
        } else {
          message = errorData?.message || "Sesi berakhir";
        }
      } else if (error instanceof Error) {
        message = error.message;
      }
      setError(message);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const refreshUser = async () => {
    await loadUser();
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
      document.cookie =
        "refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
      globalThis.location.href = "/auth/login";
    } catch (error: unknown) {
      console.error("Logout failed:", error);
      globalThis.location.href = "/auth/login";
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
