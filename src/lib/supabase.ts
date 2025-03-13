import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase URL or Anonymous Key');
}

// Create a custom storage implementation that logs operations for debugging
class LoggingLocalStorage {
  getItem(key: string) {
    const value = localStorage.getItem(key);
    console.log(`Storage: getItem "${key}" = ${value ? 'found' : 'not found'}`);
    return value;
  }
  
  setItem(key: string, value: string) {
    console.log(`Storage: setItem "${key}"`);
    localStorage.setItem(key, value);
  }
  
  removeItem(key: string) {
    console.log(`Storage: removeItem "${key}"`);
    localStorage.removeItem(key);
  }
}

// Create a basic storage implementation
class BasicStorage {
  getItem(key: string) {
    return localStorage.getItem(key);
  }
  
  setItem(key: string, value: string) {
    localStorage.setItem(key, value);
  }
  
  removeItem(key: string) {
    localStorage.removeItem(key);
  }
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storageKey: 'supabase-auth',
    autoRefreshToken: true,
    detectSessionInUrl: true,
    debug: true // Enable debug logs to troubleshoot persistence issues
  },
  global: {
    headers: { 
      'x-application-name': 'marketing-cal-bolt'
    }
  }
});
