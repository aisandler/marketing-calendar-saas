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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_STORAGE_KEY = 'marketing-cal-auth';
const TOKEN_REFRESH_THRESHOLD = 4 * 60 * 1000; // 4 minutes in milliseconds

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionChecked, setSessionChecked] = useState(false);
  const authInProgress = useRef<boolean>(false);
  const refreshTokenTimeout = useRef<NodeJS.Timeout | null>(null);

  // Function to fetch user data with explicit field selection
  const fetchUserData = async (userId: string): Promise<User | null> => {
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, name, email, role, created_at, avatar_url')
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

  // Set up token refresh
  const setupTokenRefresh = (session: Session) => {
    // Clear any existing timeout
    if (refreshTokenTimeout.current) {
      clearTimeout(refreshTokenTimeout.current);
    }

    const expiresAt = session.expires_at;
    if (!expiresAt) return;

    const expiresAtMs = expiresAt * 1000; // Convert from seconds to milliseconds
    const timeUntilRefresh = Math.max(0, expiresAtMs - Date.now() - TOKEN_REFRESH_THRESHOLD);

    refreshTokenTimeout.current = setTimeout(async () => {
      try {
        console.log('AuthProvider: Refreshing token...');
        const { data, error } = await supabase.auth.refreshSession();
        
        if (error) {
          console.error('AuthProvider: Token refresh failed:', error);
          // Force a signOut if token refresh fails
          await signOut();
        } else if (data.session) {
          console.log('AuthProvider: Token refreshed successfully');
          setupTokenRefresh(data.session);
        }
      } catch (err) {
        console.error('AuthProvider: Error during token refresh:', err);
      }
    }, timeUntilRefresh);
  };

  // Handle auth state changes
  const handleAuthStateChange = async (session: Session | null): Promise<void> => {
    if (!session?.user) {
      setUser(null);
      return;
    }
    
    try {
      // Setup token refresh for this session
      setupTokenRefresh(session);
      
      const userData = await fetchUserData(session.user.id);
      
      // If we couldn't get user data but have a session, create a minimal user object
      if (!userData) {
        console.warn('AuthProvider: User authenticated but no profile data found');
        const fallbackUser: User = {
          id: session.user.id,
          email: session.user.email || '',
          name: 'User',
          role: 'contributor' as UserRole,
          created_at: new Date().toISOString(),
          avatar_url: null
        };
        setUser(fallbackUser);
        
        // Store in localStorage as fallback
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
          user: fallbackUser,
          timestamp: Date.now()
        }));
      } else {
        setUser(userData);
        
        // Store in localStorage as fallback
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
          user: userData,
          timestamp: Date.now()
        }));
      }
    } catch (error) {
      console.error('AuthProvider: Error fetching user data:', error);
      // Set a minimal user object to prevent loading state
      const fallbackUser: User = {
        id: session.user.id,
        email: session.user.email || '',
        name: 'User',
        role: 'contributor' as UserRole,
        created_at: new Date().toISOString(),
        avatar_url: null
      };
      setUser(fallbackUser);
      
      // Store in localStorage as fallback
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
        user: fallbackUser,
        timestamp: Date.now()
      }));
    }
  };

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        setLoading(true);
        console.log('AuthProvider: Checking for existing session...');
        
        // Try to get session from Supabase
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('AuthProvider: Error getting session:', error);
          // Try fallback from localStorage
          const localAuth = localStorage.getItem(SESSION_STORAGE_KEY);
          if (localAuth) {
            const { user: localUser, timestamp } = JSON.parse(localAuth);
            // Only use local storage if it's less than 24 hours old
            if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
              console.log('AuthProvider: Using cached user data');
              setUser(localUser);
            } else {
              setUser(null);
              localStorage.removeItem(SESSION_STORAGE_KEY);
            }
          } else {
            setUser(null);
          }
        } else if (data.session) {
          console.log('AuthProvider: Found existing session');
          await handleAuthStateChange(data.session);
        } else {
          console.log('AuthProvider: No active session found');
          setUser(null);
          localStorage.removeItem(SESSION_STORAGE_KEY);
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
    
    // Cleanup
    return () => {
      if (refreshTokenTimeout.current) {
        clearTimeout(refreshTokenTimeout.current);
      }
    };
  }, []);

  // Listen for auth changes after initial session check
  useEffect(() => {
    if (!sessionChecked) return;
    
    console.log('AuthProvider: Setting up auth state listener');
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('AuthProvider: Auth state changed:', event);
        
        // Prevent multiple simultaneous auth operations
        if (authInProgress.current) {
          console.log('AuthProvider: Auth operation already in progress, deferring...');
          return;
        }
        
        authInProgress.current = true;
        
        // Debounce loading state to prevent flicker
        let loadingTimeoutId: NodeJS.Timeout | null = null;
        
        if (event !== 'INITIAL_SESSION') {
          loadingTimeoutId = setTimeout(() => {
            setLoading(true);
          }, 200);
        }
        
        try {
          if (session) {
            await handleAuthStateChange(session);
          } else {
            setUser(null);
            localStorage.removeItem(SESSION_STORAGE_KEY);
          }
        } catch (err) {
          console.error('AuthProvider: Error handling auth change:', err);
          setUser(null);
          localStorage.removeItem(SESSION_STORAGE_KEY);
        } finally {
          if (loadingTimeoutId) clearTimeout(loadingTimeoutId);
          setLoading(false);
          authInProgress.current = false;
        }
      }
    );

    // Clean up subscription
    return () => {
      console.log('AuthProvider: Cleaning up auth listener');
      if (refreshTokenTimeout.current) {
        clearTimeout(refreshTokenTimeout.current);
      }
      subscription.unsubscribe();
    };
  }, [sessionChecked]);

  const signIn = async (email: string, password: string): Promise<{ error: AuthError | null }> => {
    if (authInProgress.current) {
      return { error: new Error('Auth operation already in progress') as AuthError };
    }
    
    authInProgress.current = true;
    const loadingTimeoutId: NodeJS.Timeout | null = setTimeout(() => {
      setLoading(true);
    }, 200);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      if (error) return { error };
      return { error: null };
    } catch (error) {
      console.error('AuthProvider: Sign in error:', error);
      return { error: error as AuthError };
    } finally {
      // The loading state will be handled by the auth state change handler
      // Only clear the timeout to prevent unnecessary loading state
      if (loadingTimeoutId) clearTimeout(loadingTimeoutId);
      authInProgress.current = false;
    }
  };

  const signUp = async (email: string, password: string, name: string): Promise<{ error: AuthError | Error | null, user: User | null }> => {
    if (authInProgress.current) {
      return { error: new Error('Auth operation already in progress'), user: null };
    }
    
    authInProgress.current = true;
    setLoading(true);
    
    try {
      // First create the auth user
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password, 
        options: {
          data: { name }
        }
      });

      if (error) return { error, user: null };

      if (!data.user) {
        return { error: new Error('No user data returned'), user: null };
      }
      
      // Then create the user profile
      console.log('AuthProvider: Creating user profile...');
      const { error: profileError } = await supabase
        .from('users')
        .insert([
          {
            id: data.user.id,
            email,
            name,
            role: 'contributor',
            created_at: new Date().toISOString(),
            avatar_url: null
          }
        ]);

      // If profile creation fails, attempt to delete the auth user to avoid orphaned accounts
      if (profileError) {
        console.error('AuthProvider: Error creating user profile:', profileError);
        
        try {
          // Try to clean up the auth user since profile creation failed
          console.log('AuthProvider: Cleaning up auth user due to profile creation failure');
          await supabase.auth.admin.deleteUser(data.user.id);
        } catch (deleteError) {
          console.error('AuthProvider: Failed to clean up auth user:', deleteError);
        }
        
        return { error: profileError, user: null };
      }

      console.log('AuthProvider: User profile created successfully');
      
      const newUser: User = {
        id: data.user.id,
        email,
        name,
        role: 'contributor' as UserRole,
        created_at: new Date().toISOString(),
        avatar_url: null
      };
      
      return { error: null, user: newUser };
    } catch (error) {
      console.error('AuthProvider: Sign up error:', error);
      return { error: error as Error, user: null };
    } finally {
      setLoading(false);
      authInProgress.current = false;
    }
  };

  const signOut = async (): Promise<void> => {
    if (authInProgress.current) {
      return;
    }
    
    authInProgress.current = true;
    setLoading(true);
    
    try {
      // Clean up token refresh timer
      if (refreshTokenTimeout.current) {
        clearTimeout(refreshTokenTimeout.current);
        refreshTokenTimeout.current = null;
      }
      
      const signOutPromise = supabase.auth.signOut();
      
      // Clear user state first for instant UI feedback
      setUser(null);
      localStorage.removeItem(SESSION_STORAGE_KEY);
      
      // Then wait for the actual signout to complete
      await signOutPromise;
    } catch (error) {
      console.error('AuthProvider: Sign out error:', error);
      // Force user state to null even if the signOut API fails
      setUser(null);
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } finally {
      setLoading(false);
      authInProgress.current = false;
    }
  };

  const resetPassword = async (email: string): Promise<{ error: AuthError | null }> => {
    try {
      console.log('AuthProvider: Requesting password reset...');
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      
      if (error) {
        console.error('AuthProvider: Password reset error:', error);
      } else {
        console.log('AuthProvider: Password reset email sent');
      }
      
      return { error };
    } catch (error) {
      console.error('AuthProvider: Password reset error:', error);
      return { error: error as AuthError };
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
