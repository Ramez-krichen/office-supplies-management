'use client';

import React from 'react';

export function HydrationFix(): React.JSX.Element {
  return (
    <>
      <script
        id="hydration-fix"
        dangerouslySetInnerHTML={{
          __html: `
            if (document.body.hasAttribute('cz-shortcut-listen')) {
              document.body.removeAttribute('cz-shortcut-listen');
            }
            
            const observer = new MutationObserver((mutations) => {
              mutations.forEach((mutation) => {
                if (
                  mutation.type === 'attributes' &&
                  mutation.attributeName === 'cz-shortcut-listen'
                ) {
                  document.body.removeAttribute('cz-shortcut-listen');
                }
              });
            });
            
            observer.observe(document.body, {
              attributes: true,
              attributeFilter: ['cz-shortcut-listen']
            });
          `,
        }}
      />
      <script
        id="chunk-error-recovery"
        dangerouslySetInnerHTML={{
          __html: `
            // Handle chunk loading errors at the global level
            (function() {
              let reloadCount = 0;
              const MAX_RELOADS = 3;
              
              function handleChunkError(error) {
                console.warn('Chunk loading error detected:', error);
                
                // Check if it's really a chunk loading error
                const isChunkError = error && (
                  error.message?.includes('ChunkLoadError') ||
                  error.message?.includes('Loading chunk') ||
                  error.message?.includes('__webpack_require__') ||
                  error.stack?.includes('webpack')
                );
                
                if (isChunkError && reloadCount < MAX_RELOADS) {
                  reloadCount++;
                  console.log('Attempting recovery reload #' + reloadCount);
                  
                  // Clear any URL parameters that might be causing issues
                  const url = new URL(window.location.href);
                  url.searchParams.delete('_rsc');
                  
                  // Use replace to avoid adding to history
                  window.location.replace(url.toString());
                  return true; // Indicate we handled the error
                }
                
                return false; // Let other error handlers deal with it
              }
              
              // Global error handler
              window.addEventListener('error', function(event) {
                if (handleChunkError(event.error)) {
                  event.preventDefault();
                }
              });
              
              // Unhandled promise rejection handler
              window.addEventListener('unhandledrejection', function(event) {
                if (handleChunkError(event.reason)) {
                  event.preventDefault();
                }
              });
            })();
          `,
        }}
      />
    </>
  );
}