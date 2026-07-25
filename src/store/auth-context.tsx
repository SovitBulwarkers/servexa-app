import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { AuthAPI, User } from '../api/endpoints';
import { TOKEN_KEY, REFRESH_KEY } from '../api/client';
import { disconnectAllSockets } from '../lib/socket';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isNewUser: boolean;
  sendOtp: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, otp: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  registerWithEmail: (email: string, password: string, name: string) => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false); 

  const bootstrap = useCallback(async () => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (token) {
        const { data } = await AuthAPI.me();
        setUser(data.data);
      }
    } catch {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const sendOtp = async (phone: string) => {
    await AuthAPI.sendOtp(phone, 'CUSTOMER');
  };

  // Shared by verifyOtp/Google/email — stores the token, sets the user,
  // and falls back to /auth/me if the login response didn't include a
  // full user object for some reason.
  const completeLogin = async (auth: { token?: string; user?: User; isNew?: boolean }) => {
    if (auth.token) {
      await SecureStore.setItemAsync(TOKEN_KEY, auth.token);
    }
    setUser(auth.user ?? null);
    setIsNewUser(!!auth.isNew);

    if (!auth.user) {
      const me = await AuthAPI.me();
      setUser(me.data.data ?? me.data);
    }
  };

  const verifyOtp = async (phone: string, otp: string) => {
    const response: any = await AuthAPI.verifyOtp(phone, otp, 'CUSTOMER');
    await completeLogin(response.data.data);
  };

  const loginWithGoogle = async (idToken: string) => {
    const response: any = await AuthAPI.googleLogin(idToken);
    await completeLogin(response.data.data);
  };

  const registerWithEmail = async (email: string, password: string, name: string) => {
    const response: any = await AuthAPI.emailRegister(email, password, name);
    await completeLogin(response.data.data);
  };

  const loginWithEmail = async (email: string, password: string) => {
    const response: any = await AuthAPI.emailLogin(email, password);
    await completeLogin(response.data.data);
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_KEY);
    disconnectAllSockets();
    setUser(null);
  };

  const refreshUser = async () => {
    const { data } = await AuthAPI.me();
    setUser(data.data);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        sendOtp,
        verifyOtp,
        loginWithGoogle,
        registerWithEmail,
        loginWithEmail,
        logout,
        refreshUser,
        isNewUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
