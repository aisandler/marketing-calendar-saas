import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type LoginFormData = z.infer<typeof loginSchema>;

const Login = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [authError, setAuthError] = React.useState<string | null>(null);
  const [isClearing, setIsClearing] = React.useState(false);

  // Clear any existing session on component mount
  useEffect(() => {
    const clearSession = async () => {
      try {
        setIsClearing(true);
        await supabase.auth.signOut();
        console.log('Session cleared on login page load');
      } catch (error) {
        console.error('Error clearing session:', error);
      } finally {
        setIsClearing(false);
      }
    };
    
    clearSession();
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setAuthError(null);
      const { error } = await signIn(data.email, data.password);
      
      if (error) {
        console.error('Login error:', error);
        setAuthError(error.message || 'Invalid email or password. Please try again.');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Unexpected login error:', err);
      setAuthError('An unexpected error occurred. Please try again.');
    }
  };

  const handleClearCookies = async () => {
    try {
      setIsClearing(true);
      // Sign out from Supabase (clears the session)
      await supabase.auth.signOut();
      
      // Clear browser cookies (this is a client-side approach)
      document.cookie.split(';').forEach(cookie => {
        document.cookie = cookie
          .replace(/^ +/, '')
          .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
      });
      
      // Reload the page to ensure everything is fresh
      window.location.reload();
    } catch (error) {
      console.error('Error clearing cookies:', error);
      setAuthError('Failed to clear cookies. Please try clearing them manually.');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {authError && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-600">
            {authError}
            <div className="mt-2">
              <button
                type="button"
                onClick={handleClearCookies}
                className="text-xs text-red-700 underline"
                disabled={isClearing}
              >
                {isClearing ? 'Clearing...' : 'Clear cookies and try again'}
              </button>
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
            <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
              Forgot your password?
            </a>
          </div>
        </div>

        <div>
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || isClearing}
          >
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </Button>
        </div>
        
        <div className="text-center">
          <button
            type="button"
            onClick={handleClearCookies}
            className="text-sm text-gray-600 hover:text-gray-900"
            disabled={isClearing}
          >
            {isClearing ? 'Clearing session...' : 'Having trouble? Clear session data'}
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
