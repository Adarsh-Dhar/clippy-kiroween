# Design Document

## Overview

This design implements an interactive Clippy agent using the Clippy.js library to replace the current emoji-based Clippy representation. The solution integrates the authentic 1997 Microsoft Office Assistant with a React component architecture, providing programmatic control over Clippy's animations through a Windows 95-styled button interface.

The design leverages CDN-hosted libraries (jQuery and Clippy.js) to avoid local dependencies and provides a clean separation between the agent lifecycle management and the animation control UI.

## Architecture

### High-Level Component Structure

```
App.tsx
  └── MainWindow.tsx
        ├── ClippyAgent.tsx (Enhanced)
        │     ├── Clippy.js Agent Instance (via window.clippy)
        │     └── AnimationController (new sub-component)
        ├── EditorArea.tsx
        └── MenuBar.tsx
```

### Library Integration Strategy

The Clippy.js library and its dependencies will be loaded via CDN in the `index.html` file. This approach:
- Avoids npm package management complexity
- Ensures compatibility with the jQuery-dependent Clippy.js library
- Allows the React components to access the global `window.clippy` object

### Component Responsibilities

**ClippyAgent.tsx (Enhanced)**
- Manages the Clippy.js agent lifecycle (load, initialize, cleanup)
- Stores the agent instance in a React ref for programmatic control
- Renders the AnimationController component
- Handles agent loading errors gracefully

**AnimationController (New Component)**
- Renders the four control buttons (Wave, Write, Confused, Idle)
- Applies Windows 95 styling to buttons
- Triggers animations on the agent instance via button clicks
- Positioned separately from the agent for better UX

## Components and Interfaces

### ClippyAgent Component

**Props Interface:**
```typescript
interface ClippyAgentProps {
  anger?: number;  // Keep for backward compatibility, but not used by Clippy.js
  message?: string; // Keep for backward compatibility, but not used by Clippy.js
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

## Error Handling

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

## Testing Strategy

### Unit Tests

**ClippyAgent Component**:
- Test component renders without crashing
- Test agent initialization on mount
- Test cleanup on unmount (agent.hide() called)
- Mock `window.clippy` for isolated testing

**AnimationController Component**:
- Test all four buttons render correctly
- Test button click handlers call onAnimationTrigger with correct animation name
- Test Windows 95 styling classes are applied

### Integration Tests

**Full Component Integration**:
- Test ClippyAgent loads and displays agent
- Test clicking AnimationController buttons triggers animations on agent
- Test error handling when Clippy.js not available

### Manual Testing Checklist

- [ ] Clippy appears in bottom-right corner on page load
- [ ] Clicking "Wave" button makes Clippy wave
- [ ] Clicking "Write" button makes Clippy write
- [ ] Clicking "Confused" button makes Clippy show GetAttention animation
- [ ] Clicking "Idle" button makes Clippy show Idle1_1 animation
- [ ] Buttons have Windows 95 styling (gray, beveled)
- [ ] Buttons show hover effect
- [ ] Agent persists across component re-renders
- [ ] No console errors during normal operation

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

### Backward Compatibility

The enhanced ClippyAgent component maintains the same props interface as the current implementation, ensuring it can be dropped in as a replacement without breaking existing code. The `anger` and `message` props are preserved but not actively used by the Clippy.js integration.
