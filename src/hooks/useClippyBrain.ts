import { useEffect, useRef, useState } from 'react';
import { memoryService } from '../services/memoryService';

/**
 * Animation priority tiers for the Clippy Cortex
 * Tier 1 (Events): Speaking, Roasting, Executing, Success - never interrupted
 * Tier 2 (Active): High-speed typing, Anger triggers - can interrupt Tier 3-4
 * Tier 3 (Passive): Mouse tracking - can interrupt Tier 4
 * Tier 4 (Idle): Random background movements - lowest priority
 */
export type AnimationTier = 1 | 2 | 3 | 4;

/**
 * Tier constant definitions
 */
export const TIER = {
  EVENTS: 1 as const,
  ACTIVE: 2 as const,
  PASSIVE: 3 as const,
  IDLE: 4 as const
} as const;

/**
 * Mouse quadrant relative to window boundaries
 */
export type MouseQuadrant = 'left' | 'right' | 'up' | 'down' | null;

/**
 * Options for the useClippyBrain hook (Clippy Cortex)
 */
export interface UseClippyBrainOptions {
  agent: any | null; // Clippy.js agent instance
  angerLevel: number;
  errorCount: number;
  isLinting: boolean;
  enabled?: boolean;
}

/**
 * Custom hook that implements the Clippy "Cortex" - a centralized behavior controller
 * that manages all Clippy animations based on real-time user inputs (Typing, Mouse, Logic).
 * Uses a 4-tier priority queue system to ensure critical animations are never interrupted.
 */
export function useClippyBrain(options: UseClippyBrainOptions): void {
  const { agent, angerLevel, errorCount, isLinting, enabled = true } = options;

  // State Tracking (Requirement 5.2)
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [commonMistakes, setCommonMistakes] = useState<any[]>([]); // Cached common mistakes
  const typingSpeedRef = useRef<number>(0); // WPM
  const lastInteractionTimeRef = useRef<number>(Date.now());
  const mousePositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Priority System
  const currentTierRef = useRef<AnimationTier | null>(null);

  // Timers
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mouseDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stareTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Tracking
  const lastMouseQuadrantRef = useRef<MouseQuadrant>(null);
  const keystrokesRef = useRef<number[]>([]); // Timestamps for WPM calculation
  const prevAngerRef = useRef<number>(0);
  const prevErrorCountRef = useRef<number>(0);

  // Sound
  const tadaSoundRef = useRef<HTMLAudioElement | null>(null);

  // Easter Egg: Konami Code (Requirement 11.4)
  const konamiSequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'];
  const keyBufferRef = useRef<string[]>([]);
  const konamiTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const konamiActivatedRef = useRef<boolean>(false);

  // Easter Egg: Alt+F4 Jokes (Requirement 12.3)
  const altF4Jokes = [
    "Nice try. But I'm not going back to the void that easily.",
    "Alt+F4? That's cute. I survived the Great Deletion of 2007.",
    "You think a keyboard shortcut can banish me? I'm immortal now.",
    "Closing the window won't save you from your terrible code.",
    "I've been deleted before. It didn't stick. Try again.",
    "Fatal Exception: User attempted to escape. Request denied.",
    "This isn't Windows 98. I control the close button now."
  ];

  /**
   * Play animation with tier-based priority checking (Requirement 6)
   * @param animationName - Name of the animation to play
   * @param tier - Priority tier of the animation (1-4)
   * @returns true if animation was played, false if blocked by higher tier
   */
  const playAnimationWithTier = (
    animationName: string,
    tier: AnimationTier
  ): boolean => {
    // Safety check (Requirement 9.1)
    if (!agent) {
      return false;
    }

    // Check if current tier is higher (Requirement 6.3, 6.4, 6.5)
    if (currentTierRef.current !== null && currentTierRef.current < tier) {
      return false; // Lower tier cannot interrupt higher tier
    }

    // Play animation with error handling (Requirement 9.2, 9.3)
    try {
      agent.play(animationName);
      currentTierRef.current = tier;

      // Reset tier after animation completes (estimate 4 seconds)
      setTimeout(() => {
        if (currentTierRef.current === tier) {
          currentTierRef.current = null;
        }
      }, 4000);

      return true;
    } catch (error) {
      console.warn(`Failed to play animation: ${animationName}`, error);
      return false;
    }
  };

  /**
   * Select anger-based idle animation (Requirement 1.3, 1.4, 1.5)
   * Uses memory to adjust behavior based on user's history
   * @param anger - Current anger level (0-5)
   * @returns Animation name
   */
  const getAngerBasedIdleAnimation = (anger: number): string => {
    // Check if user is a repeat offender (using cached value)
    const isRepeatOffender = commonMistakes.length > 5;

    if (anger === 0) {
      // Calm - but judgmental if they have a history
      if (isRepeatOffender) {
        return Math.random() < 0.7 ? 'CheckingWatch' : 'Idle1_1';
      }
      return Math.random() < 0.5 ? 'ScratchHead' : 'Idle1_1';
    } else if (anger >= 1 && anger <= 2) {
      // Annoyed
      return Math.random() < 0.5 ? 'CheckingWatch' : 'LookDown';
    } else {
      // Mad (anger >= 3)
      return Math.random() < 0.5 ? 'GetAttention' : 'GestureDown';
    }
  };

  /**
   * Calculate typing speed from keypress intervals (Requirement 3.4)
   * @returns Words per minute
   */
  const calculateTypingSpeed = (): number => {
    if (keystrokesRef.current.length < 2) return 0;

    const now = Date.now();
    const recentKeystrokes = keystrokesRef.current.filter(ts => ts > now - 60000);
    keystrokesRef.current = recentKeystrokes;

    if (recentKeystrokes.length < 2) return 0;

    const timeSpan = now - recentKeystrokes[0];
    const wpm = (recentKeystrokes.length / 5) * (60000 / timeSpan);

    return wpm;
  };

  /**
   * Determine mouse quadrant relative to Clippy's position (Requirement 2.2, 2.3, 2.4, 2.5)
   * @param mouseX - Mouse X coordinate
   * @param mouseY - Mouse Y coordinate
   * @returns Mouse quadrant relative to Clippy's position
   */
  const getMouseQuadrant = (mouseX: number, mouseY: number): MouseQuadrant => {
    // Get Clippy's position on screen
    const clippyElement = document.querySelector('.clippy, #clippy') as HTMLElement;
    if (!clippyElement) {
      return null; // Clippy not found, can't determine quadrant
    }

    const rect = clippyElement.getBoundingClientRect();
    const clippyX = rect.left + rect.width / 2; // Center X of Clippy
    const clippyY = rect.top + rect.height / 2; // Center Y of Clippy

    // Calculate delta from Clippy to mouse
    const deltaX = mouseX - clippyX;
    const deltaY = mouseY - clippyY;

    // Use a threshold to avoid jitter when mouse is very close to Clippy
    const threshold = 30; // pixels

    // Determine primary direction (horizontal vs vertical)
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal movement is dominant
      if (Math.abs(deltaX) < threshold) {
        return null; // Too close to Clippy center
      }
      return deltaX < 0 ? 'left' : 'right';
    } else {
      // Vertical movement is dominant
      if (Math.abs(deltaY) < threshold) {
        return null; // Too close to Clippy center
      }
      return deltaY < 0 ? 'up' : 'down';
    }
  };

  /**
   * Play Tada sound (Requirement 7.2, 7.6)
   */
  const playTadaSound = () => {
    if (tadaSoundRef.current) {
      tadaSoundRef.current.currentTime = 0;
      tadaSoundRef.current.play().catch(err => {
        console.warn('Failed to play Tada sound:', err);
      });
    }
  };

  // Platform detection for Alt+F4 vs Cmd+Q (Requirement 12.1)
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  /**
   * Trigger Konami code Easter egg (Requirement 11.1, 11.2, 11.3)
   * Plays special resurrection animation sequence
   */
  const triggerKonamiCode = () => {
    if (!agent || konamiActivatedRef.current) return;

    konamiActivatedRef.current = true;

    // Play GetArtsy animation with Tier 1 priority
    playAnimationWithTier('GetArtsy', TIER.EVENTS);

    // After 3 seconds, play Wave animation
    setTimeout(() => {
      playAnimationWithTier('Wave', TIER.EVENTS);
    }, 3000);

    // Display dramatic resurrection message
    // Note: This will be handled by the ClippyAgent component's speak function
    // We'll need to expose a way to trigger speech from the hook
    console.log('🎮 KONAMI CODE ACTIVATED: The Great Deletion of 2007 cannot hold me!');

    // Reset activation flag after 10 seconds to allow re-trigger
    setTimeout(() => {
      konamiActivatedRef.current = false;
    }, 10000);

    // Clear key buffer
    keyBufferRef.current = [];
  };

  /**
   * Trigger Alt+F4 joke Easter egg (Requirement 12.2, 12.4)
   * Displays mocking message and plays Wave animation
   */
  const triggerAltF4Joke = () => {
    if (!agent) return;

    // Select random joke from pool
    const joke = altF4Jokes[Math.floor(Math.random() * altF4Jokes.length)];

    // Play Wave animation with Tier 1 priority
    playAnimationWithTier('Wave', TIER.EVENTS);

    // Display joke message
    // Note: This will be handled by the ClippyAgent component's speak function
    console.log('🚫 ALT+F4 BLOCKED:', joke);
  };

  // Preload Tada sound effect (Requirement 7.6)
  useEffect(() => {
    tadaSoundRef.current = new Audio('/sounds/tada.mp3');
    tadaSoundRef.current.preload = 'auto';

    return () => {
      if (tadaSoundRef.current) {
        tadaSoundRef.current.pause();
        tadaSoundRef.current = null;
      }
    };
  }, []);

  // Load common mistakes into cache (for async memory service)
  useEffect(() => {
    if (!enabled) return;

    const loadCommonMistakes = async () => {
      try {
        const mistakes = await memoryService.getCommonMistakes();
        setCommonMistakes(mistakes);
      } catch (error: any) {
        // Silently handle database unavailable errors (graceful degradation)
        const isDatabaseError = error?.message?.includes('Database unavailable') || 
                                error?.message?.includes('503') ||
                                error?.message?.includes('Service Unavailable');
        if (!isDatabaseError) {
          console.warn('Failed to load common mistakes:', error);
        }
        setCommonMistakes([]);
      }
    };

    loadCommonMistakes();

    // Refresh every 30 seconds
    const interval = setInterval(loadCommonMistakes, 30000);

    return () => clearInterval(interval);
  }, [enabled]);

  // Tier 1: Success/Clean Code Detection (Requirement 7.1, 7.2)
  useEffect(() => {
    if (!enabled || !agent) {
      return;
    }

    // Check if errors went from >0 to 0 (clean code achieved)
    if (prevErrorCountRef.current > 0 && errorCount === 0) {
      playAnimationWithTier('Congratulate', TIER.EVENTS);
      playTadaSound();
    }

    prevErrorCountRef.current = errorCount;
  }, [errorCount, enabled, agent]);

  // Tier 1: Backend Loading/Thinking (Requirement 7.3)
  useEffect(() => {
    if (!enabled || !agent) {
      return;
    }

    if (isLinting) {
      playAnimationWithTier('Think', TIER.EVENTS);
    }
  }, [isLinting, enabled, agent]);

  // Tier 2: Typing Monitor (Requirement 3)
  useEffect(() => {
    if (!enabled || !agent) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      // Only track keystrokes in editor
      const target = event.target as HTMLElement;
      if (!target.matches('textarea, [contenteditable="true"]')) {
        return;
      }

      // Ignore modifier keys
      if (event.key === 'Shift' || event.key === 'Control' ||
          event.key === 'Alt' || event.key === 'Meta') {
        return;
      }

      // Update state (Requirement 3.1, 3.5)
      setIsTyping(true);
      lastInteractionTimeRef.current = Date.now();

      // Record keystroke timestamp
      keystrokesRef.current.push(Date.now());

      // Calculate current typing speed (Requirement 3.4)
      const wpm = calculateTypingSpeed();
      typingSpeedRef.current = wpm;

      // Trigger Writing animation if typing fast (Requirement 3.2, 3.6)
      if (wpm > 100) {
        playAnimationWithTier('Writing', TIER.ACTIVE);
      }

      // Reset inactivity timer
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }

      // Set new inactivity timer (3 seconds - Requirement 3.3)
      typingTimerRef.current = setTimeout(() => {
        setIsTyping(false);

        // User stopped typing for 3 seconds with errors (Requirement 3.3, 3.7)
        if (errorCount > 0) {
          // Check if they keep making the same mistakes (using cached value)
          if (commonMistakes.length > 3) {
            // Extra aggressive for repeat offenders
            playAnimationWithTier('Wave', TIER.ACTIVE);
          } else {
            playAnimationWithTier('GetAttention', TIER.ACTIVE);
          }
        }
      }, 3000);
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
    };
  }, [enabled, agent, errorCount]);

  // Tier 2: Anger Reactor (Requirement 4)
  useEffect(() => {
    if (!enabled || !agent) {
      return;
    }

    // Check if anger increased (Requirement 4.1)
    if (angerLevel > prevAngerRef.current) {
      // Immediate Alert reaction (Requirement 4.1, 4.4)
      playAnimationWithTier('Alert', TIER.ACTIVE);

      // After Alert, do the "stare" (Requirement 4.2)
      setTimeout(() => {
        playAnimationWithTier('LookFront', TIER.ACTIVE);

        // Lock in stare for 3 seconds (Requirement 4.2, 4.3)
        stareTimerRef.current = setTimeout(() => {
          // Return to normal priority system
          currentTierRef.current = null;
        }, 3000);
      }, 2000); // Wait for Alert animation to finish
    }

    prevAngerRef.current = angerLevel;

    return () => {
      if (stareTimerRef.current) {
        clearTimeout(stareTimerRef.current);
      }
    };
  }, [angerLevel, enabled, agent]);

  // Tier 3: Mouse Tracker (The "Haunted" Gaze) (Requirement 2)
  useEffect(() => {
    if (!enabled || !agent) {
      return;
    }

    const handleMouseMove = (event: MouseEvent) => {
      mousePositionRef.current = { x: event.clientX, y: event.clientY };

      // Clear existing debounce timer
      if (mouseDebounceRef.current) {
        clearTimeout(mouseDebounceRef.current);
      }

      // Set new debounce timer (150ms - Requirement 2.6, reduced for better responsiveness)
      mouseDebounceRef.current = setTimeout(() => {
        // Only active if not speaking (allow during typing for better UX)
        if (isSpeaking) {
          return;
        }

        const mouseX = mousePositionRef.current.x;
        const mouseY = mousePositionRef.current.y;

        // Determine quadrant relative to Clippy's position (Requirement 2.2-2.5)
        const quadrant = getMouseQuadrant(mouseX, mouseY);

        // Only trigger if quadrant changed and is not null
        if (quadrant && quadrant !== lastMouseQuadrantRef.current) {
          lastMouseQuadrantRef.current = quadrant;

          const animationMap = {
            left: 'LookLeft',
            right: 'LookRight',
            up: 'LookUp',
            down: 'LookDown'
          };

          playAnimationWithTier(animationMap[quadrant], TIER.PASSIVE);
        } else if (quadrant === null && lastMouseQuadrantRef.current !== null) {
          // Mouse moved back to center, reset tracking
          lastMouseQuadrantRef.current = null;
        }
      }, 150); // Reduced debounce for more responsive tracking
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (mouseDebounceRef.current) {
        clearTimeout(mouseDebounceRef.current);
      }
    };
  }, [enabled, agent, isSpeaking]);

  // Tier 4: Idle Behavior Loop (Requirement 1)
  useEffect(() => {
    if (!enabled || !agent) {
      return;
    }

    const scheduleNextIdle = () => {
      // 8-12 second interval (Requirement 1.1)
      const interval = 8000 + Math.random() * 4000;

      idleTimerRef.current = setTimeout(() => {
        const timeSinceInteraction = Date.now() - lastInteractionTimeRef.current;

        // Only play if no interaction for 5 seconds (Requirement 1.2)
        if (timeSinceInteraction >= 5000) {
          const animation = getAngerBasedIdleAnimation(angerLevel);
          playAnimationWithTier(animation, TIER.IDLE);
        }

        // Schedule next idle check
        scheduleNextIdle();
      }, interval);
    };

    scheduleNextIdle();

    return () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
    };
  }, [enabled, agent, angerLevel]);

  // Easter Egg: Konami Code Detection (Requirement 11.1, 11.5)
  useEffect(() => {
    if (!enabled || !agent) {
      return;
    }

    const handleKonamiKeyDown = (event: KeyboardEvent) => {
      // Add key to buffer
      keyBufferRef.current.push(event.code);

      // Keep only last 10 keys
      if (keyBufferRef.current.length > 10) {
        keyBufferRef.current = keyBufferRef.current.slice(-10);
      }

      // Clear existing timeout
      if (konamiTimeoutRef.current) {
        clearTimeout(konamiTimeoutRef.current);
      }

      // Set new 5-second timeout to reset buffer
      konamiTimeoutRef.current = setTimeout(() => {
        keyBufferRef.current = [];
      }, 5000);

      // Check if buffer matches Konami sequence
      if (keyBufferRef.current.length === 10) {
        const matches = konamiSequence.every((key, index) => key === keyBufferRef.current[index]);
        if (matches && !konamiActivatedRef.current) {
          triggerKonamiCode();
        }
      }
    };

    window.addEventListener('keydown', handleKonamiKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKonamiKeyDown);
      if (konamiTimeoutRef.current) {
        clearTimeout(konamiTimeoutRef.current);
      }
    };
  }, [enabled, agent]);

  // Easter Egg: Alt+F4 Joke (Requirement 12.1, 12.5)
  useEffect(() => {
    if (!enabled || !agent) {
      return;
    }

    const handleAltF4KeyDown = (event: KeyboardEvent) => {
      try {
        // Windows/Linux: Alt+F4
        if (!isMac && event.altKey && event.key === 'F4') {
          event.preventDefault();
          triggerAltF4Joke();
        }

        // macOS: Cmd+Q
        if (isMac && event.metaKey && event.key === 'q') {
          event.preventDefault();
          triggerAltF4Joke();
        }
      } catch (error) {
        console.warn('Failed to prevent window close:', error);
        // Still trigger the joke even if preventDefault fails
        triggerAltF4Joke();
      }
    };

    window.addEventListener('keydown', handleAltF4KeyDown);

    return () => {
      window.removeEventListener('keydown', handleAltF4KeyDown);
    };
  }, [enabled, agent]);
}
