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
  const [sessionChecked, setSessionChecked] = useState(false);

  // Function to fetch user data
  const fetchUserData = async (userId: string) => {
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (userError) {
        console.error('AuthProvider: Error fetching user data:', userError);
        return null;
      }
      
      return userData as User;
    } catch (error) {
      console.error('AuthProvider: Error in fetchUserData:', error);
      return null;
    }
  };

  // Handle auth state changes
  const handleAuthStateChange = async (session: any) => {
    if (!session?.user) {
      setUser(null);
      return;
    }
    
    try {
      const userData = await fetchUserData(session.user.id);
      
      // If we couldn't get user data but have a session, create a minimal user object
      if (!userData) {
        console.warn('AuthProvider: User authenticated but no profile data found');
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          name: 'User',
          role: 'contributor',
          created_at: new Date().toISOString()
        });
      } else {
        setUser(userData);
      }
    } catch (error) {
      console.error('AuthProvider: Error fetching user data:', error);
      // Set a minimal user object to prevent loading state
      setUser({
        id: session.user.id,
        email: session.user.email || '',
        name: 'User',
        role: 'contributor',
        created_at: new Date().toISOString()
      });
    }
  };

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        setLoading(true);
        console.log('AuthProvider: Checking for existing session...');
        
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('AuthProvider: Error getting session:', error);
          setUser(null);
        } else if (data.session) {
          console.log('AuthProvider: Found existing session');
          await handleAuthStateChange(data.session);
        } else {
          console.log('AuthProvider: No active session found');
          setUser(null);
        }
      } catch (err) {
        console.error('AuthProvider: Session check failed:', err);
        setUser(null);
      } finally {
        setLoading(false);
        setSessionChecked(true);
      }
    };

    checkSession();
  }, []);

  // Listen for auth changes after initial session check
  useEffect(() => {
    if (!sessionChecked) return;
    
    console.log('AuthProvider: Setting up auth state listener');
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('AuthProvider: Auth state changed:', event);
        
        // Since supabase may fire multiple events, we'll wait a bit
        // before setting loading to true to avoid flicker
        const loadingTimeout = setTimeout(() => {
          setLoading(true);
        }, 200);
        
        try {
          if (session) {
            await handleAuthStateChange(session);
          } else {
            setUser(null);
          }
        } catch (err) {
          console.error('AuthProvider: Error handling auth change:', err);
          setUser(null);
        } finally {
          clearTimeout(loadingTimeout);
          setLoading(false);
        }
      }
    );

    // Clean up subscription
    return () => {
      console.log('AuthProvider: Cleaning up auth listener');
      subscription.unsubscribe();
    };
  }, [sessionChecked]);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('AuthProvider: Sign in error:', error);
      return { error };
    } finally {
      // Don't set loading to false here - let the onAuthStateChange handler do it
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password, 
        options: {
          data: { name }
        }
      });

      if (error) throw error;

      if (data.user) {
        console.log('AuthProvider: Creating user profile...');
        const { error: profileError } = await supabase
          .from('users')
          .insert([
            {
              id: data.user.id,
              email,
              name,
              role: 'contributor',
              created_at: new Date().toISOString()
            }
          ]);

        if (profileError) {
          console.error('AuthProvider: Error creating user profile:', profileError);
          return { error: profileError, user: null };
        }

        console.log('AuthProvider: User profile created successfully');
        return { error: null, user: data.user };
      }

      return { error: new Error('No user data returned'), user: null };
    } catch (error) {
      console.error('AuthProvider: Sign up error:', error);
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
      console.error('AuthProvider: Sign out error:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      console.log('AuthProvider: Requesting password reset...');
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) {
        console.error('AuthProvider: Password reset error:', error);
      } else {
        console.log('AuthProvider: Password reset email sent');
      }
      return { error };
    } catch (error) {
      console.error('AuthProvider: Password reset error:', error);
      return { error };
    }
  };

  const value = {
    user,
    loading,
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
