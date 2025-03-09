import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type LoginFormData = z.infer<typeof loginSchema>;

const Login = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loginStatus, setLoginStatus] = useState<string>('');

  // Check if we already have a session
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        // Get current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Login: Error checking session:', error);
          return;
        }
        
        if (session?.user) {
          console.log('Login: Session found, redirecting to dashboard');
          navigate('/dashboard', { replace: true });
        } else {
          // Clear any existing session to start fresh
          await supabase.auth.signOut();
          console.log('Login: No session found or cleared existing session');
        }
      } catch (err) {
        console.error('Login: Error checking session:', err);
      }
    };
    
    checkExistingSession();
  }, [navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsProcessing(true);
      setError(null);
      setLoginStatus('Starting login process...');
      
      console.log('Login: Attempting to sign in with email:', data.email);
      
      // First, ensure we're starting with a clean session
      await supabase.auth.signOut();
      setLoginStatus('Cleared previous session');
      
      // Then attempt to sign in
      setLoginStatus('Calling signIn function...');
      const { error: signInError } = await signIn(data.email, data.password);
      
      if (signInError) {
        console.error('Login: Sign in error:', signInError);
        setError(signInError.message || 'Invalid email or password');
        setLoginStatus('Sign in failed');
        return;
      }
      
      setLoginStatus('Sign in successful, navigating...');
      
      // Navigate to the page they were trying to access, or dashboard
      const from = location.state?.from?.pathname || '/dashboard';
      console.log('Login: Navigating to:', from);
      
      // Add a small delay to ensure auth state is updated
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 500);
    } catch (err) {
      console.error('Login: Unexpected error during sign in:', err);
      setError('An unexpected error occurred. Please try again.');
      setLoginStatus('Error during sign in');
    } finally {
      if (isProcessing) {
        setIsProcessing(false);
      }
    }
  };

  const handleClearSession = async () => {
    try {
      setIsProcessing(true);
      setError('Clearing session data...');
      
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Clear localStorage
      try {
        localStorage.clear();
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
      
      setError('Session data cleared. Please try signing in again.');
      
      // Reload the page to ensure a fresh state
      window.location.reload();
    } catch (err) {
      console.error('Login: Error clearing session:', err);
      setError('Failed to clear session data. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-600">
            {error}
            <div className="mt-2">
              <button
                type="button"
                onClick={handleClearSession}
                className="text-xs text-red-700 underline"
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : 'Clear session data and try again'}
              </button>
            </div>
          </div>
        )}
        
        {loginStatus && !error && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-600">
            Status: {loginStatus}
          </div>
        )}
        
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email address
          </label>
          <div className="mt-1">
            <Input
              id="email"
              type="email"
              autoComplete="email"
              {...register('email')}
              disabled={isProcessing}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <div className="mt-1">
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              {...register('password')}
              disabled={isProcessing}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              disabled={isProcessing}
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
              Remember me
            </label>
          </div>

          <div className="text-sm">
            <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
              Forgot your password?
            </a>
          </div>
        </div>

        <div>
          <Button
            type="submit"
            className="w-full"
            disabled={isProcessing}
          >
            {isProcessing ? 'Signing in...' : 'Sign in'}
          </Button>
        </div>
        
        <div className="text-center">
          <button
            type="button"
            onClick={handleClearSession}
            className="text-sm text-gray-600 hover:text-gray-900"
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Having trouble? Clear session data'}
          </button>
        </div>
      </form>

      <div className="mt-6">
        <p className="text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
