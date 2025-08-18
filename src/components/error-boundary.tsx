'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

export function ErrorBoundary({ children }: ErrorBoundaryProps) {
  const [hasError, setHasError] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Handle unhandled promise rejections
    const handleRejection = (event: PromiseRejectionEvent) => {
      // Safely extract error message
      let errorMessage = 'Unknown error';
      let errorString = '';
      
      try {
        if (event.reason) {
          if (typeof event.reason === 'string') {
            errorMessage = event.reason;
            errorString = event.reason;
          } else if (event.reason instanceof Error) {
            errorMessage = event.reason.message;
            errorString = event.reason.toString();
          } else if (typeof event.reason === 'object' && event.reason !== null) {
            errorMessage = JSON.stringify(event.reason);
            errorString = event.reason.toString();
          }
        }
      } catch (e) {
        errorMessage = 'Error parsing rejection reason';
        errorString = 'Error parsing rejection reason';
      }
      
      console.error('Unhandled promise rejection:', errorMessage);
      
      // Check if it's an RSC-related error but not auth-related
      if (
        (errorString.includes('_rsc') ||
        errorString.includes('aborted') ||
        errorString.includes('net::ERR_ABORTED')) &&
        !errorString.includes('/api/auth/')
      ) {
        event.preventDefault();
        setHasError(true);
      }
    };

    // Handle errors
    const handleError = (event: ErrorEvent) => {
      // Safely extract error message
      let errorMessage = 'Unknown error';
      let errorString = '';
      
      try {
        if (event.error) {
          if (event.error instanceof Error) {
            errorMessage = event.error.message;
            errorString = event.error.toString();
          } else if (typeof event.error === 'string') {
            errorMessage = event.error;
            errorString = event.error;
          } else if (typeof event.error === 'object' && event.error !== null) {
            errorMessage = JSON.stringify(event.error);
            errorString = event.error.toString();
          }
        }
      } catch (e) {
        errorMessage = 'Error parsing error event';
        errorString = 'Error parsing error event';
      }
      
      console.error('Error event:', errorMessage);
      
      // Check if it's an RSC-related error but not auth-related
      if (
        (errorString.includes('_rsc') ||
        errorString.includes('aborted') ||
        errorString.includes('net::ERR_ABORTED')) &&
        !errorString.includes('/api/auth/')
      ) {
        event.preventDefault();
        setHasError(true);
      }
    };
    
    window.addEventListener('unhandledrejection', handleRejection);
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('unhandledrejection', handleRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);

  // Reset error state and retry
  const handleRetry = () => {
    setHasError(false);
    // Refresh the current page without RSC parameters
    const url = new URL(window.location.href);
    url.searchParams.delete('_rsc');
    router.push(url.pathname + url.search);
  };

  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600">Something went wrong</h2>
            <p className="mt-2 text-gray-600">
              We encountered an error while loading this page.
            </p>
            <button
              onClick={handleRetry}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}