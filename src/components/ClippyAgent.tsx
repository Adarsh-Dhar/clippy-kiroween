import { useRef, useState, useEffect } from 'react';
import { AnimationController } from './AnimationController';

interface ClippyAgentProps {
  anger?: number;  // Keep for backward compatibility
  message?: string; // Keep for backward compatibility
}

export const ClippyAgent = ({ anger, message }: ClippyAgentProps) => {
  const agentRef = useRef<ClippyAgent | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    console.log('ClippyAgent component mounted');
    console.log('window.clippy available?', typeof window.clippy !== 'undefined');
    console.log('window.jQuery available?', typeof (window as any).jQuery !== 'undefined');
    
    let loadTimeout: NodeJS.Timeout;
    let checkInterval: NodeJS.Timeout;
    let loaded = false;

    // Function to initialize Clippy
    const initClippy = () => {
      if (typeof window.clippy === 'undefined') {
        console.error('❌ Clippy.js library not loaded');
        return;
      }

      console.log('✅ Clippy.js library found, initializing agent...');

      // Set timeout for loading
      loadTimeout = setTimeout(() => {
        if (!loaded) {
          console.error('❌ Clippy agent failed to load within 5 seconds');
        }
      }, 5000);

      // Load Clippy agent
      try {
        window.clippy.load('Clippy', (agent: ClippyAgent) => {
          console.log('✅ Clippy agent loaded successfully!');
          clearTimeout(loadTimeout);
          loaded = true;
          agentRef.current = agent;
          agent.show();
          setIsLoaded(true);
          console.log('✅ Clippy agent shown');
        });
      } catch (error) {
        console.error('❌ Error loading Clippy:', error);
      }
    };

    // Check if window.clippy is available, if not wait for it
    if (typeof window.clippy !== 'undefined') {
      console.log('Clippy available immediately');
      initClippy();
    } else {
      console.log('Waiting for Clippy.js to load...');
      // Poll for clippy to be available
      let attempts = 0;
      checkInterval = setInterval(() => {
        attempts++;
        console.log(`Checking for Clippy... attempt ${attempts}`);
        if (typeof window.clippy !== 'undefined') {
          console.log('✅ Clippy.js now available!');
          clearInterval(checkInterval);
          initClippy();
        }
      }, 100);

      // Stop checking after 10 seconds
      setTimeout(() => {
        if (checkInterval) {
          clearInterval(checkInterval);
          console.error('❌ Clippy.js library failed to load after 10 seconds');
          console.log('Debug info:', {
            clippy: typeof window.clippy,
            jQuery: typeof (window as any).jQuery,
            $: typeof (window as any).$
          });
        }
      }, 10000);
    }

    // Cleanup on unmount
    return () => {
      console.log('ClippyAgent component unmounting');
      if (loadTimeout) clearTimeout(loadTimeout);
      if (checkInterval) clearInterval(checkInterval);
      if (agentRef.current) {
        agentRef.current.hide();
      }
    };
  }, []);

  const playAnimation = (animationName: string) => {
    if (!agentRef.current) {
      console.warn('Clippy agent not ready');
      return;
    }

    try {
      agentRef.current.play(animationName);
    } catch (error) {
      console.error(`Failed to play animation: ${animationName}`, error);
    }
  };

  return (
    <div>
      <AnimationController onAnimationTrigger={playAnimation} />
    </div>
  );
};
