# Requirements Document

## Introduction

The Clippy "Cortex" is an advanced behavior engine that implements a centralized behavior controller managing Clippy's animations based on real-time user inputs (Typing, Mouse, Logic). The system uses a Priority Queue architecture to ensure critical animations (Talking/Alerts) are never interrupted by passive ones (Mouse Tracking). This creates an immersive, human-like assistant experience that responds intelligently to user activity, code quality, and system events.

## Glossary

- **Clippy Cortex**: The centralized behavior controller that manages all Clippy animations and behaviors
- **Clippy Brain**: The custom React hook (useClippyBrain) that implements the behavior logic
- **Animation Priority Tier**: A hierarchical level (1-4) that determines which animations can interrupt others
- **Tier 1 (Events)**: Highest priority - Speaking, Roasting, Executing, Success animations
- **Tier 2 (Active)**: High priority - High-speed typing reactions, Anger triggers
- **Tier 3 (Passive)**: Medium priority - Mouse tracking and directional gazing
- **Tier 4 (Idle)**: Lowest priority - Random background movements and boredom behaviors
- **Anger Level**: A numeric value (0-5) representing Clippy's frustration with code quality
- **Debounce**: A delay mechanism to prevent excessive animation triggering
- **Mouse Quadrant**: A region of the screen (left, right, up, down) relative to window boundaries
- **WPM**: Words Per Minute - typing speed calculated from keypress intervals

## Requirements

### Requirement 1

**User Story:** As a user, I want Clippy to show idle behaviors when I'm not actively interacting, so that the assistant feels more alive and present.

#### Acceptance Criteria

1. THE Clippy Brain SHALL trigger an idle animation check every 8 to 12 seconds with randomized timing
2. WHEN no interaction occurs for 5 seconds AND no higher priority animation is active, THE Clippy Brain SHALL select a random animation from the anger-based idle pool
3. WHEN anger level is 0, THE Clippy Brain SHALL select from 'ScratchHead' and 'Idle1_1' animations
4. WHEN anger level is 1 or 2, THE Clippy Brain SHALL select from 'CheckingWatch' and 'LookDown' animations
5. WHEN anger level is 3 or above, THE Clippy Brain SHALL select from 'GetAttention' and 'GestureDown' animations
6. THE Clippy Brain SHALL assign Tier 4 priority to all idle animations

### Requirement 2

**User Story:** As a user, I want Clippy to track my mouse movements and look in the direction of my cursor, so that the interaction feels more natural and responsive.

#### Acceptance Criteria

1. WHEN the user moves the mouse, THE Clippy Brain SHALL capture the global mouse position coordinates
2. WHEN mouseX is less than 40 percent of window width, THE Clippy Brain SHALL trigger the 'LookLeft' animation
3. WHEN mouseX is greater than 60 percent of window width, THE Clippy Brain SHALL trigger the 'LookRight' animation
4. WHEN mouseY is less than 20 percent of window height, THE Clippy Brain SHALL trigger the 'LookUp' animation
5. WHEN mouseY is greater than 80 percent of window height, THE Clippy Brain SHALL trigger the 'LookDown' animation
6. THE Clippy Brain SHALL debounce mouse movement events by 200 milliseconds to prevent animation spasming
7. THE Clippy Brain SHALL only activate mouse tracking when isSpeaking is false AND isTyping is false
8. THE Clippy Brain SHALL assign Tier 3 priority to all mouse tracking animations

### Requirement 3

**User Story:** As a user, I want Clippy to react to my typing speed and patterns, so that the assistant appears to be paying attention to my work.

#### Acceptance Criteria

1. WHEN the user types in the editor, THE Clippy Brain SHALL track keydown events and update isTyping state
2. WHEN the user types faster than 100 words per minute, THE Clippy Brain SHALL trigger the 'Writing' animation
3. WHEN the user stops typing for more than 3 seconds AND error count exceeds 0, THE Clippy Brain SHALL trigger the 'GetAttention' animation
4. THE Clippy Brain SHALL calculate typing speed based on keypress intervals
5. THE Clippy Brain SHALL update lastInteractionTime on each keydown event
6. THE Clippy Brain SHALL assign Tier 2 priority to high-speed typing animations
7. THE Clippy Brain SHALL assign Tier 2 priority to inactivity GetAttention animations

### Requirement 4

**User Story:** As a user, I want Clippy to react immediately when the anger level increases, so that I receive instant feedback about code quality issues.

#### Acceptance Criteria

1. WHEN the anger level increases, THE Clippy Brain SHALL immediately trigger the 'Alert' animation
2. WHEN the anger level increases, THE Clippy Brain SHALL lock the animation to 'LookFront' for 3 seconds after Alert completes
3. AFTER the 3-second stare period, THE Clippy Brain SHALL return to normal behavior priority system
4. THE Clippy Brain SHALL assign Tier 2 priority to anger increase animations
5. WHEN anger level reaches 4 or above, THE Clippy Brain SHALL trigger 'Alert' animation as a roasting reaction

### Requirement 5

**User Story:** As a developer, I want the behavior system implemented as a custom hook, so that the logic is reusable and maintainable.

#### Acceptance Criteria

1. THE application SHALL implement a useClippyBrain custom hook in src/hooks/useClippyBrain.ts
2. THE useClippyBrain hook SHALL track isSpeaking, isTyping, typingSpeed, lastInteractionTime, and mousePosition in refs or state
3. THE useClippyBrain hook SHALL accept parameters for agent instance, anger level, error count, and isLinting status
4. THE useClippyBrain hook SHALL return no values (side-effects only)
5. THE useClippyBrain hook SHALL manage all behavior timers and event listeners internally
6. THE useClippyBrain hook SHALL clean up all timers and listeners when unmounted

### Requirement 6

**User Story:** As a developer, I want the priority system to ensure critical animations are never interrupted, so that the user experience remains coherent.

#### Acceptance Criteria

1. THE Clippy Brain SHALL implement a 4-tier priority system where higher tiers override lower tiers
2. THE Clippy Brain SHALL prevent lower tier animations from interrupting higher tier animations
3. WHEN a Tier 1 animation is active, THE Clippy Brain SHALL block all Tier 2, 3, and 4 animations
4. WHEN a Tier 2 animation is active, THE Clippy Brain SHALL block all Tier 3 and 4 animations
5. WHEN a Tier 3 animation is active, THE Clippy Brain SHALL block all Tier 4 animations
6. THE Clippy Brain SHALL allow higher tier animations to interrupt lower tier animations at any time

### Requirement 7

**User Story:** As a user, I want Clippy to react to system events with appropriate animations, so that I receive clear visual feedback.

#### Acceptance Criteria

1. WHEN clean code is achieved (no errors), THE Clippy Brain SHALL trigger the 'Congratulate' animation
2. WHEN the Congratulate animation plays, THE Clippy Brain SHALL trigger the 'Tada' sound effect
3. WHEN backend loading occurs (isLinting is true), THE Clippy Brain SHALL trigger the 'Think' animation
4. WHEN speaking occurs, THE Clippy Brain SHALL trigger 'Explain' or 'Speak' animation
5. THE Clippy Brain SHALL assign Tier 1 priority to all system event animations
6. THE Clippy Brain SHALL preload the Tada sound effect on initialization

### Requirement 8

**User Story:** As a developer, I want speech bubbles to remain visible for appropriate durations, so that users have time to read messages.

#### Acceptance Criteria

1. THE ClippyAgent component SHALL calculate speech bubble duration as Math.max(2000, text.length * 70) milliseconds
2. THE ClippyAgent component SHALL keep the speech bubble visible for the calculated duration
3. THE ClippyAgent component SHALL not allow new animations to dismiss the speech bubble prematurely
4. THE ClippyAgent component SHALL manage speech bubble timing independently from animation timing
5. THE speak function SHALL set isSpeaking to true at start and false after duration completes

### Requirement 9

**User Story:** As a developer, I want all agent.play() calls to be safe, so that the application doesn't crash if the agent is not ready.

#### Acceptance Criteria

1. THE Clippy Brain SHALL wrap all agent.play() calls in a check to ensure the agent is fully loaded
2. WHEN the agent is null or undefined, THE Clippy Brain SHALL skip the animation request
3. WHEN agent.play() throws an error, THE Clippy Brain SHALL catch the error and log a warning
4. THE Clippy Brain SHALL continue normal operation after animation failures
5. THE Clippy Brain SHALL not crash the application due to animation errors

### Requirement 10

**User Story:** As a developer, I want the ClippyAgent to integrate cleanly with the Clippy Brain, so that the behavior system works seamlessly.

#### Acceptance Criteria

1. THE ClippyAgent component SHALL remove any old or conflicting useEffect animation loops
2. THE ClippyAgent component SHALL utilize the useClippyBrain hook for all behavior management
3. THE ClippyAgent component SHALL pass agent instance, anger level, error count, and isLinting to useClippyBrain
4. THE ClippyAgent component SHALL maintain backward compatibility with existing props and functionality
5. THE ClippyAgent component SHALL not duplicate animation logic between component and hook
