import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { User, UserRole } from '../types';
import { AuthError, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: AuthError | Error | null, user: User | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_STORAGE_KEY = 'marketing-cal-auth';
const TOKEN_REFRESH_THRESHOLD = 4 * 60 * 1000; // 4 minutes in milliseconds

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const authInProgress = useRef<boolean>(false);
  const initializationComplete = useRef<boolean>(false);

  // Function to create a base user from session
  const createBaseUser = (session: Session): User => {
    return {
      id: session.user.id,
      email: session.user.email || '',
      name: session.user.user_metadata?.name || 'User',
      role: 'admin', // Always set as admin for now
      created_at: new Date().toISOString(),
      avatar_url: null
    };
  };

  // Function to handle auth state changes
  const handleAuthStateChange = async (session: Session | null) => {
    try {
      if (!session?.user) {
        setUser(null);
        return;
      }

      // Always create and set a base user first
      const baseUser = createBaseUser(session);
      setUser(baseUser);

      try {
        // Try to fetch user profile, but don't fail if it doesn't exist
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (data) {
          // If we have profile data, use it
          setUser(data);
        } else {
          // If no profile exists, create one with base user data
          const { error: insertError } = await supabase
            .from('users')
            .insert([baseUser]);

          if (insertError) {
            console.error('Error creating user profile:', insertError);
          }
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        // Continue with base user
      }
    } catch (error) {
      console.error('Error in auth state change:', error);
      // Don't clear user state here
    }
  };

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Get current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          if (mounted) {
            setLoading(false);
            initializationComplete.current = true;
          }
          return;
        }

        if (session) {
          await handleAuthStateChange(session);
        }

        if (mounted) {
          setLoading(false);
          initializationComplete.current = true;
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setLoading(false);
          initializationComplete.current = true;
        }
      }
    };

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!initializationComplete.current) return; // Skip if initial load isn't complete

      if (event === 'SIGNED_IN' && session) {
        await handleAuthStateChange(session);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    if (authInProgress.current) {
      return { error: new Error('Auth in progress') as AuthError };
    }

    authInProgress.current = true;
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error };
    } finally {
      setLoading(false);
      authInProgress.current = false;
    }
  };

  const signOut = async () => {
    if (authInProgress.current) return;
    authInProgress.current = true;
    setLoading(true);

    try {
      await supabase.auth.signOut();
      setUser(null);
    } finally {
      setLoading(false);
      authInProgress.current = false;
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    if (authInProgress.current) {
      return { error: new Error('Auth in progress'), user: null };
    }

    authInProgress.current = true;
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } }
      });

      if (error) return { error, user: null };
      if (!data.user) return { error: new Error('No user data'), user: null };

      const newUser: User = {
        id: data.user.id,
        email,
        name,
        role: 'admin',
        created_at: new Date().toISOString(),
        avatar_url: null
      };

      return { error: null, user: newUser };
    } finally {
      setLoading(false);
      authInProgress.current = false;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  };

  const refreshSession = async () => {
    if (authInProgress.current) return;
    authInProgress.current = true;
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await handleAuthStateChange(session);
      }
    } finally {
      setLoading(false);
      authInProgress.current = false;
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    refreshSession
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
