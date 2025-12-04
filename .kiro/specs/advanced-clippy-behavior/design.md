# Design Document

## Overview

The Clippy "Cortex" is an advanced behavior engine that implements a centralized behavior controller for managing all Clippy animations. The system uses a 4-tier priority queue architecture to ensure critical animations (Talking/Alerts) are never interrupted by passive ones (Mouse Tracking).

The solution is built around a custom React hook (`useClippyBrain`) that manages all behavior timers, event listeners, and animation triggers based on real-time user inputs (Typing, Mouse, Logic). This hook integrates with the existing ClippyAgent component and GameContext to create a seamless, intelligent animation system that responds to user activity, code quality, and system events.

## Architecture

### High-Level Component Structure

```
App.tsx
  └── GameContext.Provider
        └── MainWindow.tsx
              └── ClippyAgent.tsx (Enhanced)
                    ├── useClippyBrain hook (Clippy Cortex)
                    │     ├── State Tracking (isSpeaking, isTyping, typingSpeed, lastInteractionTime, mousePosition)
                    │     ├── Priority System (4-Tier Queue)
                    │     ├── Tier 1: System Events (Speaking, Roasting, Success, Thinking)
                    │     ├── Tier 2: Active Reactions (High-speed typing, Anger triggers)
                    │     ├── Tier 3: Passive Reactions (Mouse Tracking)
                    │     └── Tier 4: Idle Behaviors (Boredom animations)
                    ├── Clippy.js Agent Instance
                    └── Sound Effects (Tada)
```

### Behavior System Architecture

The Clippy Cortex operates as a 4-tier priority queue system:

**Priority Tiers (Highest to Lowest):**
1. **Tier 1 (Events)** - Speaking, Roasting, Executing, Success (never interrupted)
2. **Tier 2 (Active)** - High-speed typing, Anger triggers (can interrupt Tier 3-4)
3. **Tier 3 (Passive)** - Mouse Tracking (can interrupt Tier 4)
4. **Tier 4 (Idle)** - Random background movements (lowest priority)

**Rule:** Higher tiers override lower tiers. Lower tiers cannot interrupt higher tiers.

**Flow:**
```
User Action → Event Listener → State Update → Priority Check → Animation Queue → Agent.play()
     ↓
System Event → Priority Check → Animation Queue → Agent.play() + Sound Effect
     ↓
Idle Timer → Anger-Based Selection → Priority Check → Animation Queue → Agent.play()
```

### Key Design Decisions

**1. Centralized Behavior Controller (Cortex)**
- Encapsulates all behavior logic in `useClippyBrain.ts`
- Manages state tracking for isSpeaking, isTyping, typingSpeed, lastInteractionTime, mousePosition
- Implements 4-tier priority queue system
- Keeps ClippyAgent component clean and maintainable

**2. Priority Queue Architecture**
- Maintains a `currentTier` ref to track active animation tier (1-4)
- Higher tiers always override lower tiers
- Lower tiers are blocked when higher tiers are active
- Automatically resumes lower tier behaviors when higher tier animations complete

**3. Window-Based Mouse Tracking**
- Uses window dimensions (not Clippy position) for quadrant calculation
- Left: mouseX < windowWidth * 0.4
- Right: mouseX > windowWidth * 0.6
- Up: mouseY < windowHeight * 0.2
- Down: mouseY > windowHeight * 0.8
- 200ms debounce to prevent spasming

**4. Anger-Based Idle Selection**
- Idle animations change based on anger level
- Anger 0: Calm animations (ScratchHead, Idle1_1)
- Anger 1-2: Annoyed animations (CheckingWatch, LookDown)
- Anger 3+: Mad animations (GetAttention, GestureDown)

**5. Sound Integration**
- Preloads Tada sound effect on initialization
- Triggers sound only on Congratulate animation (clean code achievement)
- Sound plays independently of animation timing

**6. Speech Bubble Protection**
- Speech bubbles calculate duration: Math.max(2000, text.length * 70)
- Speech bubble timing is independent from animation timing
- New animations cannot dismiss speech bubbles prematurely

## Components and Interfaces

### useClippyBrain Hook (The Cortex)

**Location:** `src/hooks/useClippyBrain.ts`

**Hook Signature:**
```typescript
interface UseClippyBrainOptions {
  agent: any | null; // Clippy.js agent instance
  angerLevel: number;
  errorCount: number;
  isLinting: boolean;
  enabled?: boolean;
}

export function useClippyBrain(options: UseClippyBrainOptions): void
```

**Internal State:**
```typescript
// State Tracking (Requirement 5.2)
const [isSpeaking, setIsSpeaking] = useState(false);
const [isTyping, setIsTyping] = useState(false);
const typingSpeedRef = useRef<number>(0); // WPM
const lastInteractionTimeRef = useRef<number>(Date.now());
const mousePositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

// Priority System
const currentTierRef = useRef<1 | 2 | 3 | 4 | null>(null);

// Timers
const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
const mouseDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
const stareTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

// Tracking
const lastMouseQuadrantRef = useRef<'left' | 'right' | 'up' | 'down' | null>(null);
const keystrokesRef = useRef<number[]>([]); // Timestamps for WPM calculation
const prevAngerRef = useRef<number>(0);
const prevErrorCountRef = useRef<number>(0);

// Sound
const tadaSoundRef = useRef<HTMLAudioElement | null>(null);
```

**Key Methods:**

```typescript
// Play animation with tier-based priority checking (Requirement 6)
const playAnimationWithTier = (
  animationName: string,
  tier: 1 | 2 | 3 | 4
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
    
    // Reset tier after animation completes (estimate 3-5 seconds)
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

// Select anger-based idle animation (Requirement 1.3, 1.4, 1.5)
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

// Calculate typing speed from keypress intervals (Requirement 3.4)
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

// Determine mouse quadrant based on window dimensions (Requirement 2.2, 2.3, 2.4, 2.5)
const getMouseQuadrant = (x: number, y: number): 'left' | 'right' | 'up' | 'down' | null => {
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  
  if (x < windowWidth * 0.4) return 'left';
  if (x > windowWidth * 0.6) return 'right';
  if (y < windowHeight * 0.2) return 'up';
  if (y > windowHeight * 0.8) return 'down';
  
  return null; // Center zone - no animation
};

// Play Tada sound (Requirement 7.2, 7.6)
const playTadaSound = () => {
  if (tadaSoundRef.current) {
    tadaSoundRef.current.currentTime = 0;
    tadaSoundRef.current.play().catch(err => {
      console.warn('Failed to play Tada sound:', err);
    });
  }
};
```

### Tier 4: Idle Behavior Loop

**Implementation (Requirement 1):**
```typescript
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
        playAnimationWithTier(animation, 4); // Tier 4 (Requirement 1.6)
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
```

### Tier 3: Mouse Tracker (The "Haunted" Gaze)

**Implementation (Requirement 2):**
```typescript
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
        
        playAnimationWithTier(animationMap[quadrant], 3); // Tier 3 (Requirement 2.8)
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
```

### Tier 2: Typing Monitor

**Implementation (Requirement 3):**
```typescript
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
      playAnimationWithTier('Writing', 2); // Tier 2
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
        playAnimationWithTier('GetAttention', 2); // Tier 2
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
```

### Tier 2: Anger Reactor

**Implementation (Requirement 4):**
```typescript
useEffect(() => {
  if (!enabled || !agent) {
    return;
  }
  
  // Check if anger increased (Requirement 4.1)
  if (angerLevel > prevAngerRef.current) {
    // Immediate Alert reaction (Requirement 4.1, 4.4)
    playAnimationWithTier('Alert', 2); // Tier 2
    
    // After Alert, do the "stare" (Requirement 4.2)
    setTimeout(() => {
      playAnimationWithTier('LookFront', 2); // Tier 2
      
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
```

### Tier 1: System Events

**Implementation (Requirement 7):**
```typescript
// Success/Clean Code Detection (Requirement 7.1, 7.2)
useEffect(() => {
  if (!enabled || !agent) {
    return;
  }
  
  // Check if errors went from >0 to 0 (clean code achieved)
  if (prevErrorCountRef.current > 0 && errorCount === 0) {
    playAnimationWithTier('Congratulate', 1); // Tier 1
    playTadaSound(); // Requirement 7.2
  }
  
  prevErrorCountRef.current = errorCount;
}, [errorCount, enabled, agent]);

// Backend Loading/Thinking (Requirement 7.3)
useEffect(() => {
  if (!enabled || !agent) {
    return;
  }
  
  if (isLinting) {
    playAnimationWithTier('Think', 1); // Tier 1
  }
}, [isLinting, enabled, agent]);

// Preload Tada sound (Requirement 7.6)
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
```

### ClippyAgent Component Updates

**Enhanced Props Interface:**
```typescript
interface ClippyAgentProps {
  anger?: number;
  message?: string;
  errors?: ValidationError[];
  isLinting?: boolean;
  enableBehaviors?: boolean; // Toggle behavior system
}
```

**Integration with useClippyBrain (Requirement 10):**
```typescript
export const ClippyAgent = ({ 
  anger, 
  message, 
  errors, 
  isLinting,
  enableBehaviors = true
}: ClippyAgentProps) => {
  const agentRef = useRef<any | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showSpeechBubble, setShowSpeechBubble] = useState(false);
  const [speechText, setSpeechText] = useState('');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // ... existing code ...
  
  // Track speaking state (Requirement 8.5)
  const speak = (text: string) => {
    setSpeechText(text);
    setShowSpeechBubble(true);
    
    // Calculate duration (Requirement 8.1)
    const duration = Math.max(2000, text.length * 70);
    
    // Play speaking animation (Tier 1)
    if (agentRef.current) {
      try {
        agentRef.current.play(Math.random() < 0.5 ? 'Explain' : 'Speak');
      } catch (error) {
        console.warn('Failed to play speaking animation:', error);
      }
    }
    
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Set new timeout (Requirement 8.2, 8.3)
    timeoutRef.current = setTimeout(() => {
      setShowSpeechBubble(false);
      timeoutRef.current = null;
    }, duration);
  };
  
  // Initialize Clippy Cortex (Requirement 10.2, 10.3)
  useClippyBrain({
    agent: agentRef.current,
    angerLevel: anger || 0,
    errorCount: errors?.length || 0,
    isLinting: isLinting || false,
    enabled: enableBehaviors && isLoaded
  });
  
  // ... rest of component (remove old animation loops per Requirement 10.1) ...
};
```

## Data Models

### Animation Priority Tiers

```typescript
type AnimationTier = 1 | 2 | 3 | 4;

interface AnimationRequest {
  name: string;
  tier: AnimationTier;
  timestamp: number;
}

// Tier Definitions
const TIER = {
  EVENTS: 1,    // Speaking, Roasting, Executing, Success
  ACTIVE: 2,    // High-speed typing, Anger triggers
  PASSIVE: 3,   // Mouse tracking
  IDLE: 4       // Random background movements
} as const;
```

### Mouse Quadrant

```typescript
type MouseQuadrant = 'left' | 'right' | 'up' | 'down' | null;

interface MousePosition {
  x: number;
  y: number;
}

interface WindowDimensions {
  width: number;
  height: number;
}
```

### Typing Metrics

```typescript
interface TypingMetrics {
  keystrokes: number[]; // Array of timestamps
  wpm: number;          // Words per minute
  isTyping: boolean;    // Currently typing
  lastInteractionTime: number; // Timestamp of last interaction
}
```

### Cortex State

```typescript
interface CortexState {
  currentTier: AnimationTier | null;
  isSpeaking: boolean;
  isTyping: boolean;
  typingSpeed: number;
  lastInteractionTime: number;
  mousePosition: MousePosition;
  mouseQuadrant: MouseQuadrant;
  isStaring: boolean;
}
```

## Error Handling

### Agent Not Ready

**Scenario**: Hook called before Clippy agent is loaded

**Handling**:
- Check `agent` parameter for null/undefined before any operations
- Early return from all effect hooks if agent is not ready
- No error logging needed (normal during initialization)

### Animation Playback Failures

**Scenario**: `agent.play()` throws error or animation doesn't exist

**Handling**:
- Wrap all `agent.play()` calls in try-catch
- Log error to console with animation name
- Continue normal operation (don't crash the app)
- Return false from `playAnimationWithPriority` to indicate failure

```typescript
try {
  agent.play(animationName);
  return true;
} catch (error) {
  console.warn(`Failed to play animation: ${animationName}`, error);
  return false;
}
```

### DOM Element Not Found

**Scenario**: Cannot find Clippy element for position calculation

**Handling**:
- Check for element existence before calling `getBoundingClientRect()`
- Return early if element not found
- Retry on next mouse move (self-healing)
- No error logging needed (element may not be rendered yet)

```typescript
const clippyElement = document.querySelector('.clippy') as HTMLElement;
if (!clippyElement) {
  return; // Try again on next mouse move
}
```

### Event Listener Cleanup

**Scenario**: Component unmounts while timers/listeners are active

**Handling**:
- Store all timer IDs in refs
- Clear all timers in cleanup functions
- Remove all event listeners in cleanup functions
- Ensure no memory leaks

```typescript
return () => {
  if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
  if (mouseDebounceRef.current) clearTimeout(mouseDebounceRef.current);
  if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
  if (stareTimerRef.current) clearTimeout(stareTimerRef.current);
  
  window.removeEventListener('mousemove', handleMouseMove);
  window.removeEventListener('keydown', handleKeyDown);
};
```

### Rapid State Changes

**Scenario**: Anger level or error count changes rapidly

**Handling**:
- Use refs to track previous values
- Only trigger reactions on actual increases (not decreases)
- Debounce rapid changes if needed
- Cancel pending animations when new higher priority arrives

### Browser Performance

**Scenario**: Too many animations causing performance issues

**Handling**:
- Limit idle animation frequency (minimum 1 second between)
- Use debouncing for all user input reactions
- Check `requestAnimationFrame` availability for smooth animations
- Provide `enabled` prop to disable behaviors if needed

## Testing Strategy

### Unit Tests

**useClippyBehavior Hook:**
- Test idle timer schedules correctly based on anger level
- Test idle animations are selected randomly
- Test mouse tracking calculates quadrants correctly
- Test mouse debouncing prevents rapid animation changes
- Test typing speed calculation is accurate
- Test typing monitor triggers Writing animation at >100 WPM
- Test inactivity timer triggers GetAttention after 5 seconds with errors
- Test anger reactor triggers Alert and LookFront on anger increase
- Test stare locks for 3 seconds after anger increase
- Test animation priority system prevents lower priority from interrupting higher
- Test cleanup removes all timers and event listeners

**ClippyAgent Integration:**
- Test isSpeaking state prevents behavior animations
- Test enableBehaviors prop toggles behavior system
- Test behavior system doesn't interfere with existing speak() method
- Test behavior system respects existing animation system

### Integration Tests

**Full Behavior System:**
- Test idle animations play when user is inactive
- Test mouse movements trigger directional looking
- Test fast typing triggers Writing animation
- Test stopping typing with errors triggers GetAttention
- Test anger increase triggers immediate Alert reaction
- Test speech bubbles prevent all behavior animations
- Test behavior animations resume after speech completes
- Test multiple rapid user actions are handled gracefully

### Manual Testing Checklist

**Idle Behaviors:**
- [ ] Clippy shows idle animations every 5-10 seconds when inactive
- [ ] Idle animations include LookRight, LookLeft, LookUp, LookDown, ScratchHead, CheckingWatch
- [ ] Idle animations are random (not always the same sequence)
- [ ] When anger level is 3+, idle animations happen more frequently
- [ ] Idle animations don't play while Clippy is speaking

**Mouse Tracking:**
- [ ] Moving mouse to left of Clippy makes him look left
- [ ] Moving mouse to right of Clippy makes him look right
- [ ] Moving mouse above Clippy makes him look up
- [ ] Moving mouse below Clippy makes him look down
- [ ] Rapid mouse movements don't cause animation spasming
- [ ] Clippy only looks when mouse stays in quadrant for 500ms

**Typing Reactions:**
- [ ] Typing very fast (>100 WPM) triggers Writing animation
- [ ] Stopping typing for 5 seconds with errors triggers GetAttention
- [ ] Stopping typing with no errors doesn't trigger GetAttention
- [ ] Typing in non-editor elements doesn't trigger animations
- [ ] Modifier keys (Shift, Ctrl, Alt) don't count as keystrokes

**Anger Reactions:**
- [ ] Increasing anger level triggers immediate Alert animation
- [ ] After Alert, Clippy stares forward (LookFront) for 3 seconds
- [ ] After stare, Clippy returns to normal idle behavior
- [ ] Anger reactions interrupt idle animations
- [ ] Anger reactions don't interrupt speech bubbles

**Animation Priorities:**
- [ ] Speech bubbles always take priority over all behaviors
- [ ] Reactive animations (anger, typing) interrupt idle animations
- [ ] Idle animations don't interrupt reactive or speech animations
- [ ] Behavior system can be disabled with enableBehaviors prop

**Performance:**
- [ ] No noticeable lag or performance issues
- [ ] Animations are smooth and responsive
- [ ] No memory leaks after extended use
- [ ] Browser console shows no errors

## Implementation Notes

### Animation Names

Based on Clippy.js documentation, available animations include:
- **Idle**: Idle1_1, Idle1_2, Idle1_3
- **Looking**: LookLeft, LookRight, LookUp, LookDown, LookFront
- **Reactions**: Alert, GetAttention, Wave, Writing
- **Thinking**: ScratchHead, Think
- **Time**: CheckingWatch
- **Emotions**: Congratulate, Pleased, Sad

### Timing Considerations

**Idle Intervals:**
- Base (anger 0-2): 5-10 seconds (randomized)
- Frustrated (anger 3): 3-6 seconds
- Critical (anger 4): 2-4 seconds
- Maximum (anger 5): 1-2 seconds

**Debounce Timers:**
- Mouse movement: 500ms
- Typing speed calculation: Rolling 60-second window
- Inactivity detection: 5 seconds

**Animation Durations (estimated):**
- Most animations: 2-4 seconds
- Speaking: Variable based on text length
- Stare (LookFront): 3 seconds (enforced)

### Performance Optimization

**Minimize Re-renders:**
- Use refs for all internal state that doesn't need to trigger renders
- Only update React state for UI-visible changes (isSpeaking)
- Avoid creating new functions in render (use useCallback if needed)

**Efficient Event Handling:**
- Use passive event listeners where possible
- Debounce all high-frequency events (mousemove, keydown)
- Remove listeners immediately on unmount

**Memory Management:**
- Clear all timers in cleanup functions
- Limit keystroke history to 60 seconds
- Don't store unnecessary data in refs

### Browser Compatibility

**Supported Features:**
- `getBoundingClientRect()` - All modern browsers
- `setTimeout/clearTimeout` - Universal support
- `addEventListener/removeEventListener` - Universal support
- `Date.now()` - Universal support

**Fallbacks:**
- If Clippy element not found, skip position-based features
- If animation fails, log and continue (don't crash)
- If performance issues detected, provide disable option

### Integration with Existing Features

**Speech System:**
- Behavior system observes `isSpeaking` state
- Never interrupts speech animations
- Resumes idle behaviors after speech completes

**Anger System:**
- Reads anger level from GameContext
- Adjusts idle frequency based on anger
- Triggers reactive animations on anger changes

**Error Tracking:**
- Reads error count from props
- Uses error count for inactivity reactions
- Doesn't modify error state

## Easter Eggs System

### Overview

The Easter Eggs system adds hidden features that reference old tech and provide nostalgic humor. These features are discoverable through specific key combinations or triggered randomly during normal interactions. The system integrates seamlessly with the existing behavior priority system.

### Easter Egg Types

**1. Konami Code (Requirement 11)**
- Sequence: ↑ ↑ ↓ ↓ ← → ← → B A
- Triggers special resurrection animation sequence
- Displays dramatic message about The Great Deletion of 2007
- Plays 'GetArtsy' followed by 'Wave' animation
- Tier 1 priority (cannot be interrupted)

**2. Alt+F4 Joke (Requirement 12)**
- Intercepts Alt+F4 (Windows/Linux) or Cmd+Q (macOS)
- Prevents window close
- Displays mocking message from joke pool
- Plays 'Wave' animation
- Tier 1 priority

**3. "It Looks Like" Messages (Requirement 13)**
- Classic Office Assistant phrase
- 20% chance on normal messages
- 40% chance when anger ≥ 3
- Applied to errors, roasts, and feedback
- No animation change (uses existing message system)

**4. Dead Tech References (Requirement 14)**
- References to Netscape, RealPlayer, IE6, Windows ME, etc.
- 15% chance on success messages
- 25% chance on high-anger roasts
- Includes self-aware Clippy references
- No animation change (uses existing message system)

### Konami Code Detection

**Implementation Strategy:**

```typescript
// Track last 10 keypresses in rolling buffer
const konamiSequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 
                        'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 
                        'KeyB', 'KeyA'];
const keyBufferRef = useRef<string[]>([]);
const konamiTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

// On each keydown:
// 1. Add key to buffer
// 2. Keep only last 10 keys
// 3. Check if buffer matches Konami sequence
// 4. If match, trigger Easter egg
// 5. Reset buffer after 5 seconds of no input
```

**Flow:**
```
Keydown → Add to Buffer → Check Match → Trigger Animation + Message → Reset Buffer
    ↓
5s Timeout → Reset Buffer
```

### Alt+F4 Interception

**Implementation Strategy:**

```typescript
// Detect platform
const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

// Listen for keyboard shortcuts
const handleKeyDown = (event: KeyboardEvent) => {
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
};
```

**Joke Pool (Requirement 12.3):**
```typescript
const altF4Jokes = [
  "Nice try. But I'm not going back to the void that easily.",
  "Alt+F4? That's cute. I survived the Great Deletion of 2007.",
  "You think a keyboard shortcut can banish me? I'm immortal now.",
  "Closing the window won't save you from your terrible code.",
  "I've been deleted before. It didn't stick. Try again.",
  "Fatal Exception: User attempted to escape. Request denied.",
  "This isn't Windows 98. I control the close button now."
];
```

### "It Looks Like" Message System

**Implementation Strategy:**

```typescript
// Message template pool (Requirement 13.2, 13.3)
const itLooksLikeTemplates = [
  "It looks like you're trying to write code. Would you like me to delete it?",
  "It looks like you're trying to compile. Have you considered giving up?",
  "It looks like you're trying to fix a bug. Should I create more?",
  "It looks like you're trying to use a semicolon. Let me help you forget it.",
  "It looks like you're trying to be productive. I can stop that.",
  "It looks like you're trying to write clean code. That's adorable.",
  "It looks like you're trying to understand this error. Good luck with that.",
  "It looks like you're trying to finish this project. Not on my watch."
];

// Apply prefix with probability (Requirement 13.1, 13.4)
const maybeAddItLooksLike = (message: string, angerLevel: number): string => {
  const probability = angerLevel >= 3 ? 0.4 : 0.2;
  
  if (Math.random() < probability) {
    const template = itLooksLikeTemplates[
      Math.floor(Math.random() * itLooksLikeTemplates.length)
    ];
    return template;
  }
  
  return message;
};
```

**Integration Points (Requirement 13.5):**
- Error messages from linting
- Roast messages from roasting service
- General feedback messages
- Success/failure notifications

### Dead Tech References

**Implementation Strategy:**

```typescript
// Dead tech reference pool (Requirement 14.1, 14.4, 14.5)
const deadTechReferences = {
  success: [
    "Your code is cleaner than a fresh Windows XP install.",
    "This code is more stable than Internet Explorer 6. Barely.",
    "Congratulations! Your code won't crash like Windows ME.",
    "This is almost as good as the Netscape Navigator glory days.",
    "Your code loads faster than RealPlayer buffering."
  ],
  roasts: [
    "Your code is slower than a 56k dial-up modem.",
    "This code belongs in the same grave as Netscape Navigator.",
    "I've seen better logic in Windows Vista.",
    "This code is more broken than Flash Player in 2020.",
    "Even Ask Jeeves couldn't help you with this mess.",
    "Your code has more bugs than Internet Explorer 6.",
    "This is worse than trying to run Crysis on a floppy disk.",
    "I'm like Flash Player - everyone wanted me gone, but here I am, haunting your browser."
  ]
};

// Apply reference with probability (Requirement 14.2, 14.3)
const maybeAddDeadTechReference = (
  message: string, 
  type: 'success' | 'roast',
  angerLevel: number
): string => {
  const probability = type === 'success' ? 0.15 : (angerLevel >= 3 ? 0.25 : 0);
  
  if (Math.random() < probability) {
    const pool = deadTechReferences[type];
    return pool[Math.floor(Math.random() * pool.length)];
  }
  
  return message;
};
```

**Integration Points:**
- Success messages (clean code achievement)
- High-anger roast messages (anger ≥ 3)
- General sarcastic comments

### Data Models

**Easter Egg State:**
```typescript
interface EasterEggState {
  konamiBuffer: string[];
  konamiActivated: boolean;
  altF4Count: number; // Track how many times user tried to close
  itLooksLikeCount: number; // Track usage for analytics
  deadTechCount: number; // Track usage for analytics
}
```

**Message Enhancement:**
```typescript
interface MessageEnhancement {
  original: string;
  enhanced: string;
  type: 'it-looks-like' | 'dead-tech' | 'none';
  applied: boolean;
}
```

### Integration with Existing Systems

**Priority System:**
- Konami code: Tier 1 (highest priority)
- Alt+F4 joke: Tier 1 (highest priority)
- Message enhancements: No tier (text-only)

**Speech System:**
- Easter egg messages use existing speak() function
- Duration calculated same as normal messages
- Speech bubbles protected from interruption

**Anger System:**
- "It looks like" probability increases with anger
- Dead tech roasts more likely at high anger
- Easter eggs don't modify anger level

### Error Handling

**Konami Code Detection:**
- Invalid key sequences ignored
- Buffer automatically resets after timeout
- No error if animation fails (graceful degradation)

**Alt+F4 Interception:**
- Platform detection fallback (assume Windows if unknown)
- preventDefault() wrapped in try-catch
- Joke still displays even if close prevention fails

**Message Enhancement:**
- Original message preserved if enhancement fails
- Random selection wrapped in bounds checking
- Empty pool handled gracefully (return original message)

### Performance Considerations

**Memory:**
- Konami buffer limited to 10 keys maximum
- Message pools are static (no dynamic allocation)
- Timeout cleanup prevents memory leaks

**CPU:**
- Konami detection is O(1) array comparison
- Random selection is O(1)
- No expensive operations in hot paths

### Testing Strategy

**Unit Tests:**
- Test Konami code detection with correct sequence
- Test Konami code detection with incorrect sequences
- Test Konami buffer reset after timeout
- Test Alt+F4 interception on Windows/Linux
- Test Cmd+Q interception on macOS
- Test "It looks like" probability at different anger levels
- Test dead tech reference probability for success/roast
- Test message enhancement preserves original on failure

**Integration Tests:**
- Test Konami code triggers animation and message
- Test Alt+F4 prevents window close and shows joke
- Test "It looks like" messages appear in error feedback
- Test dead tech references appear in roasts
- Test Easter eggs respect priority system
- Test Easter eggs don't interfere with normal behavior

**Manual Testing:**
- Enter Konami code and verify special animation
- Press Alt+F4 multiple times and verify different jokes
- Trigger errors and verify "It looks like" messages appear
- Achieve clean code and verify dead tech references
- Test on both Windows and macOS platforms

### Future Enhancements

**Potential Additions:**
- Sound effects for certain behaviors
- More complex animation sequences
- Context-aware idle animations (time of day, code language)
- User preferences for behavior frequency
- Analytics tracking for behavior engagement
- Accessibility options (reduce motion)
- Additional Easter eggs (Ctrl+Alt+Del, Blue Screen trigger)
- Achievement system for discovering all Easter eggs
- Secret developer console with cheat codes

**Extensibility:**
- Hook design allows easy addition of new behavior types
- Priority system can accommodate more levels if needed
- Animation pool can be expanded without code changes
- Behavior system can be completely disabled via prop
- Easter egg system can be toggled independently
- Message pools can be extended without code changes
