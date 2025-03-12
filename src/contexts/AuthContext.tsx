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
    try {
      setLoading(true);
      if (session?.user) {
        const userData = await fetchUserData(session.user.id);
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('AuthProvider: Error in handleAuthStateChange:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    
    const initializeAuth = async () => {
      try {
        if (!authInitialized) {
          setLoading(true);
          console.log('AuthProvider: Starting auth initialization...');
          
          // Get initial session
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error('AuthProvider: Session error:', sessionError);
            if (mounted) {
              setUser(null);
            }
          } else if (mounted) {
            await handleAuthStateChange(session);
          }
          
          setAuthInitialized(true);
        }
      } catch (error) {
        console.error('AuthProvider: Initialization error:', error);
        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('AuthProvider: Auth state changed:', event);
        if (!mounted) return;
        await handleAuthStateChange(session);
      }
    );

    // Initialize auth
    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [authInitialized]);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('AuthProvider: Sign in error:', error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      console.log('AuthProvider: Attempting sign up...');
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password, 
        options: {
          data: {
            name
          }
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
              role: 'contributor', // Default role for new users
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
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('AuthProvider: Sign out error:', error);
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
