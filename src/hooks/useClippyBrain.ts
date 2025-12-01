import { useEffect, useRef, useState } from 'react';

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
   * @param anger - Current anger level (0-5)
   * @returns Animation name
   */
  const getAngerBasedIdleAnimation = (anger: number): string => {
    if (anger === 0) {
      // Calm
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
   * Determine mouse quadrant based on window dimensions (Requirement 2.2, 2.3, 2.4, 2.5)
   * @param x - Mouse X coordinate
   * @param y - Mouse Y coordinate
   * @returns Mouse quadrant or null if in center zone
   */
  const getMouseQuadrant = (x: number, y: number): MouseQuadrant => {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    if (x < windowWidth * 0.4) return 'left';
    if (x > windowWidth * 0.6) return 'right';
    if (y < windowHeight * 0.2) return 'up';
    if (y > windowHeight * 0.8) return 'down';

    return null; // Center zone - no animation
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
          playAnimationWithTier('GetAttention', TIER.ACTIVE);
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

      // Set new debounce timer (200ms - Requirement 2.6)
      mouseDebounceRef.current = setTimeout(() => {
        // Only active if not speaking and not typing (Requirement 2.7)
        if (isSpeaking || isTyping) {
          return;
        }

        const mouseX = mousePositionRef.current.x;
        const mouseY = mousePositionRef.current.y;

        // Determine quadrant based on window dimensions (Requirement 2.2-2.5)
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
        }
      }, 200);
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (mouseDebounceRef.current) {
        clearTimeout(mouseDebounceRef.current);
      }
    };
  }, [enabled, agent, isSpeaking, isTyping]);

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
}
