'use client';

import { useState } from 'react';
import { signIn, signOut, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export function useAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('Attempting login with:', email);
      
      // Validate inputs
      if (!email || !password) {
        setError('Email and password are required');
        return false;
      }
      
      // Attempt sign in
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl: '/dashboard'
      });

      console.log('Login result:', result);

      if (!result) {
        console.error('Login failed: No result returned');
        setError('Authentication service unavailable. Please try again later.');
        return false;
      }

      if (result.error) {
        console.error('Login error:', result.error);
        
        // Handle specific error codes
        if (result.error === 'CredentialsSignin') {
          setError('Invalid email or password. Please check your credentials and try again.');
        } else {
          setError(`Authentication failed: ${result.error}`);
        }
        return false;
      } 
      
      // Success path
      console.log('Login successful, getting user session for redirect');

      try {
        // Get the session to determine the correct dashboard
        const session = await getSession();
        console.log('Session after login:', session);
        
        if (session?.user?.role) {
          const userRole = session.user.role;
          let dashboardUrl = '/dashboard';

          switch (userRole) {
            case 'ADMIN':
              dashboardUrl = '/dashboard/admin';
              break;
            case 'MANAGER':
              dashboardUrl = '/dashboard/manager';
              break;
            case 'EMPLOYEE':
              dashboardUrl = '/dashboard/employee';
              break;
            case 'GENERAL_MANAGER':
              dashboardUrl = '/dashboard/requests';
              break;
            default:
              dashboardUrl = '/dashboard';
          }

          console.log(`Redirecting ${userRole} to ${dashboardUrl}`);
          // Use router for client-side navigation when possible
          try {
            router.push(dashboardUrl);
          } catch (routerError) {
            console.error('Router navigation failed, using window.location fallback:', routerError);
            window.location.href = dashboardUrl;
          }
        } else {
          console.warn('No user role found in session, using default redirect');
          // Fallback to general dashboard if role is not available
          window.location.href = '/dashboard';
        }
        return true;
      } catch (sessionError) {
        console.error('Error getting session after login:', sessionError);
        // Still consider this a successful login, just use default redirect
        window.location.href = '/dashboard';
        return true;
      }
    } catch (error) {
      console.error('Login exception:', error);
      setError('An error occurred during authentication. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await signOut({ redirect: false });
      // Use window.location.href for consistent navigation behavior
      window.location.href = '/auth/signin';
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      setError('Failed to log out. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    login,
    logout,
    isLoading,
    error,
  };
}