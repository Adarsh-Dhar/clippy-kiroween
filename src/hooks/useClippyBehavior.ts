import { useEffect, useRef } from 'react';
import type { ClippyAgentInstance } from '../types/clippy';

/**
 * Animation priority levels
 * SPEECH: Highest priority - never interrupted
 * REACTIVE: Medium priority - interrupts IDLE
 * IDLE: Lowest priority - can be interrupted by anything
 */
export type AnimationPriority = 'SPEECH' | 'REACTIVE' | 'IDLE';

/**
 * Mouse quadrant relative to Clippy's position
 */
export type MouseQuadrant = 'left' | 'right' | 'up' | 'down';

/**
 * Options for the useClippyBehavior hook
 */
export interface UseClippyBehaviorOptions {
  agent: ClippyAgentInstance | null;
  angerLevel: number;
  errorCount: number;
  isSpeaking: boolean;
  enabled?: boolean;
}

/**
 * Custom hook that manages autonomous Clippy behaviors including:
 * - Idle animations (looking around, scratching head, checking watch)
 * - Mouse tracking (looking at cursor)
 * - Typing reactions (writing animation, attention-seeking)
 * - Anger reactions (alert and stare)
 */
export function useClippyBehavior(options: UseClippyBehaviorOptions): void {
  const { agent, angerLevel, errorCount, isSpeaking, enabled = true } = options;

  // Refs for timers and state tracking
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mousePositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const mouseDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastMouseQuadrantRef = useRef<MouseQuadrant | null>(null);
  const keystrokesRef = useRef<number[]>([]); // Timestamps of keystrokes
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentPriorityRef = useRef<AnimationPriority | null>(null);
  const stareTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevAngerRef = useRef<number>(angerLevel);

  /**
   * Play animation with priority checking
   * @param animationName - Name of the animation to play
   * @param priority - Priority level of the animation
   * @returns true if animation was played, false if blocked by higher priority
   */
  const playAnimationWithPriority = (
    animationName: string,
    priority: AnimationPriority
  ): boolean => {
    // Check if current priority is higher
    if (currentPriorityRef.current === 'SPEECH') {
      return false; // Never interrupt speech
    }

    if (currentPriorityRef.current === 'REACTIVE' && priority === 'IDLE') {
      return false; // Don't interrupt reactive with idle
    }

    // Play animation
    try {
      agent.play(animationName);
      currentPriorityRef.current = priority;

      // Reset priority after animation completes (estimate 4 seconds)
      setTimeout(() => {
        if (currentPriorityRef.current === priority) {
          currentPriorityRef.current = null;
        }
      }, 4000);

      return true;
    } catch (error) {
      console.warn(`Failed to play animation: ${animationName}`, error);
      return false;
    }
  };

  /**
   * Calculate idle interval based on anger level
   * Higher anger = more frequent idle animations (more jittery)
   * @param anger - Current anger level (0-5)
   * @returns Interval in milliseconds
   */
  const getIdleInterval = (anger: number): number => {
    if (anger >= 5) return 1000 + Math.random() * 1000; // 1-2s
    if (anger >= 4) return 2000 + Math.random() * 2000; // 2-4s
    if (anger >= 3) return 3000 + Math.random() * 3000; // 3-6s
    return 5000 + Math.random() * 5000; // 5-10s (base)
  };

  /**
   * Select a random idle animation from the pool
   * @returns Animation name
   */
  const getRandomIdleAnimation = (): string => {
    const idleAnimations = [
      'LookRight',
      'LookLeft',
      'LookUp',
      'LookDown',
      'ScratchHead',
      'CheckingWatch'
    ];
    return idleAnimations[Math.floor(Math.random() * idleAnimations.length)];
  };

  // Idle behavior loop
  useEffect(() => {
    if (!enabled || !agent || isSpeaking) {
      return;
    }

    const scheduleNextIdle = () => {
      const interval = getIdleInterval(angerLevel);

      idleTimerRef.current = setTimeout(() => {
        // Only play if not speaking and no higher priority animation
        if (!isSpeaking && currentPriorityRef.current !== 'SPEECH' &&
            currentPriorityRef.current !== 'REACTIVE') {
          const animation = getRandomIdleAnimation();
          playAnimationWithPriority(animation, 'IDLE');
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
  }, [enabled, agent, isSpeaking, angerLevel]);

  // Mouse tracking system
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

      // Set new debounce timer
      mouseDebounceRef.current = setTimeout(() => {
        // Get Clippy's position
        const clippyElement = document.querySelector('.clippy') as HTMLElement;
        if (!clippyElement) {
          return; // Try again on next mouse move
        }

        const rect = clippyElement.getBoundingClientRect();
        const clippyX = rect.left + rect.width / 2;
        const clippyY = rect.top + rect.height / 2;

        const mouseX = mousePositionRef.current.x;
        const mouseY = mousePositionRef.current.y;

        // Determine quadrant
        const deltaX = mouseX - clippyX;
        const deltaY = mouseY - clippyY;

        let quadrant: MouseQuadrant;

        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          quadrant = deltaX < 0 ? 'left' : 'right';
        } else {
          quadrant = deltaY < 0 ? 'up' : 'down';
        }

        // Only trigger if quadrant changed
        if (quadrant !== lastMouseQuadrantRef.current) {
          lastMouseQuadrantRef.current = quadrant;

          const animationMap: Record<MouseQuadrant, string> = {
            left: 'LookLeft',
            right: 'LookRight',
            up: 'LookUp',
            down: 'LookDown'
          };

          playAnimationWithPriority(animationMap[quadrant], 'IDLE');
        }
      }, 500); // 500ms debounce
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (mouseDebounceRef.current) {
        clearTimeout(mouseDebounceRef.current);
      }
    };
  }, [enabled, agent]);

  /**
   * Calculate typing speed (WPM) based on recent keystrokes
   * @returns Words per minute
   */
  const calculateTypingSpeed = (): number => {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // Filter keystrokes within last 60 seconds
    const recentKeystrokes = keystrokesRef.current.filter(ts => ts > oneMinuteAgo);
    keystrokesRef.current = recentKeystrokes;

    // Calculate WPM (assuming 5 keystrokes per word)
    const elapsedSeconds = Math.min(60, (now - (recentKeystrokes[0] || now)) / 1000);
    if (elapsedSeconds === 0) return 0;

    const wpm = (recentKeystrokes.length / 5) * (60 / elapsedSeconds);
    return wpm;
  };

  // Typing monitor system
  useEffect(() => {
    if (!enabled || !agent) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      // Only track keystrokes in editor (check if target is textarea or contenteditable)
      const target = event.target as HTMLElement;
      if (!target.matches('textarea, [contenteditable="true"]')) {
        return;
      }

      // Ignore modifier keys
      if (event.key === 'Shift' || event.key === 'Control' ||
          event.key === 'Alt' || event.key === 'Meta') {
        return;
      }

      // Record keystroke timestamp
      keystrokesRef.current.push(Date.now());

      // Calculate current typing speed
      const wpm = calculateTypingSpeed();

      // Trigger Writing animation if typing fast
      if (wpm > 100) {
        playAnimationWithPriority('Writing', 'REACTIVE');
      }

      // Reset inactivity timer
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }

      // Set new inactivity timer (5 seconds)
      typingTimerRef.current = setTimeout(() => {
        // User stopped typing for 5 seconds with errors
        if (errorCount > 0) {
          playAnimationWithPriority('GetAttention', 'REACTIVE');
        }
      }, 5000);
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
    };
  }, [enabled, agent, errorCount]);

  // Anger reaction system
  useEffect(() => {
    if (!enabled || !agent) {
      return;
    }

    // Check if anger increased
    if (angerLevel > prevAngerRef.current) {
      // Skip if currently speaking
      if (isSpeaking) {
        prevAngerRef.current = angerLevel;
        return;
      }

      // Immediate reaction
      playAnimationWithPriority('Alert', 'REACTIVE');

      // After Alert, do the "stare"
      setTimeout(() => {
        playAnimationWithPriority('LookFront', 'REACTIVE');

        // Lock in stare for 3 seconds
        stareTimerRef.current = setTimeout(() => {
          // Return to idle after stare
          currentPriorityRef.current = null;
        }, 3000);
      }, 2000); // Wait for Alert animation to finish
    }

    prevAngerRef.current = angerLevel;

    return () => {
      if (stareTimerRef.current) {
        clearTimeout(stareTimerRef.current);
      }
    };
  }, [angerLevel, enabled, agent, isSpeaking]);
}
