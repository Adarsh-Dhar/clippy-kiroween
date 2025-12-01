# Implementation Plan

- [x] 1. Extend GameContext with execution state management
  - Add `executionState` and `punishmentType` state properties to GameContext
  - Add `setExecutionState` and `setPunishmentType` functions to context interface
  - Initialize new states in GameProvider component
  - _Requirements: 7.5_

- [x] 2. Create useExecution hook
  - [x] 2.1 Implement core execution logic
    - Create `src/hooks/useExecution.ts` file
    - Import linting service and context dependencies
    - Implement `execute()` function that calls linting service
    - Add logic to determine success vs punishment based on error count
    - Implement random punishment selection (0-3)
    - _Requirements: 1.1, 1.2, 1.3, 3.1, 7.1, 7.2_
  
  - [x] 2.2 Implement state management
    - Add state for execution status tracking
    - Integrate with GameContext for state persistence
    - Implement `resetExecution()` function
    - Export hook interface with all required properties
    - _Requirements: 7.3, 7.4, 7.5_

- [x] 3. Create FakeTerminal component
  - [x] 3.1 Implement component structure and styling
    - Create `src/components/FakeTerminal.tsx` file
    - Add fixed positioning at bottom of screen with slide-up animation
    - Style with black background and green terminal text
    - Add Courier New monospace font
    - _Requirements: 2.1, 2.2_
  
  - [x] 3.2 Implement typing animation logic
    - Add state for current message index
    - Implement sequential message display with useEffect
    - Add random delay between messages (100-500ms)
    - Display all four terminal messages in order
    - Call onComplete callback after final message
    - _Requirements: 2.3, 2.4, 2.5_

- [x] 4. Create ClippyJail component
  - [x] 4.1 Implement visual design
    - Create `src/components/ClippyJail.tsx` file
    - Add full-screen overlay with semi-transparent background
    - Create iron bars pattern using CSS
    - Add Clippy with police hat or angry animation
    - _Requirements: 4.1, 4.2_
  
  - [x] 4.2 Implement escape mechanic
    - Add click counter state starting at 0
    - Implement click handler that increments counter
    - Add metal clang sound playback on each click
    - Add bar shake animation on click
    - Trigger onEscape callback at 20 clicks
    - _Requirements: 4.3, 4.4, 4.5_

- [x] 5. Create TheVoid component
  - [x] 5.1 Implement visual design
    - Create `src/components/TheVoid.tsx` file
    - Add full-screen black overlay
    - Create two glowing red eyes using CSS radial gradients
    - Position eyes with proper spacing
    - _Requirements: 5.1, 5.2, 5.3_
  
  - [x] 5.2 Implement mouse tracking and escape mechanic
    - Add mouse move handler to update eye positions
    - Implement smooth eye following with CSS transitions
    - Generate random position for invisible escape button
    - Create 10px × 10px invisible button at random position
    - Trigger onEscape when button is clicked
    - _Requirements: 5.4, 5.5, 5.6_
  
  - [x] 5.3 Add audio effects
    - Add low frequency drone sound that loops
    - Implement audio playback on component mount
    - Stop audio on escape
    - _Requirements: 5.7_

- [x] 6. Create RunButton component
  - Create `src/components/RunButton.tsx` file
  - Design green play icon button with Win95 styling
  - Add disabled state styling
  - Add tooltip "Run Code (Ctrl+Enter)"
  - Wire up onClick handler to call execute function
  - _Requirements: 6.1, 6.2, 6.4, 6.5_

- [x] 7. Integrate RunButton into MenuBar
  - Import RunButton component in MenuBar
  - Add RunButton to toolbar after existing buttons
  - Pass execute function from useExecution hook
  - Pass disabled state based on executionState
  - _Requirements: 6.1, 6.3_

- [x] 8. Update App.tsx with conditional overlay rendering
  - Import all new overlay components (FakeTerminal, ClippyJail, TheVoid)
  - Add conditional rendering for FakeTerminal based on success state
  - Add conditional rendering for BSOD based on punishment type
  - Add conditional rendering for ApologyModal based on punishment type
  - Add conditional rendering for ClippyJail based on punishment type
  - Add conditional rendering for TheVoid based on punishment type
  - Implement escape handlers that reset execution state
  - _Requirements: 1.2, 1.3, 3.1, 3.2, 3.3, 3.4_

- [x] 9. Add Clippy congratulate animation trigger
  - Implement success completion handler in App.tsx
  - Access Clippy agent from window object
  - Trigger "Congratulate" animation when FakeTerminal completes
  - _Requirements: 2.5_

- [x] 10. Add audio assets
  - Add `public/sounds/` directory
  - Add `clang.mp3` metal clanging sound file
  - Add `drone.mp3` low frequency drone sound file
  - _Requirements: 4.3, 5.7_

- [x] 11. Add keyboard shortcut for Run button
  - Update `src/hooks/useKeyboardShortcuts.ts` to include Ctrl+Enter
  - Trigger execute function when Ctrl+Enter is pressed
  - Ensure shortcut only works when not in punishment state
  - _Requirements: 6.5_

- [x] 12. Add accessibility features
  - Add ARIA labels to RunButton
  - Add ARIA live regions for FakeTerminal output
  - Add ARIA alerts for punishment state changes
  - Ensure all overlays are keyboard accessible
  - _Requirements: 6.5_

- [ ] 13. Write component tests
  - [ ] 13.1 Test useExecution hook
    - Test execute with 0 errors triggers success state
    - Test execute with errors triggers punishment state
    - Test random punishment selection
    - Test resetExecution function
    - _Requirements: 7.1, 7.2, 7.3_
  
  - [ ] 13.2 Test FakeTerminal component
    - Test message typing sequence
    - Test onComplete callback
    - Test slide-up animation
    - _Requirements: 2.3, 2.4, 2.5_
  
  - [ ] 13.3 Test ClippyJail component
    - Test click counter increments
    - Test escape at 20 clicks
    - Test onEscape callback
    - _Requirements: 4.3, 4.4, 4.5_
  
  - [ ] 13.4 Test TheVoid component
    - Test eye position updates
    - Test escape button click
    - Test onEscape callback
    - _Requirements: 5.4, 5.5, 5.6_
