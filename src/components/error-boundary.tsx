'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

export function ErrorBoundary({ children }: ErrorBoundaryProps) {
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Handle chunk loading errors and other JS errors
    const handleError = (event: ErrorEvent) => {
      let errorString = '';
      
      try {
        if (event.error) {
          if (event.error instanceof Error) {
            errorString = event.error.message;
          } else if (typeof event.error === 'string') {
            errorString = event.error;
          } else {
            errorString = String(event.error);
          }
        } else if (event.message) {
          errorString = event.message;
        }
      } catch (e) {
        errorString = 'Unknown error occurred';
      }
      
      console.error('JavaScript Error:', errorString, event);
      
      // Check for chunk loading errors
      if (
        errorString.includes('ChunkLoadError') ||
        errorString.includes('Loading chunk') ||
        errorString.includes('webpack') ||
        errorString.includes('__webpack_require__')
      ) {
        console.log('Chunk loading error detected, triggering retry');
        event.preventDefault();
        setErrorMessage('Failed to load application resources');
        setHasError(true);
      }
    };

    // Handle unhandled promise rejections
    const handleRejection = (event: PromiseRejectionEvent) => {
      let errorString = '';
      
      try {
        if (event.reason) {
          if (typeof event.reason === 'string') {
            errorString = event.reason;
          } else if (event.reason instanceof Error) {
            errorString = event.reason.message;
          } else {
            errorString = String(event.reason);
          }
        }
      } catch (e) {
        errorString = 'Unknown promise rejection';
      }
      
      console.error('Unhandled promise rejection:', errorString, event);
      
      // Check for chunk loading errors in promise rejections
      if (
        errorString.includes('ChunkLoadError') ||
        errorString.includes('Loading chunk') ||
        errorString.includes('webpack') ||
        errorString.includes('__webpack_require__') ||
        (errorString.includes('_rsc') && !errorString.includes('/api/auth/'))
      ) {
        console.log('Chunk loading error in promise rejection, triggering retry');
        event.preventDefault();
        setErrorMessage('Failed to load application resources');
        setHasError(true);
      }
    };
    
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  // Reset error state and reload the page
  const handleRetry = () => {
    setHasError(false);
    setErrorMessage('');
    // Force a hard reload to clear any cached chunks
    window.location.reload();
  };

  // Navigate to a safe page
  const handleGoHome = () => {
    setHasError(false);
    setErrorMessage('');
    router.push('/');
  };

  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600">Loading Error</h2>
            <p className="mt-2 text-gray-600">
              {errorMessage || 'We encountered an error while loading this page.'}
            </p>
            <p className="mt-2 text-sm text-gray-500">
              This usually happens when the application has been updated. Refreshing should fix it.
            </p>
            <div className="mt-6 space-y-2">
              <button
                onClick={handleRetry}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Refresh Page
              </button>
              <button
                onClick={handleGoHome}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Go to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}