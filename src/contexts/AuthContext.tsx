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

// Simple function to fetch user data - kept outside the component to avoid recreating it
const fetchUserData = async (userId: string): Promise<User | null> => {
  try {
    console.log('Fetching user data for ID:', userId);
    
    // Create a promise that rejects after a timeout
    const timeoutPromise = new Promise<null>((_, reject) => {
      setTimeout(() => reject(new Error('Database query timed out')), 5000); // 5 second timeout
    });
    
    // Race the actual query against the timeout
    const result = await Promise.race([
      supabase.from('users').select('*').eq('id', userId).single(),
      timeoutPromise
    ]) as { data: User | null, error: any } | null;
    
    // If we reach here and result is null, it means the timeout won
    if (!result) {
      console.error('Query timed out while fetching user data');
      return null;
    }
    
    const { data, error } = result;
    
    if (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
    
    if (!data) {
      console.warn('No user data found for ID:', userId);
      return null;
    }
    
    console.log('User data fetched successfully:', data);
    return data as User;
  } catch (error) {
    console.error('Unexpected error fetching user data:', error);
    return null;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Initialize auth state
  useEffect(() => {
    const initialize = async () => {
      try {
        setLoading(true);
        console.log('Initializing auth context');
        
        // Get current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setLoading(false);
          setInitialized(true);
          return;
        }
        
        if (session?.user?.id) {
          console.log('Session found, fetching user data');
          
          // Set a timeout to ensure we don't get stuck
          const timeoutId = setTimeout(() => {
            console.error('User data fetch timed out during initialization');
            setUser(null);
            setLoading(false);
            setInitialized(true);
          }, 8000); // 8 second timeout
          
          const userData = await fetchUserData(session.user.id);
          
          // Clear the timeout since we got a response
          clearTimeout(timeoutId);
          
          if (userData) {
            console.log('Setting user data from session');
            setUser(userData);
          } else {
            console.log('No user data found, clearing session');
            // Don't sign out here, just set user to null
            setUser(null);
          }
        } else {
          console.log('No active session');
          setUser(null);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setUser(null);
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    };
    
    initialize();
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        
        if (event === 'SIGNED_IN' && session?.user?.id) {
          setLoading(true);
          console.log('User signed in, fetching user data');
          
          // Set a timeout to ensure we don't get stuck
          const timeoutId = setTimeout(() => {
            console.error('User data fetch timed out on auth state change');
            setUser(null);
            setLoading(false);
          }, 8000); // 8 second timeout
          
          try {
            const userData = await fetchUserData(session.user.id);
            
            // Clear the timeout since we got a response
            clearTimeout(timeoutId);
            
            if (userData) {
              console.log('User data found, setting user state');
              setUser(userData);
            } else {
              console.warn('No user data found after sign in');
              setUser(null);
            }
          } catch (error) {
            // Clear the timeout in case of error
            clearTimeout(timeoutId);
            console.error('Error handling sign in:', error);
            setUser(null);
          } finally {
            setLoading(false);
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out, clearing user state');
          setUser(null);
          setLoading(false);
        } else if (event === 'TOKEN_REFRESHED' && session?.user?.id) {
          console.log('Token refreshed, updating user data');
          
          try {
            const userData = await fetchUserData(session.user.id);
            if (userData) {
              setUser(userData);
            }
          } catch (error) {
            console.error('Error updating user data after token refresh:', error);
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
      console.log('Signing in user:', email);
      
      // Use persistent session
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error('Sign in error:', error);
        return { error };
      }
      
      if (!data.user) {
        console.error('Sign in succeeded but no user returned');
        return { error: new Error('Authentication failed') };
      }
      
      console.log('Sign in successful, user ID:', data.user.id);
      
      // Fetch user data immediately
      const userData = await fetchUserData(data.user.id);
      
      if (!userData) {
        console.error('User not found in database after sign in');
        await supabase.auth.signOut();
        return { error: new Error('User account not found') };
      }
      
      // Set user data
      console.log('Setting user data after successful sign in');
      setUser(userData);
      
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
      console.log('Signing up new user');
      
      // Sign up with persistent session
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name }
        }
      });
      
      if (error) {
        console.error('Sign up error:', error);
        return { error, user: null };
      }
      
      if (!data.user) {
        console.error('Sign up succeeded but no user returned');
        return { error: new Error('User creation failed'), user: null };
      }
      
      console.log('Sign up successful, creating user profile');
      
      // Create user profile
      const { error: profileError } = await supabase
        .from('users')
        .insert([{
          id: data.user.id,
          email,
          name,
          role: 'contributor',
          created_at: new Date().toISOString()
        }]);
      
      if (profileError) {
        console.error('Error creating user profile:', profileError);
        await supabase.auth.signOut();
        return { error: profileError, user: null };
      }
      
      // Fetch the newly created user
      const userData = await fetchUserData(data.user.id);
      
      if (userData) {
        setUser(userData);
      }
      
      return { error: null, user: data.user };
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
      console.log('Signing out user');
      
      // Clear user state first to prevent UI flicker
      setUser(null);
      
      // Then sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out from Supabase:', error);
      }
      
      // Clear any local storage
      try {
        localStorage.removeItem('supabase.auth.token');
        localStorage.removeItem('supabase.auth.expires_at');
        localStorage.removeItem('supabase.auth.refresh_token');
      } catch (e) {
        console.error('Error clearing localStorage:', e);
      }
      
      // Clear cookies
      try {
        document.cookie.split(';').forEach(cookie => {
          document.cookie = cookie
            .replace(/^ +/, '')
            .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
        });
      } catch (e) {
        console.error('Error clearing cookies:', e);
      }
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      console.log('Resetting password');
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      return { error };
    } catch (error) {
      console.error('Error resetting password:', error);
      return { error };
    }
  };

  const refreshSession = async () => {
    try {
      setLoading(true);
      console.log('Refreshing session');
      
      // Refresh the session with Supabase
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('Error refreshing session:', error);
        setUser(null);
        return;
      }
      
      if (!data.session?.user?.id) {
        console.log('No active session to refresh');
        setUser(null);
        return;
      }
      
      const userData = await fetchUserData(data.session.user.id);
      
      if (userData) {
        console.log('Session refreshed successfully');
        setUser(userData);
      } else {
        console.warn('No user data found during refresh');
        setUser(null);
      }
    } catch (error) {
      console.error('Error refreshing session:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Only show loading indicator after initialization
  const isLoading = loading && initialized;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading: isLoading,
        signIn,
        signUp,
        signOut,
        resetPassword,
        refreshSession
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
