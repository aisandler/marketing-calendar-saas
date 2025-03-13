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
  const [sessionChecked, setSessionChecked] = useState(false);
  const authInProgress = useRef<boolean>(false);
  const refreshTokenTimeout = useRef<NodeJS.Timeout | null>(null);
  const initialSessionRef = useRef<boolean>(true); // Track if this is the first session check

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
      console.log('AuthProvider: No user in session, clearing user state');
      setUser(null);
      localStorage.removeItem(SESSION_STORAGE_KEY);
      return;
    }
    
    try {
      // Setup token refresh for this session
      setupTokenRefresh(session);
      
      // First set a temporary user to break potential redirect loops
      // This ensures we have a user value while fetching profile data
      const tempUser: User = {
        id: session.user.id,
        email: session.user.email || '',
        name: 'Loading...',
        role: 'contributor' as UserRole,
        created_at: new Date().toISOString(),
        avatar_url: null
      };
      
      // Only do this immediate set during initial auth to prevent loops
      if (initialSessionRef.current) {
        console.log('AuthProvider: Setting temporary user during initial auth');
        setUser(tempUser);
        initialSessionRef.current = false;
      }
      
      // Fetch complete user data
      const userData = await fetchUserData(session.user.id);
      
      // If we couldn't get user data but have a session, use the temporary user
      if (!userData) {
        console.warn('AuthProvider: User authenticated but no profile data found');
        // Use the temp user as fallback
        setUser(tempUser);
        
        // Store in localStorage as fallback
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
          user: tempUser,
          timestamp: Date.now()
        }));
      } else {
        console.log('AuthProvider: Setting complete user data');
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
        
        // Get session from Supabase (this will use local storage automatically)
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('AuthProvider: Error getting session:', error);
          setUser(null);
        } else if (data.session) {
          console.log('AuthProvider: Found existing session');
          
          // Immediately set a temporary user to prevent flashing
          const tempUser: User = {
            id: data.session.user.id,
            email: data.session.user.email || '',
            name: 'Loading...',
            role: 'contributor' as UserRole,
            created_at: new Date().toISOString(),
            avatar_url: null
          };
          
          setUser(tempUser);
          
          // Then get the full user data
          try {
            const userData = await fetchUserData(data.session.user.id);
            if (userData) {
              setUser(userData);
              console.log('AuthProvider: Set user data from profile');
            }
          } catch (profileError) {
            console.error('AuthProvider: Error fetching profile:', profileError);
            // Keep using the temp user
          }
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
    
    // Queue for handling sequential auth events
    const authQueue: Array<{ event: string, session: Session | null }> = [];
    let processingQueue = false;
    
    const processNextAuthEvent = async () => {
      if (processingQueue || authQueue.length === 0) return;
      
      processingQueue = true;
      const { event, session } = authQueue.shift()!;
      
      console.log('AuthProvider: Processing auth event:', event);
      
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
        processingQueue = false;
        
        // Process next event if there are more in the queue
        setTimeout(() => {
          processNextAuthEvent();
        }, 50);
      }
    };
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('AuthProvider: Auth state changed:', event);
        
        // Add the event to the queue
        authQueue.push({ event, session });
        
        // Start processing if not already doing so
        processNextAuthEvent();
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

  const refreshSession = async (): Promise<void> => {
    if (authInProgress.current) {
      console.log('AuthProvider: Auth operation already in progress, deferring refresh...');
      return;
    }
    
    authInProgress.current = true;
    setLoading(true);
    
    try {
      console.log('AuthProvider: Manually refreshing session...');
      
      // First try to completely sign out to clear any inconsistent state
      await supabase.auth.signOut({ scope: 'local' });
      
      // Try to get current session
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (sessionData.session) {
        console.log('AuthProvider: Retrieved session after signout, using it');
        await handleAuthStateChange(sessionData.session);
      } else {
        // If still no session, try to check localStorage as fallback
        console.log('AuthProvider: No session found, checking localStorage');
        const localAuth = localStorage.getItem(SESSION_STORAGE_KEY);
        
        if (localAuth) {
          try {
            // Parse stored session data
            const { user: localUser } = JSON.parse(localAuth);
            
            if (localUser && localUser.email) {
              console.log('AuthProvider: Found user in localStorage, using as temporary');
              // Set as user temporarily while we redirect to login
              setUser(localUser);
            } else {
              setUser(null);
              localStorage.removeItem(SESSION_STORAGE_KEY);
            }
          } catch (parseError) {
            console.error('AuthProvider: Error parsing local auth:', parseError);
            setUser(null);
            localStorage.removeItem(SESSION_STORAGE_KEY);
          }
        } else {
          setUser(null);
        }
      }
    } catch (error) {
      console.error('AuthProvider: Error during manual session refresh:', error);
      setUser(null);
      localStorage.removeItem(SESSION_STORAGE_KEY);
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
