import { useState, useEffect } from 'react';

// Hook to detect if the viewport is mobile size
export const useMobileDetection = (breakpoint = 768) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if window is available (client-side)
    if (typeof window === 'undefined') return;

    // Set initial state
    setIsMobile(window.innerWidth < breakpoint);

    // Handler for window resize
    const handleResize = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint]);

  return isMobile;
};