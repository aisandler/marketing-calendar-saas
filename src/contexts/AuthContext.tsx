import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: any, user: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);

  useEffect(() => {
    // Get initial session
    const fetchSession = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error fetching session:', sessionError);
          setLoading(false);
          return;
        }
        
        if (session?.user) {
          try {
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();
            
            if (userError) {
              console.error('Error fetching user data:', userError);
              // If we can't get user data, clear the session to prevent loops
              await supabase.auth.signOut();
              setUser(null);
            } else if (userData) {
              setUser(userData as User);
            } else {
              // User exists in auth but not in users table
              console.warn('User exists in auth but not in users table:', session.user.id);
              // Clear the session to prevent loops
              await supabase.auth.signOut();
              setUser(null);
            }
          } catch (error) {
            console.error('Unexpected error fetching user data:', error);
            // Clear the session to prevent loops
            await supabase.auth.signOut();
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Unexpected error in fetchSession:', error);
        setUser(null);
      } finally {
        setLoading(false);
        setAuthInitialized(true);
      }
    };

    fetchSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setLoading(false);
          return;
        }
        
        if (session?.user) {
          try {
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();
            
            if (userError) {
              console.error('Error fetching user data on auth change:', userError);
              setUser(null);
            } else if (userData) {
              setUser(userData as User);
            } else {
              console.warn('User not found in users table on auth change:', session.user.id);
              setUser(null);
            }
          } catch (error) {
            console.error('Unexpected error fetching user data on auth change:', error);
            setUser(null);
          }
        } else {
          setUser(null);
        }
        
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      // Clear any existing session first to prevent issues
      await supabase.auth.signOut();
      
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        console.error('Sign in error:', error);
        return { error };
      }
      
      // Verify user exists in users table
      if (data.user) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();
        
        if (userError || !userData) {
          console.error('User not found in users table after sign in:', data.user.id);
          await supabase.auth.signOut();
          return { error: new Error('User account not found. Please contact support.') };
        }
        
        setUser(userData as User);
      }
      
      return { error: null };
    } catch (error) {
      console.error('Unexpected error during sign in:', error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password, 
        options: {
          data: {
            name
          }
        }
      });

      if (!error && data.user) {
        // Create user profile in users table
        const { error: profileError } = await supabase
          .from('users')
          .insert([
            {
              id: data.user.id,
              email,
              name,
              role: 'contributor', // Default role for new users
              created_at: new Date().toISOString()
            }
          ]);

        if (profileError) {
          console.error('Error creating user profile:', profileError);
          // Clean up auth user if profile creation fails
          await supabase.auth.signOut();
          return { error: profileError, user: null };
        }

        return { error: null, user: data.user };
      }

      return { error, user: null };
    } catch (error) {
      console.error('Unexpected error during sign up:', error);
      return { error, user: null };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      return { error };
    } catch (error) {
      console.error('Error resetting password:', error);
      return { error };
    }
  };

  const value = {
    user,
    loading: loading && !authInitialized, // Only show loading on initial load
    signIn,
    signUp,
    signOut,
    resetPassword
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
