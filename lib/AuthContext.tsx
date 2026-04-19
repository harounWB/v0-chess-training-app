'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient, hasSupabaseEnv } from '@/utils/supabase/client';

const GUEST_MODE_STORAGE_KEY = 'guestMode';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error?: string }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  isGuest: boolean;
  setGuestMode: (guest: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Check if user is already logged in
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) {
        setIsGuest(false);
        localStorage.removeItem(GUEST_MODE_STORAGE_KEY);
      } else {
        setIsGuest(localStorage.getItem(GUEST_MODE_STORAGE_KEY) === 'true');
      }
      setLoading(false);
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          setIsGuest(false);
          localStorage.removeItem(GUEST_MODE_STORAGE_KEY);
        } else if (event === 'SIGNED_OUT') {
          setIsGuest(localStorage.getItem(GUEST_MODE_STORAGE_KEY) === 'true');
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    if (!supabase) {
      return { error: 'Authentication is not configured yet.' };
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { error: error?.message };
  };

  const signIn = async (email: string, password: string) => {
    if (!supabase) {
      return { error: 'Authentication is not configured yet.' };
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (!error) {
      setIsGuest(false);
      localStorage.removeItem(GUEST_MODE_STORAGE_KEY);
    }
    return { error: error?.message };
  };

  const signOut = async () => {
    if (!supabase) {
      return;
    }

    await supabase.auth.signOut();
  };

  const setGuestMode = (guest: boolean) => {
    setIsGuest(guest);
    if (guest) {
      localStorage.setItem(GUEST_MODE_STORAGE_KEY, 'true');
    } else {
      localStorage.removeItem(GUEST_MODE_STORAGE_KEY);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signUp,
      signIn,
      signOut,
      isGuest: isGuest || !hasSupabaseEnv,
      setGuestMode,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
