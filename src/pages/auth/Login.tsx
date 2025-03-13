import React, { useState, useEffect } from 'react';
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
  const { signIn, resetPassword, refreshSession } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionIssue, setSessionIssue] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  
  // Check for existing user first
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          console.log('Login: Found existing session, redirecting to dashboard');
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('Login: Error checking session:', error);
      }
    };
    
    checkExistingSession();
  }, [navigate]);
  
  // Check if redirected from a protected route
  useEffect(() => {
    const from = location.state?.from;
    const sessionKey = 'marketing-cal-auth';
    const hasLocalSession = localStorage.getItem(sessionKey) !== null;
    
    // Only show session issue warning if redirected from a protected route AND has local session
    if (from && hasLocalSession) {
      console.log('Login: Detected potential session issue, redirected from:', from);
      setSessionIssue(true);
    }
  }, [location.state]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setAuthError(null);
      setIsSubmitting(true);
      const { error } = await signIn(data.email, data.password);
      
      if (error) {
        setAuthError(error.message || 'Invalid login credentials. Please try again.');
      } else {
        const redirectTo = location.state?.from || '/dashboard';
        navigate(redirectTo);
      }
    } catch (err: any) {
      setAuthError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleSessionRefresh = async () => {
    try {
      setAuthError(null);
      setIsRefreshing(true);
      
      // First try to refresh directly through Supabase
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('Login: Error refreshing session through Supabase:', error);
        // Fall back to our custom refresh method
        await refreshSession();
      } else if (data.session) {
        console.log('Login: Session refreshed successfully');
        // Redirect back to original location if available
        const redirectTo = location.state?.from || '/dashboard';
        navigate(redirectTo);
        return;
      }
      
      // If we got here, the refresh didn't redirect, check again
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        console.log('Login: User authenticated after refresh');
        const redirectTo = location.state?.from || '/dashboard';
        navigate(redirectTo);
      } else {
        setAuthError('Unable to restore your session. Please sign in again.');
        setSessionIssue(false);
      }
    } catch (err: any) {
      console.error('Login: Error during session refresh:', err);
      setAuthError('Failed to restore your session. Please sign in again.');
      setSessionIssue(false);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleForgotPassword = async () => {
    const email = getValues('email');
    if (!email) {
      setAuthError('Please enter your email address to reset your password.');
      return;
    }

    try {
      setIsResettingPassword(true);
      setAuthError(null);
      const { error } = await resetPassword(email);
      
      if (error) {
        setAuthError(error.message);
      } else {
        setAuthError('Password reset link has been sent to your email.');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Failed to send reset password link.');
    } finally {
      setIsResettingPassword(false);
    }
  };

  return (
    <div>
      {sessionIssue && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium">Session Issue Detected</h3>
              <div className="mt-2 text-sm">
                <p>Your login session may have expired or become invalid.</p>
                <button
                  type="button"
                  onClick={handleSessionRefresh}
                  disabled={isRefreshing}
                  className="mt-2 inline-flex items-center px-3 py-1.5 border border-yellow-300 text-xs font-medium rounded-md text-yellow-700 bg-yellow-50 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                >
                  {isRefreshing ? 'Refreshing Session...' : 'Refresh Session'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {authError && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm">{authError}</p>
              </div>
            </div>
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
              aria-invalid={errors.email ? 'true' : 'false'}
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
              aria-invalid={errors.password ? 'true' : 'false'}
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
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
              Remember me
            </label>
          </div>

          <div className="text-sm">
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={isResettingPassword}
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              {isResettingPassword ? 'Sending reset link...' : 'Forgot your password?'}
            </button>
          </div>
        </div>

        <div>
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </Button>
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
