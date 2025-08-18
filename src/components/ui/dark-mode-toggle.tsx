"use client";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export default function DarkModeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>("light");
  const [mounted, setMounted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // On mount, check localStorage or system preference
    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    
    if (saved === "dark" || (!saved && prefersDark)) {
      document.documentElement.classList.add("dark");
      setTheme("dark");
    } else {
      document.documentElement.classList.remove("dark");
      setTheme("light");
    }
    setMounted(true);
  }, []);

  const handleToggle = async () => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    
    // Add a brief animation delay
    setTimeout(() => {
      if (theme === "dark") {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("theme", "light");
        setTheme("light");
      } else {
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
        setTheme("dark");
      }
      
      setTimeout(() => setIsAnimating(false), 200);
    }, 100);
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gray-200 animate-pulse" />
    );
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isAnimating}
      className="fixed bottom-6 right-6 z-50 group relative overflow-hidden
                 w-14 h-14 rounded-full
                 bg-white dark:bg-gray-800
                 border-2 border-gray-200 dark:border-gray-600
                 shadow-lg hover:shadow-xl
                 transition-all duration-300 ease-in-out
                 hover:scale-105 active:scale-95
                 focus:outline-none focus:ring-4 focus:ring-blue-500/30
                 disabled:cursor-not-allowed disabled:opacity-70"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-700 dark:to-gray-800 transition-all duration-300" />
      
      {/* Icon container */}
      <div className="relative flex items-center justify-center w-full h-full">
        {/* Sun icon */}
        <Sun 
          className={`absolute w-6 h-6 text-amber-500 transition-all duration-500 ease-in-out transform
                     ${theme === 'light' 
                       ? 'opacity-100 rotate-0 scale-100' 
                       : 'opacity-0 rotate-180 scale-50'
                     }`}
        />
        
        {/* Moon icon */}
        <Moon 
          className={`absolute w-6 h-6 text-blue-400 transition-all duration-500 ease-in-out transform
                     ${theme === 'dark' 
                       ? 'opacity-100 rotate-0 scale-100' 
                       : 'opacity-0 -rotate-180 scale-50'
                     }`}
        />
      </div>
      
      {/* Ripple effect */}
      <div className="absolute inset-0 rounded-full bg-white/20 dark:bg-gray-600/20 
                      scale-0 group-active:scale-100 transition-transform duration-200" />
      
      {/* Tooltip on hover */}
      <div className="absolute bottom-full right-0 mb-2 px-3 py-1 
                      bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 
                      text-sm font-medium rounded-lg shadow-lg
                      opacity-0 group-hover:opacity-100 transition-opacity duration-200
                      pointer-events-none whitespace-nowrap">
        {theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        <div className="absolute top-full right-3 w-0 h-0 
                        border-l-4 border-r-4 border-t-4 
                        border-l-transparent border-r-transparent 
                        border-t-gray-900 dark:border-t-gray-100" />
      </div>
    </button>
  );
}
   