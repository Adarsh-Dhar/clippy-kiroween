import { useRef, useState, useEffect } from 'react';
import { AnimationController } from './AnimationController';

interface ClippyAgentProps {
  anger?: number;  // Keep for backward compatibility
  message?: string; // Keep for backward compatibility
}

export const ClippyAgent = ({ anger, message }: ClippyAgentProps) => {
  const agentRef = useRef<ClippyAgent | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log('ClippyAgent component mounted');
    console.log('window.clippy available?', typeof window.clippy !== 'undefined');
    console.log('window.jQuery available?', typeof (window as any).jQuery !== 'undefined');
    
    let loadTimeout: ReturnType<typeof setTimeout>;
    let checkInterval: ReturnType<typeof setInterval>;
    let loaded = false;

    // Function to check if dependencies are ready
    const areDependenciesReady = (): boolean => {
      const hasJQuery = typeof (window as any).jQuery !== 'undefined' || typeof (window as any).$ !== 'undefined';
      const hasClippy = typeof window.clippy !== 'undefined';
      return hasJQuery && hasClippy;
    };

    // Function to initialize Clippy
    const initClippy = () => {
      if (!areDependenciesReady()) {
        console.error('❌ Dependencies not ready:', {
          jQuery: typeof (window as any).jQuery !== 'undefined' || typeof (window as any).$ !== 'undefined',
          clippy: typeof window.clippy !== 'undefined'
        });
        return;
      }

      console.log('✅ All dependencies ready, initializing Clippy agent...');

      // Set timeout for loading
      loadTimeout = setTimeout(() => {
        if (!loaded) {
          console.error('❌ Clippy agent failed to load within 10 seconds');
          setIsLoaded(false);
        }
      }, 10000);

      // Load Clippy agent
      try {
        console.log('📞 Calling window.clippy.load("Clippy", callback)...');
        console.log('window.clippy object:', window.clippy);
        console.log('Available agents:', (window.clippy as any).agents || 'unknown');
        
        window.clippy.load('Clippy', (agent: ClippyAgent) => {
          console.log('✅ Clippy agent loaded successfully!', agent);
          console.log('Agent methods:', Object.keys(agent));
          clearTimeout(loadTimeout);
          loaded = true;
          agentRef.current = agent;
          
          // Ensure Clippy is shown and positioned correctly
          console.log('👁️ Calling agent.show()...');
          try {
            agent.show();
            console.log('✅ agent.show() called successfully');
          } catch (showError) {
            console.error('❌ Error calling agent.show():', showError);
          }
          
          // Give it multiple attempts to find and style Clippy elements
          const findAndStyleClippy = (attempt: number = 1) => {
            const selectors = [
              '.clippy',
              '.clippy-balloon',
              '#clippy',
              '[id^="clippy"]',
              '.clippy-balloon-content',
              '.clippy-balloon-tail'
            ];
            
            let foundElements: HTMLElement[] = [];
            
            selectors.forEach(selector => {
              const elements = document.querySelectorAll(selector);
              elements.forEach(el => {
                if (el instanceof HTMLElement) {
                  foundElements.push(el);
                }
              });
            });
            
            // Also search for any element with clippy in class or id
            const allElements = document.querySelectorAll('*');
            allElements.forEach(el => {
              if (el instanceof HTMLElement) {
                const className = el.className || '';
                const id = el.id || '';
                if ((typeof className === 'string' && className.toLowerCase().includes('clippy')) ||
                    (typeof id === 'string' && id.toLowerCase().includes('clippy'))) {
                  if (!foundElements.includes(el)) {
                    foundElements.push(el);
                  }
                }
              }
            });
            
            if (foundElements.length > 0) {
              console.log(`✅ Found ${foundElements.length} Clippy element(s) on attempt ${attempt}:`, foundElements);
              foundElements.forEach((el, index) => {
                el.style.zIndex = '9999';
                el.style.position = 'fixed';
                console.log(`  - Element ${index + 1}:`, el.className || el.id || el.tagName, 'z-index set to 9999');
              });
            } else if (attempt < 10) {
              console.log(`⏳ Clippy elements not found yet, retrying... (attempt ${attempt}/10)`);
              setTimeout(() => findAndStyleClippy(attempt + 1), 200);
            } else {
              console.warn('⚠️ Clippy elements not found after 10 attempts. Checking DOM...');
              console.log('DOM structure:', document.body.innerHTML.substring(0, 500));
            }
          };
          
          // Start looking for Clippy elements immediately and with delays
          findAndStyleClippy();
          setTimeout(() => findAndStyleClippy(2), 100);
          setTimeout(() => findAndStyleClippy(3), 500);
          setTimeout(() => findAndStyleClippy(4), 1000);
          
          setIsLoaded(true);
          console.log('✅ Clippy agent initialization complete');
        });
      } catch (error) {
        console.error('❌ Error loading Clippy:', error);
        clearTimeout(loadTimeout);
        setIsLoaded(false);
      }
    };

    // Check if dependencies are ready, if not wait for them
    if (areDependenciesReady()) {
      console.log('Dependencies available immediately');
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        initClippy();
      }, 100);
    } else {
      console.log('Waiting for dependencies to load...');
      console.log('Current state:', {
        clippy: typeof window.clippy,
        jQuery: typeof (window as any).jQuery,
        $: typeof (window as any).$,
        scripts: Array.from(document.querySelectorAll('script')).map(s => s.src)
      });
      
      // Poll for dependencies to be available
      let attempts = 0;
      const maxAttempts = 200; // 20 seconds at 100ms intervals (give more time for CDN fallbacks)
      checkInterval = setInterval(() => {
        attempts++;
        if (areDependenciesReady()) {
          console.log(`✅ Dependencies now available! (attempt ${attempts})`);
          clearInterval(checkInterval);
          setTimeout(() => {
            initClippy();
          }, 100);
        } else if (attempts % 20 === 0) {
          // Log progress every 2 seconds
          console.log(`Still waiting... (${attempts}/${maxAttempts})`, {
            clippy: typeof window.clippy,
            jQuery: typeof (window as any).jQuery
          });
        } else if (attempts >= maxAttempts) {
          clearInterval(checkInterval);
          console.error('❌ Dependencies failed to load after 20 seconds');
          console.log('Debug info:', {
            clippy: typeof window.clippy,
            jQuery: typeof (window as any).jQuery,
            $: typeof (window as any).$,
            allScripts: Array.from(document.querySelectorAll('script')).map(s => ({
              src: s.src,
              async: s.async,
              defer: s.defer
            }))
          });
          console.error('💡 Troubleshooting: Check browser console for script loading errors. The Clippy.js CDN may be blocked or unavailable.');
        }
      }, 100);
    }

    // Cleanup on unmount
    return () => {
      console.log('ClippyAgent component unmounting');
      if (loadTimeout) clearTimeout(loadTimeout);
      if (checkInterval) clearInterval(checkInterval);
      if (agentRef.current) {
        try {
          agentRef.current.hide();
        } catch (error) {
          console.warn('Error hiding Clippy on unmount:', error);
        }
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
    <div ref={containerRef} className="clippy-container">
      <AnimationController onAnimationTrigger={playAnimation} />
    </div>
  );
};
