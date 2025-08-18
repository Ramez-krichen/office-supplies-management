'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

/**
 * This component fixes the net::ERR_ABORTED errors with _rsc parameter
 * by intercepting navigation and removing the _rsc parameter
 */
export function RSCErrorFix() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Function to handle clicks on anchor tags
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      
      if (anchor && anchor.href && anchor.href.includes('_rsc=')) {
        e.preventDefault();
        
        // Extract the base URL without the _rsc parameter
        const url = new URL(anchor.href);
        url.searchParams.delete('_rsc');
        
        // Navigate using the router to avoid the _rsc parameter
        router.push(url.pathname + url.search);
      }
    };

    // Add event listener
    document.addEventListener('click', handleClick);

    // Fix for auth-related fetch errors
    // We'll use a more targeted approach that doesn't override the global fetch
    // This helps prevent issues with NextAuth's internal fetch calls

    // Clean up
    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, [router]);

  return null;
}