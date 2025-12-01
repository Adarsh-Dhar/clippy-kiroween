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

- [ ] 7. Install JSHint library and type definitions
  - Run npm install --save-dev jshint @types/jshint
  - Verify installation in package.json devDependencies
  - _Requirements: 5.1_

- [ ] 8. Create code validation utility
  - [ ] 8.1 Create src/utils/codeValidator.ts file
    - Define ValidationError interface with line (number) and reason (string) properties
    - Export validateCode function that accepts codeString parameter
    - _Requirements: 5.3_
  
  - [ ] 8.2 Implement JSHint configuration and validation logic
    - Import JSHINT from 'jshint' library
    - Configure JSHint with strict rules: asi: false (require semicolons), unused: true (disallow unused variables), undef: true, esversion: 6, browser: true, devel: true
    - Call JSHINT with code string and configuration
    - Extract errors from JSHINT.errors array
    - Map errors to ValidationError format with line number and reason
    - Filter out null errors and return array
    - Wrap validation in try-catch and return empty array on error
    - _Requirements: 5.2, 5.3_

- [ ] 9. Enhance EditorArea component with validation
  - [ ] 9.1 Add state and props for validation
    - Add errors state using useState to store ValidationError array
    - Add onAngerChange prop to EditorAreaProps interface
    - Import validateCode function from utils/codeValidator
    - _Requirements: 5.4, 5.6_
  
  - [ ] 9.2 Implement debounced validation logic
    - Add useEffect hook with dependency on code state
    - Set timeout for 1000ms that calls validateCode with current code
    - Store returned errors in errors state
    - Clear previous timeout on each code change to implement debounce
    - Add cleanup function to clear timeout on unmount
    - _Requirements: 5.4, 5.5_
  
  - [ ] 9.3 Implement anger level calculation and callback
    - Calculate anger level based on error count: 0 errors = level 0, 1-3 errors = level 1, 4-7 errors = level 2, 8+ errors = level 3
    - Call onAngerChange callback with calculated anger level when errors change
    - Add useEffect hook with dependency on errors to trigger callback
    - _Requirements: 5.6_

- [ ] 10. Update ClippyAgent to respond to anger level
  - [ ] 10.1 Implement anger-based animation logic
    - Create anger-to-animation mapping object: 0 = 'Idle1_1', 1 = 'LookDown', 2 = 'GetAttention', 3 = 'Wave'
    - Add useEffect hook with dependency on anger prop
    - When anger changes and agent is loaded, call playAnimation with corresponding animation
    - _Requirements: 5.7_

- [ ] 11. Wire EditorArea to ClippyAgent in MainWindow
  - Update MainWindow component to manage anger state
  - Pass onAngerChange callback from EditorArea to update anger state
  - Pass anger state as prop to ClippyAgent component
  - _Requirements: 5.6, 5.7_

- [ ] 12. Add unit tests for code validation
  - [ ] 12.1 Write tests for codeValidator utility
    - Test validateCode returns errors for code missing semicolons
    - Test validateCode returns errors for unused variables
    - Test validateCode returns empty array for valid code
    - Test error objects have correct format (line number and reason)
    - Test handles invalid input gracefully
    - _Requirements: 5.2, 5.3_
  
  - [ ] 12.2 Write tests for EditorArea validation logic
    - Mock validateCode function
    - Test debounce delays validation by 1000ms using fake timers
    - Test validation triggers after debounce period
    - Test anger level calculation: 0 errors = 0, 3 errors = 1, 5 errors = 2, 10 errors = 3
    - Test onAngerChange callback invoked with correct level
    - _Requirements: 5.4, 5.5, 5.6_
  
  - [ ] 12.3 Write tests for ClippyAgent anger response
    - Mock agent.play method
    - Test anger level 0 triggers 'Idle1_1' animation
    - Test anger level 1 triggers 'LookDown' animation
    - Test anger level 2 triggers 'GetAttention' animation
    - Test anger level 3 triggers 'Wave' animation
    - _Requirements: 5.7_

- [ ] 13. Manual testing of validation feature
  - Type valid JavaScript code and verify Clippy stays calm (Idle animation)
  - Type code missing semicolons and verify Clippy shows appropriate anger level
  - Type code with unused variables and verify errors are detected
  - Verify validation waits 1 second after typing stops
  - Type code with 1-3 errors and verify Clippy shows LookDown animation
  - Type code with 4-7 errors and verify Clippy shows GetAttention animation
  - Type code with 8+ errors and verify Clippy shows Wave animation
  - Fix errors and verify Clippy's anger level decreases appropriately
  - _Requirements: 5.4, 5.5, 5.6, 5.7_

- [ ] 14. Create GameContext for global game state management
  - [ ] 14.1 Create GameContext provider
    - Create src/contexts/GameContext.tsx file
    - Define GameContextType interface with gameState, angerLevel, errorCount, setAngerLevel, setErrorCount, triggerCrash
    - Create GameContext using React.createContext
    - Implement GameProvider component with useState for gameState, angerLevel, errorCount
    - Export useGame custom hook for consuming context
    - _Requirements: 6.1_
  
  - [ ] 14.2 Implement automatic crash logic
    - Add useEffect hook that monitors angerLevel
    - When angerLevel reaches 5, set gameState to 'CRASHED'
    - Implement triggerCrash function that sets gameState to 'CRASHED'
    - Ensure state cannot transition back from 'CRASHED' to 'PLAYING'
    - _Requirements: 6.2_

- [ ] 15. Create BSOD component
  - [ ] 15.1 Create BSOD component structure
    - Create src/components/BSOD.tsx file
    - Set up component with no props (self-contained)
    - Apply fixed positioning with inset-0 and z-index 9999
    - Set background color to #0000AA (classic BSOD blue)
    - Apply Courier New font, white color, bold weight
    - _Requirements: 6.4, 6.5, 7.1_
  
  - [ ] 15.2 Implement BSOD text content
    - Render centered "WINDOWS" header with white background and blue text
    - Display fatal exception message: "A fatal exception 0E has occurred at 0028:C0011E36 in VXD CLIPPY(01)"
    - Display termination message: "The current application has been terminated"
    - Display instruction text about pressing any key and CTRL+ALT+DEL
    - Add blinking cursor effect with "Press any key to continue _"
    - _Requirements: 7.2, 7.3, 7.4, 7.5_
  
  - [ ] 15.3 Implement restart interaction logic
    - Add useEffect hook to attach global event listeners
    - Create handleInteraction function that calls window.location.reload()
    - Attach keydown event listener to window
    - Attach click event listener to window
    - Return cleanup function that removes both event listeners
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 16. Update EditorArea for expanded anger scale
  - [ ] 16.1 Update anger level calculation
    - Modify anger calculation to use 0-5 scale instead of 0-3
    - 0 errors = level 0, 1-2 errors = level 1, 3-4 errors = level 2
    - 5-7 errors = level 3, 8-10 errors = level 4, 11+ errors = level 5
    - Add onErrorCountChange prop to interface
    - Call onErrorCountChange callback with error count when errors change
    - _Requirements: 5.6, 6.2_

- [ ] 17. Update ClippyAgent for expanded anger animations
  - [ ] 17.1 Update anger-to-animation mapping
    - Extend angerAnimations object to include levels 4 and 5
    - Level 4: 'Alert' animation (critical state)
    - Level 5: handled by GameContext crash (no animation needed)
    - Update useEffect to handle anger levels 0-4
    - _Requirements: 5.7_

- [ ] 18. Enhance MenuBar with Submit button
  - [ ] 18.1 Add Submit Code button
    - Import useGame hook to access GameContext
    - Add Submit Code button to MenuBar component
    - Style button with Windows 95 aesthetic matching other UI
    - Position button in appropriate location in menu bar
    - _Requirements: 6.3_
  
  - [ ] 18.2 Implement submit validation logic
    - Get errorCount from GameContext
    - Add onClick handler to Submit button
    - Check if errorCount > 0 when clicked
    - If errors exist, call triggerCrash() from context
    - If no errors, show success message or animation (optional)
    - _Requirements: 6.3_

- [ ] 19. Integrate GameContext into App
  - [ ] 19.1 Wrap App with GameProvider
    - Import GameProvider from GameContext
    - Wrap main App component tree with GameProvider
    - Ensure all child components have access to game state
    - _Requirements: 6.1_
  
  - [ ] 19.2 Conditionally render BSOD
    - Import BSOD component and useGame hook in App.tsx
    - Get gameState from useGame hook
    - Render BSOD component when gameState === 'CRASHED'
    - Ensure BSOD renders above all other components
    - Keep MainWindow rendered but hidden behind BSOD
    - _Requirements: 6.4_
  
  - [ ] 19.3 Wire EditorArea callbacks to GameContext
    - Pass setAngerLevel from context to EditorArea as onAngerChange
    - Pass setErrorCount from context to EditorArea as onErrorCountChange
    - Ensure anger level and error count update in real-time
    - _Requirements: 5.6, 6.2_

- [ ] 20. Add unit tests for BSOD and GameContext
  - [ ] 20.1 Write tests for GameContext
    - Test initial state is 'PLAYING' with anger 0 and errorCount 0
    - Test setAngerLevel updates anger level correctly
    - Test anger level 5 automatically transitions to 'CRASHED'
    - Test triggerCrash sets state to 'CRASHED'
    - Test state remains 'CRASHED' after multiple triggers
    - _Requirements: 6.1, 6.2_
  
  - [ ] 20.2 Write tests for BSOD component
    - Mock window.location.reload for testing
    - Test component renders with correct background color
    - Test all text content is displayed correctly
    - Test keydown event triggers reload
    - Test click event triggers reload
    - Test event listeners are cleaned up on unmount
    - _Requirements: 6.4, 6.5, 7.1, 7.2, 7.3, 7.4, 7.5, 8.1, 8.2, 8.3, 8.4, 8.5_
  
  - [ ] 20.3 Write tests for MenuBar Submit button
    - Test Submit button renders
    - Test Submit with errorCount 0 does not trigger crash
    - Test Submit with errorCount > 0 calls triggerCrash
    - Mock GameContext for isolated testing
    - _Requirements: 6.3_
  
  - [ ] 20.4 Update EditorArea tests for new anger scale
    - Update anger level calculation tests for 0-5 scale
    - Test 0 errors = level 0, 2 errors = level 1, 4 errors = level 2
    - Test 6 errors = level 3, 9 errors = level 4, 11 errors = level 5
    - Test onErrorCountChange callback is invoked
    - _Requirements: 5.6_

- [ ] 21. Manual testing of BSOD feature
  - Load application and verify it starts in PLAYING state
  - Type code with 11+ errors and verify BSOD appears immediately
  - Verify BSOD covers entire screen including taskbar
  - Verify BSOD has correct blue background (#0000AA)
  - Verify "WINDOWS" header displays with white background
  - Verify fatal exception message includes "CLIPPY(01)" reference
  - Verify text is white, bold, Courier New font
  - Type code with 5 errors and click Submit button
  - Verify BSOD appears when submitting with errors
  - Type valid code and click Submit button
  - Verify BSOD does NOT appear when submitting without errors
  - While BSOD is displayed, press any key
  - Verify page reloads and game restarts fresh
  - While BSOD is displayed, click anywhere on screen
  - Verify page reloads and game restarts fresh
  - After reload, verify anger level is 0 and state is PLAYING
  - _Requirements: 6.2, 6.3, 6.4, 6.5, 7.1, 7.2, 7.3, 7.4, 7.5, 8.1, 8.2, 8.3, 8.4_

- [x] 22. Enhance backend linting service for context-aware roasts
  - [x] 22.1 Update linting service to check error count before LLM call
    - Modify lintCode function or create wrapper function
    - After linting completes, check if errors.length === 0
    - If no errors, return response with status: 'clean' without calling LLM
    - If errors exist, proceed to LLM call
    - _Requirements: 9.2_
  
  - [x] 22.2 Extract top 3 errors from linter results
    - After linting returns errors, slice first 3 errors from array
    - Format errors for inclusion in prompt (line number and message)
    - Handle cases where fewer than 3 errors exist
    - _Requirements: 9.3_
  
  - [x] 22.3 Create dynamic prompt construction function
    - Create constructRoastPrompt function that accepts code, language, and top3Errors
    - Build prompt template that includes code snippet in markdown code block
    - Include language identifier in code block
    - Add JSON-formatted error list to prompt
    - Include instruction to roast specifically about provided errors and quote them
    - _Requirements: 9.4, 9.5_
  
  - [x] 22.4 Update API endpoint to use enhanced linting flow
    - Modify POST /lint or /roast endpoint handler
    - Call linting service first before any LLM interaction
    - Use constructRoastPrompt to build LLM request
    - Return appropriate response format based on error status
    - Ensure backward compatibility with existing API consumers
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 23. Update frontend to handle context-aware responses
  - [x] 23.1 Update API response handling in linting service
    - Modify frontend linting service to handle new response format
    - Check for status: 'clean' in response
    - Extract roast string from response when present
    - Handle both old and new response formats for backward compatibility
    - _Requirements: 9.6, 9.7_
  
  - [x] 23.2 Update ClippyAgent to conditionally trigger speak
    - Modify component that receives linting results
    - Only call speak() method when roast string is present in response
    - Skip speak() call when status is 'clean'
    - Clear any existing messages when code is clean
    - _Requirements: 9.6, 9.7_

- [x] 24. Implement dynamic message duration in ClippyAgent
  - [x] 24.1 Add timeout ref for cleanup
    - Create timeoutRef using useRef to store timeout ID
    - Initialize as null
    - _Requirements: 10.5_
  
  - [x] 24.2 Create or update speak method with dynamic duration
    - Remove any hardcoded setTimeout values (e.g., 2000, 5000)
    - Define baseTime constant as 2000 milliseconds
    - Define timePerChar constant as 50 milliseconds
    - Calculate duration: Math.max(baseTime, text.length * timePerChar)
    - Add optional maxDuration cap of 15000ms to prevent excessively long displays
    - Clear existing timeout before setting new one
    - Store new timeout ID in timeoutRef
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_
  
  - [x] 24.3 Update all speech bubble timeout logic
    - Find all instances of setTimeout with showSpeechBubble
    - Replace hardcoded durations with calculated duration
    - Ensure consistent behavior across all message displays
    - Test with messages of varying lengths (10, 50, 100, 200 chars)
    - _Requirements: 10.5, 10.6_

- [ ] 25. Add tests for context-aware roasting
  - [ ] 25.1 Write backend tests for enhanced linting service
    - Test linting with zero errors returns status: 'clean'
    - Test linting with errors proceeds to LLM call
    - Test top 3 errors are correctly extracted
    - Test prompt construction includes code, language, and errors
    - Test API endpoint returns correct response format
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
  
  - [ ] 25.2 Write frontend tests for response handling
    - Test ClippyAgent does not call speak() when status is 'clean'
    - Test ClippyAgent calls speak() when roast is present
    - Test error state is cleared when code is clean
    - Mock API responses for testing
    - _Requirements: 9.6, 9.7_

- [ ] 26. Add tests for dynamic message duration
  - [ ] 26.1 Write tests for duration calculation
    - Test baseTime of 2000ms is minimum duration
    - Test duration increases by 50ms per character
    - Test Math.max ensures minimum duration is respected
    - Test maxDuration cap prevents excessive timeouts
    - Test short message (10 chars) uses baseTime
    - Test long message (100 chars) uses calculated time
    - _Requirements: 10.1, 10.2, 10.3, 10.4_
  
  - [ ] 26.2 Write tests for timeout cleanup
    - Test previous timeout is cleared when speak() called multiple times
    - Test timeout is stored in ref correctly
    - Test rapid successive calls don't create multiple active timeouts
    - Use fake timers for testing
    - _Requirements: 10.5, 10.6_

- [ ] 27. Manual testing of context-aware roasting
  - Write code with no errors and verify Clippy does not speak
  - Write code with 1 error and verify roast mentions that specific error
  - Write code with 5 errors and verify roast mentions top 3 errors
  - Verify roast quotes actual error messages from linter
  - Verify roast is contextually relevant to the code and errors
  - Test with different languages (JavaScript, Python, etc.)
  - Verify backend does not call LLM when code is clean
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

- [ ] 28. Manual testing of dynamic message duration
  - Trigger Clippy message with 10 characters and verify it displays for ~2 seconds
  - Trigger Clippy message with 50 characters and verify it displays for ~2.5 seconds
  - Trigger Clippy message with 100 characters and verify it displays for ~5 seconds
  - Trigger Clippy message with 200 characters and verify it displays for ~10 seconds
  - Trigger multiple messages rapidly and verify previous message is replaced
  - Verify no hardcoded timeouts remain in the implementation
  - Verify very long messages (>300 chars) are capped at reasonable duration
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_
