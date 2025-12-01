# Design Document

## Overview

This design implements an interactive Clippy agent using the Clippy.js library to replace the current emoji-based Clippy representation. The solution integrates the authentic 1997 Microsoft Office Assistant with a React component architecture, providing programmatic control over Clippy's animations through a Windows 95-styled button interface.

The design leverages CDN-hosted libraries (jQuery and Clippy.js) to avoid local dependencies and provides a clean separation between the agent lifecycle management and the animation control UI.

## Architecture

### High-Level Component Structure

```
App.tsx
  ├── GameContext.Provider (game state management)
  ├── BSOD.tsx (conditional render when crashed)
  └── MainWindow.tsx
        ├── ClippyAgent.tsx (Enhanced)
        │     ├── Clippy.js Agent Instance (via window.clippy)
        │     └── AnimationController (sub-component)
        ├── EditorArea.tsx (Enhanced with validation)
        │     └── Code Validator (utility)
        └── MenuBar.tsx (with Submit button)
```

### Library Integration Strategy

The Clippy.js library and its dependencies will be loaded via CDN in the `index.html` file. This approach:
- Avoids npm package management complexity
- Ensures compatibility with the jQuery-dependent Clippy.js library
- Allows the React components to access the global `window.clippy` object

### Component Responsibilities

**GameContext (Context Provider)**
- Manages global game state: 'PLAYING' or 'CRASHED'
- Tracks anger level (0-5)
- Tracks error count from code validation
- Provides functions to update game state
- Triggers crash when anger reaches 5 or submit with errors

**BSOD.tsx (Component)**
- Renders full-screen blue screen overlay with z-index 9999
- Displays authentic Windows 95 BSOD text and styling
- Listens for keyboard and mouse events
- Reloads window on any user interaction
- Cleans up event listeners on unmount

**ClippyAgent.tsx (Enhanced)**
- Manages the Clippy.js agent lifecycle (load, initialize, cleanup)
- Stores the agent instance in a React ref for programmatic control
- Renders the AnimationController component
- Handles agent loading errors gracefully
- Responds to anger level changes with appropriate animations

**AnimationController (Component)**
- Renders the four control buttons (Wave, Write, Confused, Idle)
- Applies Windows 95 styling to buttons
- Triggers animations on the agent instance via button clicks
- Positioned separately from the agent for better UX

**EditorArea (Enhanced Component)**
- Manages code input via textarea
- Debounces code changes by 1000ms before validation
- Invokes Code Validator on debounced changes
- Updates anger level state based on validation errors
- Passes anger level to ClippyAgent component
- Exposes error count to GameContext

**MenuBar (Enhanced Component)**
- Renders Windows 95 style menu bar
- Includes Submit Code button
- Checks error count before submission
- Triggers crash state if errors exist on submit

**Code Validator (Utility)**
- Wraps JSHint library for code validation
- Configures strict linting rules
- Returns structured error objects with line numbers and messages

## Components and Interfaces

### GameContext

**Context Interface:**
```typescript
interface GameContextType {
  gameState: 'PLAYING' | 'CRASHED';
  angerLevel: number;
  errorCount: number;
  setAngerLevel: (level: number) => void;
  setErrorCount: (count: number) => void;
  triggerCrash: () => void;
}
```

**Provider Implementation:**
- Uses useState to manage gameState, angerLevel, errorCount
- Automatically triggers crash when angerLevel reaches 5
- Provides triggerCrash function for manual crash (submit with errors)
- Wraps App component to provide global access

**State Management Logic:**
```typescript
useEffect(() => {
  if (angerLevel >= 5) {
    setGameState('CRASHED');
  }
}, [angerLevel]);
```

### BSOD Component

**Props Interface:**
```typescript
interface BSODProps {
  // No props needed - component is self-contained
}
```

**Styling:**
- Position: fixed with top: 0, left: 0, width: 100vw, height: 100vh
- Z-index: 9999 (highest in application)
- Background: #0000AA (classic BSOD blue)
- Font: 'Courier New', monospace, bold, white (#FFFFFF)
- Padding: 2rem for text spacing

**Layout Structure:**
```typescript
<div className="fixed inset-0 z-[9999] bg-[#0000AA] text-white font-['Courier_New'] font-bold p-8">
  <div className="text-center mb-8">
    <span className="bg-white text-[#0000AA] px-4 py-1">WINDOWS</span>
  </div>
  <div className="space-y-4">
    <p>A fatal exception 0E has occurred at 0028:C0011E36 in VXD CLIPPY(01).</p>
    <p>The current application has been terminated.</p>
    <p className="mt-8">
      * Press any key to terminate the current application.
      <br />
      * Press CTRL+ALT+DEL again to restart your computer. You will
      <br />
      &nbsp;&nbsp;lose any unsaved information in all applications.
    </p>
    <p className="mt-8">Press any key to continue _</p>
  </div>
</div>
```

**Event Handling:**
```typescript
useEffect(() => {
  const handleInteraction = () => {
    window.location.reload();
  };
  
  window.addEventListener('keydown', handleInteraction);
  window.addEventListener('click', handleInteraction);
  
  return () => {
    window.removeEventListener('keydown', handleInteraction);
    window.removeEventListener('click', handleInteraction);
  };
}, []);
```

### ClippyAgent Component

**Props Interface:**
```typescript
interface ClippyAgentProps {
  anger?: number;  // Used to determine which animation to play based on error count
  message?: string; // Keep for backward compatibility
}
```

**Internal State:**
```typescript
const agentRef = useRef<any>(null); // Stores the Clippy.js agent instance
const [isLoaded, setIsLoaded] = useState(false); // Tracks loading state
```

**Lifecycle:**
1. **Mount (useEffect)**: Call `window.clippy.load('Clippy', callback)` to initialize
2. **Callback**: Store agent in ref, call `agent.show()`, set isLoaded to true
3. **Unmount (cleanup)**: Call `agent.hide()` if agent exists

**Key Methods:**
- `playAnimation(animationName: string)`: Calls `agentRef.current.play(animationName)`

### AnimationController Component

**Props Interface:**
```typescript
interface AnimationControllerProps {
  onAnimationTrigger: (animationName: string) => void;
}
```

**Button Configuration:**
```typescript
const buttons = [
  { label: 'Wave', animation: 'Wave' },
  { label: 'Write', animation: 'Writing' },
  { label: 'Confused', animation: 'GetAttention' },
  { label: 'Idle', animation: 'Idle1_1' }
];
```

**Styling Approach:**
- Use Tailwind CSS classes for Windows 95 aesthetic
- Gray background: `bg-gray-400`
- Beveled borders: Custom border classes or inline styles to create 3D effect
- Hover state: Slightly darker background
- Layout: Horizontal flex container with gap between buttons

### EditorArea Component (Enhanced)

**Props Interface:**
```typescript
interface EditorAreaProps {
  onAngerChange?: (angerLevel: number) => void;
  onErrorCountChange?: (errorCount: number) => void;
}
```

**Internal State:**
```typescript
const [code, setCode] = useState<string>('');
const [errors, setErrors] = useState<ValidationError[]>([]);
```

**Debounce Logic:**
- Use `useEffect` with dependency on `code` state
- Set timeout for 1000ms
- Clear previous timeout on each code change
- When timeout expires, call `validateCode(code)`

**Anger Level Calculation (Updated for 0-5 scale):**
- 0 errors: anger level 0 (calm)
- 1-2 errors: anger level 1 (slightly annoyed)
- 3-4 errors: anger level 2 (frustrated)
- 5-7 errors: anger level 3 (very angry)
- 8-10 errors: anger level 4 (critical)
- 11+ errors: anger level 5 (triggers BSOD crash)

**Integration with GameContext:**
- Calls onAngerChange with calculated anger level
- Calls onErrorCountChange with error count
- GameContext monitors anger level and triggers crash at level 5

### Code Validator Utility

**Module Location:** `src/utils/codeValidator.ts`

**Function Signature:**
```typescript
interface ValidationError {
  line: number;
  reason: string;
}

export function validateCode(codeString: string): ValidationError[]
```

**JSHint Configuration:**
```typescript
const jshintConfig = {
  asi: false,        // Require semicolons
  unused: true,      // Disallow unused variables
  undef: true,       // Disallow undefined variables
  esversion: 6,      // Support ES6 syntax
  browser: true,     // Browser environment
  devel: true        // Allow console, alert, etc.
};
```

**Implementation:**
- Import JSHINT from 'jshint'
- Call `JSHINT(codeString, jshintConfig)`
- Extract errors from `JSHINT.errors`
- Map to ValidationError format
- Filter out null errors
- Return array of ValidationError objects

### Type Declarations

Since Clippy.js is loaded globally, we need to extend the Window interface:

```typescript
// src/types/clippy.d.ts
interface ClippyAgent {
  show(): void;
  hide(): void;
  play(animation: string, timeout?: number, callback?: () => void): void;
  animate(): void;
  speak(text: string): void;
  // Add other methods as needed
}

interface ClippyStatic {
  load(name: string, callback: (agent: ClippyAgent) => void): void;
}

interface Window {
  clippy: ClippyStatic;
}
```

## Data Models

### Agent State

The agent instance is stored in a React ref rather than state to avoid unnecessary re-renders:

```typescript
agentRef.current = {
  show: Function,
  hide: Function,
  play: Function,
  animate: Function,
  speak: Function,
  // ... other Clippy.js methods
}
```

### Animation Names

Valid animation strings for the Clippy character (based on Clippy.js documentation):
- 'Wave'
- 'Writing'
- 'GetAttention'
- 'Idle1_1'
- Additional animations available: 'Congratulate', 'Explain', 'GestureDown', 'GestureLeft', 'GestureRight', 'GestureUp', 'LookDown', 'LookLeft', 'LookRight', 'LookUp', 'Save', 'Search', 'SendMail', 'Think', etc.

### Anger-to-Animation Mapping

Based on the anger level prop, ClippyAgent will play different animations:

```typescript
const angerAnimations = {
  0: 'Idle1_1',           // Calm - idle animation
  1: 'LookDown',          // Slightly annoyed - looking down at code
  2: 'GetAttention',      // Frustrated - trying to get attention
  3: 'Wave',              // Very angry - waving frantically
  4: 'Alert',             // Critical - alert animation
  5: 'Crash'              // Maximum anger - triggers BSOD (handled by GameContext)
};
```

**Note:** When anger level reaches 5, the GameContext automatically transitions to CRASHED state, which renders the BSOD component and hides all other UI.

### Validation Error Model

```typescript
interface ValidationError {
  line: number;      // Line number where error occurred
  reason: string;    // Human-readable error message
}
```

### Game State Model

```typescript
type GameState = 'PLAYING' | 'CRASHED';

interface GameStateData {
  state: GameState;
  angerLevel: number;    // 0-5, where 5 triggers crash
  errorCount: number;    // Current number of validation errors
}
```

### Anger Level Thresholds

Updated thresholds to support 0-5 range:
- 0 errors: anger level 0 (calm)
- 1-2 errors: anger level 1 (slightly annoyed)
- 3-4 errors: anger level 2 (frustrated)
- 5-7 errors: anger level 3 (very angry)
- 8-10 errors: anger level 4 (critical)
- 11+ errors: anger level 5 (crash)

## Error Handling

### Game State Transitions

**Scenario**: Anger level reaches 5 or submit with errors

**Handling**:
- GameContext immediately sets gameState to 'CRASHED'
- App.tsx conditionally renders BSOD component
- All other UI components remain mounted but hidden behind BSOD
- No way to recover except page reload

**Edge Cases**:
- If anger level jumps from 3 to 5+ (many errors at once), crash triggers immediately
- If user rapidly clicks submit with errors, only one crash occurs (state already CRASHED)
- Event listeners cleaned up properly to prevent memory leaks

### BSOD Interaction Failures

**Scenario**: Event listeners don't fire or reload fails

**Handling**:
- Multiple event types (keydown, click) provide redundancy
- window.location.reload() is synchronous and reliable
- If reload somehow fails, user can manually refresh browser
- No timeout needed - user controls when to restart

### Library Loading Failures

**Scenario**: jQuery or Clippy.js fails to load from CDN

**Handling**:
- Check for `window.clippy` existence before calling `load()`
- If undefined, log error to console: "Clippy.js library not loaded"
- Render fallback UI (current emoji-based Clippy or error message)

### Agent Initialization Failures

**Scenario**: `clippy.load()` callback never fires or returns error

**Handling**:
- Implement timeout (5 seconds) for agent loading
- If timeout expires, log error and show fallback UI
- Display user-friendly message: "Clippy couldn't load. Please refresh the page."

### Animation Playback Failures

**Scenario**: Invalid animation name or agent not ready

**Handling**:
- Check `agentRef.current` exists before calling `play()`
- Wrap `play()` calls in try-catch
- Log animation errors to console without disrupting UI
- Silently fail if animation doesn't exist

### Code Validation Failures

**Scenario**: JSHint library not available or validation throws error

**Handling**:
- Check if JSHINT is defined before calling
- Wrap validation in try-catch block
- Return empty array on error
- Log validation errors to console
- Continue normal operation without blocking UI

## Testing Strategy

### Unit Tests

**GameContext**:
- Test initial state is 'PLAYING' with anger 0
- Test setAngerLevel updates anger level
- Test anger level 5 automatically sets state to 'CRASHED'
- Test triggerCrash sets state to 'CRASHED'
- Test state remains 'CRASHED' after multiple crash triggers

**BSOD Component**:
- Test component renders with correct blue background
- Test displays all required text content
- Test keydown event triggers window.location.reload
- Test click event triggers window.location.reload
- Test event listeners are removed on unmount
- Mock window.location.reload for testing

**ClippyAgent Component**:
- Test component renders without crashing
- Test agent initialization on mount
- Test cleanup on unmount (agent.hide() called)
- Mock `window.clippy` for isolated testing
- Test anger level prop triggers correct animation (0-4 range)

**AnimationController Component**:
- Test all four buttons render correctly
- Test button click handlers call onAnimationTrigger with correct animation name
- Test Windows 95 styling classes are applied

**Code Validator Utility**:
- Test validates code with semicolon errors
- Test validates code with unused variable errors
- Test returns empty array for valid code
- Test returns correct error format (line, reason)
- Test handles invalid input gracefully

**EditorArea Component**:
- Test debounce timer delays validation by 1000ms
- Test validation triggers on code change after debounce
- Test anger level calculation based on error count (0-5 scale)
- Test onAngerChange callback is invoked with correct level
- Test onErrorCountChange callback is invoked with error count

**MenuBar Component**:
- Test Submit button renders
- Test Submit with 0 errors does not trigger crash
- Test Submit with errors calls triggerCrash from context

### Integration Tests

**Full Component Integration**:
- Test ClippyAgent loads and displays agent
- Test clicking AnimationController buttons triggers animations on agent
- Test error handling when Clippy.js not available
- Test EditorArea validation flow updates ClippyAgent anger level
- Test typing in editor triggers validation after debounce
- Test Clippy animation changes based on code errors
- Test anger level 5 triggers BSOD display
- Test BSOD covers all UI elements
- Test Submit button with errors triggers BSOD
- Test any key press on BSOD reloads page

### Manual Testing Checklist

**Basic Clippy Functionality:**
- [ ] Clippy appears in bottom-right corner on page load
- [ ] Clicking "Wave" button makes Clippy wave
- [ ] Clicking "Write" button makes Clippy write
- [ ] Clicking "Confused" button makes Clippy show GetAttention animation
- [ ] Clicking "Idle" button makes Clippy show Idle1_1 animation
- [ ] Buttons have Windows 95 styling (gray, beveled)
- [ ] Buttons show hover effect
- [ ] Agent persists across component re-renders
- [ ] No console errors during normal operation

**Code Validation and Anger:**
- [ ] Typing code without errors keeps Clippy calm (Idle animation)
- [ ] Typing code with 1-2 errors makes Clippy slightly annoyed (LookDown)
- [ ] Typing code with 3-4 errors makes Clippy frustrated (GetAttention)
- [ ] Typing code with 5-7 errors makes Clippy very angry (Wave)
- [ ] Typing code with 8-10 errors makes Clippy critical (Alert)
- [ ] Validation waits 1 second after typing stops before running
- [ ] Fixing errors reduces Clippy's anger level appropriately

**BSOD Game Over:**
- [ ] Typing code with 11+ errors triggers BSOD immediately
- [ ] BSOD covers entire screen including taskbar
- [ ] BSOD has correct blue background (#0000AA)
- [ ] BSOD displays "WINDOWS" header with white background
- [ ] BSOD shows fatal exception message with CLIPPY reference
- [ ] BSOD text is white, bold, Courier New font
- [ ] Clicking Submit button with errors triggers BSOD
- [ ] Clicking Submit button with no errors does NOT trigger BSOD
- [ ] Pressing any key while BSOD shown reloads page
- [ ] Clicking anywhere while BSOD shown reloads page
- [ ] After reload, game starts fresh with anger level 0

## Context-Aware Roasting System

### Backend Flow

The linting service will be enhanced to provide context-aware feedback by running linters before calling the LLM:

**Enhanced Linting Service Flow:**
1. Receive lint request with code, language
2. Execute language-specific linter (already implemented)
3. Parse linter output to extract errors
4. **Decision Point:**
   - If `errors.length === 0`: Return `{ status: 'clean' }` without calling LLM
   - If `errors.length > 0`: Proceed to LLM call
5. Extract top 3 errors from linter results
6. Construct dynamic prompt with code snippet, language, and top 3 errors
7. Call LLM with enhanced prompt
8. Return roast response

**LLM Prompt Template:**
```javascript
const constructRoastPrompt = (code, language, top3Errors) => {
  return `The user wrote this code:
\`\`\`${language}
${code}
\`\`\`

The compiler/linter found these specific errors:
${JSON.stringify(top3Errors, null, 2)}

Roast the user specifically about these errors. Quote the error message if possible. Be witty but constructive.`;
};
```

**API Response Format:**
```typescript
// Clean code (no errors)
{ status: 'clean' }

// Code with errors
{ status: 'error', roast: string, errors: Array<{line: number, message: string}> }
```

### Frontend Integration

**ClippyAgent Enhancement:**
- Check response status before calling speak()
- Only trigger Clippy speech when roast is present
- Handle 'clean' status gracefully (no animation or message)

**Updated Flow:**
```typescript
// In component that calls linting API
const response = await lintCode(code, language);

if (response.status === 'clean') {
  // No errors, don't trigger Clippy
  setErrors([]);
} else if (response.roast) {
  // Errors found, show roast
  setErrors(response.errors);
  clippyAgent.speak(response.roast);
}
```

## Dynamic Message Duration

### Calculation Logic

The speak() method will calculate display duration dynamically based on message length:

**Formula:**
```typescript
const baseTime = 2000;        // Minimum 2 seconds
const timePerChar = 50;       // 50ms per character
const duration = Math.max(baseTime, text.length * timePerChar);
```

**Examples:**
- 10 characters: `Math.max(2000, 10 * 50)` = 2000ms (2 seconds)
- 50 characters: `Math.max(2000, 50 * 50)` = 2500ms (2.5 seconds)
- 100 characters: `Math.max(2000, 100 * 50)` = 5000ms (5 seconds)
- 200 characters: `Math.max(2000, 200 * 50)` = 10000ms (10 seconds)

### Implementation in ClippyAgent

**Current Implementation (to be replaced):**
```typescript
// Remove hardcoded timeout
setTimeout(() => {
  setShowSpeechBubble(false);
}, 2000); // ❌ Hardcoded
```

**New Implementation:**
```typescript
const speak = (text: string) => {
  setShowSpeechBubble(true);
  setGeminiFeedback(text);
  
  // Calculate dynamic duration
  const baseTime = 2000;
  const timePerChar = 50;
  const duration = Math.max(baseTime, text.length * timePerChar);
  
  // Apply calculated duration
  setTimeout(() => {
    setShowSpeechBubble(false);
  }, duration);
};
```

### Edge Cases

**Very Long Messages (>200 chars):**
- Duration could exceed 10 seconds
- Consider adding a maximum cap: `Math.min(duration, 15000)` (15 seconds max)
- Or implement pagination/scrolling for very long messages

**Empty Messages:**
- `Math.max(2000, 0 * 50)` = 2000ms (base time applies)
- Safe fallback behavior

**Multiple Rapid Calls:**
- Clear previous timeout before setting new one
- Store timeout ID in ref to enable cleanup

**Enhanced Implementation with Cleanup:**
```typescript
const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

const speak = (text: string) => {
  // Clear any existing timeout
  if (timeoutRef.current) {
    clearTimeout(timeoutRef.current);
  }
  
  setShowSpeechBubble(true);
  setGeminiFeedback(text);
  
  // Calculate dynamic duration with max cap
  const baseTime = 2000;
  const timePerChar = 50;
  const maxDuration = 15000; // 15 second cap
  const calculatedDuration = text.length * timePerChar;
  const duration = Math.min(Math.max(baseTime, calculatedDuration), maxDuration);
  
  // Apply calculated duration
  timeoutRef.current = setTimeout(() => {
    setShowSpeechBubble(false);
    timeoutRef.current = null;
  }, duration);
};
```

## Implementation Notes

### CDN Script Loading Order

Critical: jQuery must load before Clippy.js

```html
<!-- index.html -->
<script src="https://unpkg.com/jquery@3.2.1/dist/jquery.min.js"></script>
<script src="https://unpkg.com/clippyjs@latest"></script>
<link rel="stylesheet" href="https://unpkg.com/clippyjs@latest/assets/clippy.css">
```

### Positioning Strategy

- Clippy agent: Positioned by Clippy.js library (typically bottom-left by default)
- AnimationController: Fixed position in bottom-right corner using Tailwind classes
- Ensure no overlap between agent and controls

### Performance Considerations

- Agent instance stored in ref to prevent re-initialization on re-renders
- Animation triggers are lightweight function calls
- No state updates during animation playback to avoid unnecessary renders
- Debounce LLM API calls to avoid excessive requests (2 second debounce recommended)
- Cache linter results to avoid redundant linting

### Backward Compatibility

The enhanced ClippyAgent component maintains the same props interface as the current implementation, ensuring it can be dropped in as a replacement without breaking existing code. The `anger` prop is now actively used to control Clippy's animation based on code validation errors. The `message` prop is preserved for future use.

### Dependencies

**New Dependencies:**
- `jshint`: Code validation library
- `@types/jshint`: TypeScript type definitions for JSHint

**Installation:**
```bash
npm install --save-dev jshint @types/jshint
```
