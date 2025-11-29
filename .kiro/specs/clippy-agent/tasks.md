# Implementation Plan

- [x] 1. Add Clippy.js library dependencies to index.html
  - Add jQuery 3.2.1 script tag from unpkg CDN
  - Add Clippy.js script tag from unpkg CDN (must load after jQuery)
  - Add Clippy.js CSS stylesheet link from unpkg CDN
  - Verify script loading order: jQuery → Clippy.js → React app
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 2. Create TypeScript type declarations for Clippy.js
  - Create src/types/clippy.d.ts file
  - Define ClippyAgent interface with methods: show(), hide(), play(), animate(), speak()
  - Define ClippyStatic interface with load() method
  - Extend Window interface to include clippy property
  - _Requirements: 1.1, 1.2_

- [x] 3. Create AnimationController component
  - Create src/components/AnimationController.tsx file
  - Define AnimationControllerProps interface with onAnimationTrigger callback
  - Create button configuration array with labels and animation names (Wave, Write, Confused, Idle)
  - Implement button rendering with click handlers that call onAnimationTrigger
  - Apply Windows 95 styling: gray background (bg-gray-400), beveled borders, hover effects
  - Position component in a visible location using Tailwind fixed positioning
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4_

- [x] 4. Enhance ClippyAgent component with Clippy.js integration
  - [x] 4.1 Update ClippyAgent component structure
    - Import AnimationController component
    - Add agentRef using useRef to store Clippy.js agent instance
    - Add isLoaded state to track agent loading status
    - Keep existing anger and message props for backward compatibility
    - _Requirements: 1.1, 1.2_

  - [x] 4.2 Implement agent initialization logic
    - Add useEffect hook that runs on component mount
    - Check if window.clippy exists, log error if not available
    - Call window.clippy.load('Clippy', callback) to initialize agent
    - In callback: store agent in agentRef, call agent.show(), set isLoaded to true
    - Implement 5-second timeout for loading with error handling
    - Add cleanup function that calls agent.hide() on unmount
    - _Requirements: 1.1, 1.2, 1.3, 1.5_

  - [x] 4.3 Implement animation control method
    - Create playAnimation function that accepts animation name string
    - Check agentRef.current exists before calling play()
    - Wrap agent.play() call in try-catch for error handling
    - Log errors to console without disrupting UI
    - _Requirements: 2.2, 2.3, 2.4, 2.5_

  - [x] 4.4 Update component render method
    - Remove emoji-based Clippy rendering (📎)
    - Remove SpeechBubble component rendering
    - Render AnimationController component with onAnimationTrigger prop
    - Pass playAnimation function to AnimationController
    - Maintain bottom-right positioning for AnimationController
    - _Requirements: 1.4, 2.1, 3.3_

- [x] 5. Add unit tests for components
  - [x] 5.1 Write tests for AnimationController component
    - Test all four buttons render with correct labels
    - Test button clicks trigger onAnimationTrigger with correct animation names
    - Test Windows 95 styling classes are applied
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2_

  - [x] 5.2 Write tests for ClippyAgent component
    - Mock window.clippy for isolated testing
    - Test component renders without crashing
    - Test agent initialization on mount
    - Test cleanup calls agent.hide() on unmount
    - Test playAnimation method calls agent.play() with correct parameters
    - Test error handling when window.clippy is undefined
    - _Requirements: 1.1, 1.2, 1.3, 1.5_

- [x] 6. Manual testing and verification
  - Load application and verify Clippy appears in viewport
  - Click "Wave" button and verify Clippy plays Wave animation
  - Click "Write" button and verify Clippy plays Writing animation
  - Click "Confused" button and verify Clippy plays GetAttention animation
  - Click "Idle" button and verify Clippy plays Idle1_1 animation
  - Verify buttons have Windows 95 styling (gray background, beveled borders)
  - Verify buttons show hover effects
  - Check browser console for any errors during normal operation
  - _Requirements: 1.3, 1.4, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.4_
