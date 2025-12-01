# Design Document: Execution Logic & Shenanigan Roulette

## Overview

This feature adds a "Run Code" button that validates user code through the existing linting service and provides either positive reinforcement (simulated terminal output) or entertaining punishments (random shenanigans) based on code quality. The system integrates seamlessly with the existing GameContext and introduces four new interactive overlay components.

## Architecture

### High-Level Flow

```
User clicks Run Button
    ↓
useExecution hook triggered
    ↓
Linting Service validates code
    ↓
    ├─→ No errors → Success State → Fake Terminal + Clippy Congratulate
    └─→ Has errors → Punishment Roulette → Random Punishment (0-3)
                        ├─→ 0: BSOD (existing)
                        ├─→ 1: Apology Modal (existing)
                        ├─→ 2: Clippy Jail (new)
                        └─→ 3: The Void (new)
```

### State Management

The execution system extends the existing GameContext with new states:

- **Execution States**: `'idle' | 'validating' | 'success' | 'punishment'`
- **Punishment Types**: `'bsod' | 'apology' | 'jail' | 'void' | null`

## Components and Interfaces

### 1. useExecution Hook (`src/hooks/useExecution.ts`)

**Purpose**: Centralized execution logic and state management

**Interface**:
```typescript
interface UseExecutionReturn {
  executionState: 'idle' | 'validating' | 'success' | 'punishment';
  punishmentType: 'bsod' | 'apology' | 'jail' | 'void' | null;
  execute: () => Promise<void>;
  resetExecution: () => void;
}
```

**Key Responsibilities**:
- Trigger linting validation via existing `lintingService`
- Determine success vs punishment based on error count
- Randomly select punishment type (0-3)
- Manage execution state transitions
- Integrate with GameContext for state persistence

**Implementation Details**:
- Uses `lintCode()` from `src/utils/lintingService.ts`
- Accesses current code via EditorContext
- Accesses current language via FileSystemContext
- Uses `Math.floor(Math.random() * 4)` for punishment selection
- Sets execution state to 'validating' during linting
- Transitions to 'success' or 'punishment' based on results

### 2. FakeTerminal Component (`src/components/FakeTerminal.tsx`)

**Purpose**: Simulated terminal output for successful code execution

**Props**:
```typescript
interface FakeTerminalProps {
  isOpen: boolean;
  onComplete: () => void;
}
```

**Visual Design**:
- Fixed position at bottom of screen
- Height: 200px
- Background: `#000000`
- Text color: `#00FF00` (terminal green)
- Font: `'Courier New', monospace`
- Slide-up animation: 300ms ease-out

**Behavior**:
- Types out messages sequentially with random delays (100-500ms)
- Messages:
  1. `> Compiling source...`
  2. `> Linking libraries...`
  3. `> Optimizing assets...`
  4. `> Process exited with code 0.`
- Calls `onComplete()` after final message
- onComplete triggers Clippy "Congratulate" animation

**Implementation**:
- Uses `useState` for current message index
- Uses `useEffect` with `setTimeout` for typing animation
- Random delay: `Math.random() * 400 + 100` (100-500ms range)

### 3. ClippyJail Component (`src/components/ClippyJail.tsx`)

**Purpose**: Iron bars overlay with click-to-escape mechanic

**Props**:
```typescript
interface ClippyJailProps {
  isOpen: boolean;
  onEscape: () => void;
}
```

**Visual Design**:
- Full-screen overlay (z-index: 9999)
- Semi-transparent dark background: `rgba(0, 0, 0, 0.7)`
- Iron bars: Vertical repeating pattern using CSS
  - Width: 20px per bar
  - Spacing: 60px between bars
  - Color: `#4A4A4A` (dark gray)
  - Box shadow for 3D effect
- Clippy positioned center-bottom with police hat or angry animation

**Escape Mechanic**:
- Click counter starts at 0
- Each click on bars increments counter
- Plays metal clang sound on each click (HTML5 Audio)
- Visual feedback: bars shake on click
- At 20 clicks: fade out overlay and call `onEscape()`

**Implementation**:
- Uses `useState` for click counter
- Click handler on overlay div
- Audio element with `clang.mp3` sound effect
- CSS animation for bar shake effect
- Clippy integration via existing ClippyAgent component

### 4. TheVoid Component (`src/components/TheVoid.tsx`)

**Purpose**: Dark screen with hidden button escape mechanic

**Props**:
```typescript
interface TheVoidProps {
  isOpen: boolean;
  onEscape: () => void;
}
```

**Visual Design**:
- Full-screen overlay (z-index: 9999)
- Background: `#000000` (pure black)
- Two glowing red eyes:
  - CSS radial gradients
  - Color: `rgba(255, 0, 0, 0.8)`
  - Size: 40px diameter each
  - Spacing: 100px apart horizontally
  - Follow mouse cursor with smooth transition
- Invisible escape button:
  - Size: 10px × 10px
  - Random position within viewport bounds
  - No visual styling (completely invisible)
  - Cursor changes to pointer on hover

**Audio**:
- Low frequency drone sound (HTML5 Audio)
- Loops continuously while active
- Fades out on escape

**Implementation**:
- Uses `useState` for eye positions and button position
- `useEffect` to generate random button position on mount
- `onMouseMove` handler to update eye positions
  - Eyes follow cursor with offset calculation
  - Smooth transition via CSS `transition: all 0.1s ease`
- Button positioned absolutely at random coordinates
- Audio element with `drone.mp3` sound effect

### 5. RunButton Component (`src/components/RunButton.tsx`)

**Purpose**: Toolbar button to trigger code execution

**Props**:
```typescript
interface RunButtonProps {
  onClick: () => void;
  disabled: boolean;
}
```

**Visual Design**:
- Green play icon (SVG triangle)
- Win95 button styling (matches existing toolbar buttons)
- Disabled state: grayed out
- Tooltip: "Run Code (Ctrl+Enter)"

**Integration**:
- Added to MenuBar component
- Positioned after existing toolbar buttons
- Calls `execute()` from useExecution hook
- Disabled during validation state

## Data Models

### Execution State

```typescript
type ExecutionState = 'idle' | 'validating' | 'success' | 'punishment';
```

### Punishment Type

```typescript
type PunishmentType = 'bsod' | 'apology' | 'jail' | 'void' | null;
```

### Linting Result (existing)

```typescript
interface ValidationError {
  line: number;
  reason: string;
}
```

## Error Handling

### Linting Service Failures

- If linting API fails, treat as 0 errors (success state)
- Log error to console for debugging
- Display user-friendly message in Fake Terminal

### Audio Playback Failures

- Wrap audio playback in try-catch
- Continue with visual-only experience if audio fails
- Log warning to console

### Speech Recognition Failures (existing)

- Apology Modal already handles fallback to typing mode
- No changes needed

## Integration Points

### GameContext Extension

Add new state properties to GameContext:

```typescript
interface GameContextType {
  // Existing properties
  gameState: 'PLAYING' | 'CRASHED';
  angerLevel: number;
  errorCount: number;
  
  // New properties
  executionState: ExecutionState;
  punishmentType: PunishmentType;
  setExecutionState: (state: ExecutionState) => void;
  setPunishmentType: (type: PunishmentType) => void;
}
```

### App.tsx Updates

Conditionally render overlays based on execution state:

```typescript
{executionState === 'success' && (
  <FakeTerminal isOpen={true} onComplete={handleSuccessComplete} />
)}
{executionState === 'punishment' && punishmentType === 'bsod' && (
  <BSOD />
)}
{executionState === 'punishment' && punishmentType === 'apology' && (
  <ApologyModal ... />
)}
{executionState === 'punishment' && punishmentType === 'jail' && (
  <ClippyJail isOpen={true} onEscape={handleEscape} />
)}
{executionState === 'punishment' && punishmentType === 'void' && (
  <TheVoid isOpen={true} onEscape={handleEscape} />
)}
```

### MenuBar Integration

Add RunButton to MenuBar component:

```typescript
<RunButton 
  onClick={execute} 
  disabled={executionState === 'validating'} 
/>
```

### Clippy Animation Trigger

When success state completes, trigger Clippy animation:

```typescript
// In FakeTerminal onComplete handler
const clippyAgent = window.clippy;
if (clippyAgent) {
  clippyAgent.play('Congratulate');
}
```

## Testing Strategy

### Unit Tests

1. **useExecution Hook**
   - Test execute() with 0 errors → success state
   - Test execute() with errors → punishment state
   - Test random punishment selection distribution
   - Test state transitions
   - Test resetExecution()

2. **FakeTerminal Component**
   - Test message typing sequence
   - Test random delay ranges
   - Test onComplete callback
   - Test slide-up animation

3. **ClippyJail Component**
   - Test click counter increments
   - Test escape at 20 clicks
   - Test audio playback
   - Test bar shake animation

4. **TheVoid Component**
   - Test eye position updates on mouse move
   - Test random button positioning
   - Test escape button click
   - Test audio playback

### Integration Tests

1. **Full Execution Flow**
   - Test Run button → linting → success → terminal
   - Test Run button → linting → punishment → random overlay
   - Test escape from each punishment returns to idle state

2. **Context Integration**
   - Test GameContext state updates
   - Test EditorContext code access
   - Test FileSystemContext language access

### Manual Testing

1. Test with valid code in each language (Python, JavaScript, C, C++, Java)
2. Test with invalid code to trigger each punishment type
3. Test audio playback in different browsers
4. Test escape mechanics for each punishment
5. Test keyboard shortcut (Ctrl+Enter) for Run button

## Assets Required

### Audio Files

1. **clang.mp3**: Metal clanging sound for Clippy Jail
   - Duration: ~0.5 seconds
   - Format: MP3
   - Location: `public/sounds/clang.mp3`

2. **drone.mp3**: Low frequency drone for The Void
   - Duration: ~5 seconds (looped)
   - Format: MP3
   - Location: `public/sounds/drone.mp3`

### Visual Assets

- No new image assets required
- All visuals created with CSS and SVG

## Performance Considerations

### Linting Performance

- Linting API call timeout: 2000ms
- Show loading indicator during validation
- Cache linting results for unchanged code (future enhancement)

### Animation Performance

- Use CSS transforms for animations (GPU accelerated)
- Debounce mouse move events in TheVoid (100ms)
- Limit audio file sizes (<100KB each)

### Memory Management

- Clean up audio elements on component unmount
- Remove event listeners on component unmount
- Clear timeouts on component unmount

## Accessibility Considerations

### Keyboard Navigation

- Run button accessible via Tab key
- Ctrl+Enter keyboard shortcut for execution
- Escape key to exit overlays (future enhancement)

### Screen Readers

- Add ARIA labels to Run button
- Add ARIA live regions for terminal output
- Add ARIA alerts for punishment states

### Visual Accessibility

- Ensure sufficient contrast for terminal text
- Provide visual feedback for all interactions
- Support reduced motion preferences (future enhancement)

## Future Enhancements

1. **Configurable Punishment Weights**: Allow users to adjust probability of each punishment
2. **Achievement System**: Track successful runs and punishment escapes
3. **Custom Punishments**: Plugin system for user-created punishments
4. **Execution History**: Log of past executions with timestamps
5. **Code Snippets**: Save and load code snippets for testing
6. **Multiplayer Mode**: Share punishments with other users
