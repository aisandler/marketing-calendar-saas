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
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [authError, setAuthError] = useState<Error | null>(null);

  // Function to fetch user data from the users table
  const fetchUserData = async (userId: string): Promise<User | null> => {
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (userError) {
        console.error('Error fetching user data:', userError);
        return null;
      }
      
      if (!userData) {
        console.warn('No user data found for ID:', userId);
        return null;
      }
      
      return userData as User;
    } catch (error) {
      console.error('Unexpected error fetching user data:', error);
      return null;
    }
  };

  // Function to refresh the session and user data
  const refreshSession = async (): Promise<void> => {
    try {
      setLoading(true);
      
      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Error refreshing session:', sessionError);
        setUser(null);
        return;
      }
      
      if (!session) {
        console.log('No active session found during refresh');
        setUser(null);
        return;
      }
      
      // Fetch user data
      const userData = await fetchUserData(session.user.id);
      
      if (!userData) {
        console.warn('User data not found during refresh, signing out');
        await supabase.auth.signOut();
        setUser(null);
        return;
      }
      
      setUser(userData);
    } catch (error) {
      console.error('Error in refreshSession:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Get initial session
    const fetchSession = async () => {
      try {
        setLoading(true);
        
        // Check for existing session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error fetching session:', sessionError);
          setAuthError(sessionError);
          setUser(null);
          setLoading(false);
          setAuthInitialized(true);
          return;
        }
        
        if (!session) {
          console.log('No active session found');
          setUser(null);
          setLoading(false);
          setAuthInitialized(true);
          return;
        }
        
        console.log('Session found, fetching user data for ID:', session.user.id);
        
        // Fetch user data
        const userData = await fetchUserData(session.user.id);
        
        if (!userData) {
          console.warn('User data not found, signing out');
          await supabase.auth.signOut();
          setUser(null);
        } else {
          console.log('User data found, setting user state');
          setUser(userData);
        }
      } catch (error) {
        console.error('Unexpected error in fetchSession:', error);
        setAuthError(error instanceof Error ? error : new Error('Unknown error'));
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
          console.log('User signed out');
          setUser(null);
          setLoading(false);
          return;
        }
        
        if (event === 'SIGNED_IN' && session) {
          console.log('User signed in, fetching user data');
          setLoading(true);
          
          try {
            const userData = await fetchUserData(session.user.id);
            
            if (!userData) {
              console.warn('User data not found after sign in, signing out');
              await supabase.auth.signOut();
              setUser(null);
            } else {
              console.log('User data found after sign in, setting user state');
              setUser(userData);
            }
          } catch (error) {
            console.error('Error fetching user data after sign in:', error);
            await supabase.auth.signOut();
            setUser(null);
          } finally {
            setLoading(false);
          }
        }
        
        if (event === 'TOKEN_REFRESHED' && session) {
          console.log('Token refreshed, updating user data');
          setLoading(true);
          
          try {
            const userData = await fetchUserData(session.user.id);
            
            if (userData) {
              setUser(userData);
            }
          } catch (error) {
            console.error('Error updating user data after token refresh:', error);
          } finally {
            setLoading(false);
          }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      setAuthError(null);
      
      // Clear any existing session first to prevent issues
      await supabase.auth.signOut();
      
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        console.error('Sign in error:', error);
        return { error };
      }
      
      // Verify user exists in users table
      if (data.user) {
        const userData = await fetchUserData(data.user.id);
        
        if (!userData) {
          console.error('User not found in users table after sign in:', data.user.id);
          await supabase.auth.signOut();
          return { error: new Error('User account not found. Please contact support.') };
        }
        
        setUser(userData);
        return { error: null };
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
      setAuthError(null);
      
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

        // Fetch the newly created user
        const userData = await fetchUserData(data.user.id);
        if (userData) {
          setUser(userData);
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
