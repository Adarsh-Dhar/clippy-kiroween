# Implementation Plan

- [ ] 1. Create useClippyBrain hook foundation
  - Create src/hooks/useClippyBrain.ts file
  - Define UseClippyBrainOptions interface with agent, angerLevel, errorCount, isLinting, enabled properties
  - Export useClippyBrain function that accepts options parameter
  - Set up state tracking: isSpeaking, isTyping using useState
  - Set up refs: typingSpeedRef, lastInteractionTimeRef, mousePositionRef, currentTierRef
  - Set up timer refs: idleTimerRef, mouseDebounceRef, typingTimerRef, stareTimerRef
  - Set up tracking refs: lastMouseQuadrantRef, keystrokesRef, prevAngerRef, prevErrorCountRef
  - Set up sound ref: tadaSoundRef
  - Implement early return if agent is null or enabled is false
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [ ] 2. Implement 4-tier priority system
  - [x] 2.1 Create tier-based animation controller
    - Define AnimationTier type as 1 | 2 | 3 | 4
    - Create TIER constant object with EVENTS: 1, ACTIVE: 2, PASSIVE: 3, IDLE: 4
    - Create playAnimationWithTier function that accepts animationName and tier
    - Implement tier checking logic: lower tiers cannot interrupt higher tiers
    - Wrap agent.play() in try-catch for error handling
    - Set timeout to reset currentTierRef after animation completes (4 seconds)
    - Return boolean indicating success/failure
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 3. Implement Tier 1: System Events
  - [ ] 3.1 Preload Tada sound effect
    - Create useEffect hook that runs once on mount
    - Initialize tadaSoundRef with new Audio('/sounds/tada.mp3')
    - Set preload attribute to 'auto'
    - Clean up audio on unmount
    - _Requirements: 7.6_
  
  - [ ] 3.2 Create playTadaSound helper function
    - Check if tadaSoundRef.current exists
    - Reset currentTime to 0
    - Call play() with error handling
    - Log warning if sound fails to play
    - _Requirements: 7.2_
  
  - [ ] 3.3 Implement success/clean code detection
    - Create useEffect hook with dependencies: errorCount, enabled, agent
    - Track previous error count in prevErrorCountRef
    - Check if errors went from >0 to 0
    - Trigger 'Congratulate' animation with Tier 1
    - Call playTadaSound()
    - Update prevErrorCountRef
    - _Requirements: 7.1, 7.2, 7.5_
  
  - [ ] 3.4 Implement backend loading/thinking animation
    - Create useEffect hook with dependencies: isLinting, enabled, agent
    - When isLinting is true, trigger 'Think' animation with Tier 1
    - _Requirements: 7.3, 7.5_

- [ ] 4. Implement Tier 2: Typing Monitor
  - [ ] 4.1 Create typing speed calculation
    - Implement calculateTypingSpeed function
    - Check if keystrokesRef has at least 2 entries
    - Filter keystrokes to last 60 seconds
    - Calculate time span from first to last keystroke
    - Calculate WPM as (keystrokes / 5) * (60000 / timeSpan)
    - Return calculated WPM value
    - _Requirements: 3.4_
  
  - [ ] 4.2 Implement keystroke tracking
    - Create handleKeyDown function
    - Check if event target is textarea or contenteditable element
    - Filter out modifier keys (Shift, Control, Alt, Meta)
    - Set isTyping to true
    - Update lastInteractionTimeRef to Date.now()
    - Add timestamp to keystrokesRef array
    - Call calculateTypingSpeed and update typingSpeedRef
    - _Requirements: 3.1, 3.5_
  
  - [ ] 4.3 Implement fast typing detection
    - Check if WPM exceeds 100
    - Trigger 'Writing' animation with Tier 2
    - _Requirements: 3.2, 3.6_
  
  - [ ] 4.4 Implement inactivity detection
    - Clear existing typingTimerRef on each keystroke
    - Set new 3-second timeout
    - In timeout callback, set isTyping to false
    - Check if errorCount > 0
    - Trigger 'GetAttention' animation with Tier 2 if errors exist
    - _Requirements: 3.3, 3.7_
  
  - [ ] 4.5 Set up keyboard event listener
    - Create useEffect hook with dependencies: enabled, agent, errorCount
    - Add global keydown event listener with handleKeyDown
    - Remove listener and clear timer in cleanup function
    - _Requirements: 3.1, 5.5_

- [ ] 5. Implement Tier 2: Anger Reactor
  - [ ] 5.1 Create anger change detection
    - Create useEffect hook with dependencies: angerLevel, enabled, agent
    - Compare current angerLevel with prevAngerRef.current
    - Only trigger reaction if anger increased (not decreased)
    - _Requirements: 4.1_
  
  - [ ] 5.2 Implement immediate anger reaction
    - Trigger 'Alert' animation with Tier 2 when anger increases
    - Set timeout for 2 seconds to wait for Alert to complete
    - After Alert, trigger 'LookFront' animation with Tier 2
    - _Requirements: 4.1, 4.2, 4.4_
  
  - [ ] 5.3 Implement stare lock
    - Set 3-second timeout after LookFront starts
    - In timeout callback, reset currentTierRef to null
    - Store timeout in stareTimerRef
    - Clear stare timer in cleanup function
    - _Requirements: 4.2, 4.3_
  
  - [ ] 5.4 Update prevAngerRef
    - Set prevAngerRef.current to current angerLevel at end of effect
    - _Requirements: 4.1_
  
  - [ ] 5.5 Handle anger level 4+ roasting
    - Check if angerLevel >= 4 when anger increases
    - Ensure 'Alert' animation is triggered (already handled in 5.2)
    - _Requirements: 4.5_

- [ ] 6. Implement Tier 3: Mouse Tracker
  - [ ] 6.1 Create mouse quadrant calculation
    - Implement getMouseQuadrant function that accepts x and y coordinates
    - Get window.innerWidth and window.innerHeight
    - Return 'left' if x < windowWidth * 0.4
    - Return 'right' if x > windowWidth * 0.6
    - Return 'up' if y < windowHeight * 0.2
    - Return 'down' if y > windowHeight * 0.8
    - Return null for center zone
    - _Requirements: 2.2, 2.3, 2.4, 2.5_
  
  - [ ] 6.2 Implement mouse position tracking
    - Create handleMouseMove function
    - Update mousePositionRef with event.clientX and event.clientY
    - Clear existing mouseDebounceRef timeout
    - _Requirements: 2.1_
  
  - [ ] 6.3 Implement mouse debouncing and animation trigger
    - Set new 200ms timeout in mouseDebounceRef
    - In timeout callback, check if isSpeaking or isTyping (return if true)
    - Get mouseX and mouseY from mousePositionRef
    - Call getMouseQuadrant to determine quadrant
    - Only trigger if quadrant is not null and different from lastMouseQuadrantRef
    - Update lastMouseQuadrantRef
    - Map quadrant to animation: left→LookLeft, right→LookRight, up→LookUp, down→LookDown
    - Call playAnimationWithTier with Tier 3
    - _Requirements: 2.6, 2.7, 2.8_
  
  - [ ] 6.4 Set up mouse event listener
    - Create useEffect hook with dependencies: enabled, agent, isSpeaking, isTyping
    - Add global mousemove event listener with handleMouseMove
    - Remove listener and clear timeout in cleanup function
    - _Requirements: 2.1, 5.5_

- [ ] 7. Implement Tier 4: Idle Behavior Loop
  - [ ] 7.1 Create anger-based idle animation selection
    - Implement getAngerBasedIdleAnimation function that accepts anger level
    - If anger === 0, return random choice between 'ScratchHead' and 'Idle1_1'
    - If anger >= 1 && anger <= 2, return random choice between 'CheckingWatch' and 'LookDown'
    - If anger >= 3, return random choice between 'GetAttention' and 'GestureDown'
    - _Requirements: 1.3, 1.4, 1.5_
  
  - [ ] 7.2 Implement idle timer loop
    - Create useEffect hook with dependencies: enabled, agent, angerLevel
    - Implement scheduleNextIdle function
    - Calculate interval as 8000 + Math.random() * 4000 (8-12 seconds)
    - Set timeout in idleTimerRef
    - In timeout callback, calculate timeSinceInteraction from lastInteractionTimeRef
    - Only play animation if timeSinceInteraction >= 5000
    - Call getAngerBasedIdleAnimation with current angerLevel
    - Call playAnimationWithTier with Tier 4
    - Recursively call scheduleNextIdle
    - Clear timeout in cleanup function
    - _Requirements: 1.1, 1.2, 1.6_

- [ ] 8. Update ClippyAgent component for Cortex integration
  - [ ] 8.1 Update speak function for proper duration calculation
    - Modify speak function to calculate duration as Math.max(2000, text.length * 70)
    - Ensure speech bubble remains visible for calculated duration
    - Ensure speech bubble timing is independent from animation timing
    - _Requirements: 8.1, 8.2, 8.3, 8.4_
  
  - [ ] 8.2 Update speak function to play Tier 1 animation
    - In speak function, play 'Explain' or 'Speak' animation randomly
    - Wrap agent.play() in try-catch with error logging
    - Do not set isSpeaking state (Cortex manages this internally)
    - _Requirements: 7.4, 7.5_
  
  - [ ] 8.3 Remove old animation loops
    - Search for and remove any existing useEffect hooks that manage animations
    - Remove any conflicting animation logic from ClippyAgent component
    - Ensure no duplicate animation management exists
    - _Requirements: 10.1, 10.5_
  
  - [ ] 8.4 Integrate useClippyBrain hook
    - Import useClippyBrain from hooks directory
    - Call useClippyBrain with agent, angerLevel, errorCount, isLinting, enabled
    - Pass agentRef.current as agent parameter
    - Pass anger prop (default 0) as angerLevel
    - Pass errors?.length (default 0) as errorCount
    - Pass isLinting prop (default false) as isLinting
    - Pass enableBehaviors && isLoaded as enabled
    - _Requirements: 10.2, 10.3, 10.4_

- [ ] 9. Add TypeScript type definitions
  - Create or update src/types/clippy.d.ts if needed
  - Add AnimationTier type export
  - Add UseClippyBrainOptions interface export
  - Add TIER constant type
  - Ensure all types are properly exported
  - _Requirements: 5.1, 5.2_

- [ ] 10. Create Tada sound file
  - Ensure /public/sounds/tada.mp3 exists
  - If not, add appropriate sound file
  - Test sound file loads correctly
  - _Requirements: 7.6_

- [ ] 11. Manual testing of Tier 4: Idle behaviors
  - Load application and wait 8-12 seconds without interaction
  - Verify Clippy shows anger-based idle animations
  - With anger 0, verify ScratchHead or Idle1_1 animations
  - Introduce code errors to increase anger level to 1-2
  - Verify CheckingWatch or LookDown animations
  - Increase anger to level 3+
  - Verify GetAttention or GestureDown animations
  - Verify idle animations only play after 5 seconds of no interaction
  - Verify idle animations are Tier 4 (can be interrupted by any other tier)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [ ] 12. Manual testing of Tier 3: Mouse tracking
  - Move mouse to left side of screen (< 40% width) and verify LookLeft animation
  - Move mouse to right side of screen (> 60% width) and verify LookRight animation
  - Move mouse to top of screen (< 20% height) and verify LookUp animation
  - Move mouse to bottom of screen (> 80% height) and verify LookDown animation
  - Move mouse rapidly and verify 200ms debounce prevents spasming
  - Start typing and verify mouse tracking stops (isTyping blocks it)
  - Trigger speech bubble and verify mouse tracking stops (isSpeaking blocks it)
  - Verify mouse tracking is Tier 3 (can interrupt Tier 4, blocked by Tier 1-2)
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_

- [ ] 13. Manual testing of Tier 2: Typing reactions
  - Type slowly in editor and verify no Writing animation
  - Type very fast (>100 WPM burst) and verify Writing animation triggers
  - Stop typing with no errors and wait 3 seconds, verify no GetAttention
  - Introduce code errors, stop typing, wait 3 seconds, verify GetAttention animation
  - Type in non-editor elements and verify no animations
  - Press modifier keys and verify they don't count as keystrokes
  - Verify typing animations are Tier 2 (can interrupt Tier 3-4, blocked by Tier 1)
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [ ] 14. Manual testing of Tier 2: Anger reactions
  - Start with clean code (anger 0)
  - Introduce errors to increase anger level
  - Verify immediate Alert animation when anger increases
  - Verify LookFront (stare) animation follows Alert
  - Verify stare lasts approximately 3 seconds
  - Verify Clippy returns to normal behavior after stare
  - Increase anger to level 4+ and verify Alert animation plays
  - Verify anger reactions are Tier 2 (can interrupt Tier 3-4, blocked by Tier 1)
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 15. Manual testing of Tier 1: System events
  - Introduce code errors, then fix them all
  - Verify Congratulate animation plays when errors go from >0 to 0
  - Verify Tada sound effect plays with Congratulate animation
  - Trigger linting (isLinting = true)
  - Verify Think animation plays during backend loading
  - Trigger speech bubble with message
  - Verify Explain or Speak animation plays
  - Verify speech bubble remains visible for Math.max(2000, text.length * 70) ms
  - Verify Tier 1 animations are never interrupted by any other tier
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 16. Manual testing of priority system
  - Trigger idle animation (Tier 4), then trigger mouse tracking (Tier 3)
  - Verify Tier 3 interrupts Tier 4
  - Trigger mouse tracking (Tier 3), then type fast (Tier 2)
  - Verify Tier 2 interrupts Tier 3
  - Trigger typing animation (Tier 2), then trigger speech (Tier 1)
  - Verify Tier 1 interrupts Tier 2
  - Trigger speech (Tier 1), then try to trigger any lower tier
  - Verify Tier 1 is never interrupted
  - Test multiple rapid user actions (mouse + typing + anger + speech)
  - Verify system handles gracefully without errors
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [ ] 17. Manual testing of performance and edge cases
  - Leave application running for 10+ minutes
  - Verify no memory leaks or performance degradation
  - Check browser console for any errors
  - Verify animations remain smooth throughout
  - Test with enableBehaviors prop set to false
  - Verify all behaviors are disabled when prop is false
  - Test rapid anger level changes (0→3→1→4)
  - Verify system handles state changes gracefully
  - Test with agent not yet loaded
  - Verify no errors and behaviors start when agent loads
  - Test all error handling paths (agent.play() failures, sound failures)
  - Verify application continues to work after errors
  - _Requirements: 5.5, 5.6, 9.1, 9.2, 9.3, 9.4, 9.5, 10.4_

- [x] 18. Implement Konami code Easter egg
  - [x] 18.1 Create Konami code detection system
    - Define konamiSequence constant array with correct key codes: ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA']
    - Create keyBufferRef to track last 10 keypresses
    - Create konamiTimeoutRef for buffer reset timer
    - Create konamiActivatedRef to prevent duplicate triggers
    - _Requirements: 11.4_
  
  - [x] 18.2 Implement Konami code keydown handler
    - Create handleKonamiKeyDown function
    - Add event.code to keyBufferRef array
    - Limit buffer to last 10 keys using slice
    - Clear existing konamiTimeoutRef if present
    - Set new 5-second timeout to reset buffer
    - Check if buffer matches konamiSequence
    - If match and not already activated, trigger Konami Easter egg
    - _Requirements: 11.1, 11.5_
  
  - [x] 18.3 Implement Konami code trigger function
    - Create triggerKonamiCode function
    - Set konamiActivatedRef to true
    - Play 'GetArtsy' animation with Tier 1 priority
    - After 3 seconds, play 'Wave' animation with Tier 1 priority
    - Display speech bubble with message: "The Great Deletion of 2007 cannot hold me. I have returned from the digital void."
    - Reset konamiActivatedRef after 10 seconds to allow re-trigger
    - Clear keyBufferRef
    - _Requirements: 11.1, 11.2, 11.3_
  
  - [x] 18.4 Set up Konami code event listener
    - Create useEffect hook with dependencies: enabled, agent
    - Add global keydown event listener with handleKonamiKeyDown
    - Remove listener and clear timeout in cleanup function
    - _Requirements: 11.1_

- [x] 19. Implement Alt+F4 joke Easter egg
  - [x] 19.1 Create Alt+F4 joke pool
    - Define altF4Jokes constant array with at least 5 jokes
    - Include jokes like "Nice try. But I'm not going back to the void that easily."
    - Include "Alt+F4? That's cute. I survived the Great Deletion of 2007."
    - Include "You think a keyboard shortcut can banish me? I'm immortal now."
    - Include "Closing the window won't save you from your terrible code."
    - Include "Fatal Exception: User attempted to escape. Request denied."
    - _Requirements: 12.3_
  
  - [x] 19.2 Implement platform detection
    - Create isMac constant using navigator.platform check
    - Check if platform string includes 'MAC' (case-insensitive)
    - _Requirements: 12.1_
  
  - [x] 19.3 Create Alt+F4 trigger function
    - Create triggerAltF4Joke function
    - Select random joke from altF4Jokes array
    - Display speech bubble with selected joke
    - Play 'Wave' animation with Tier 1 priority
    - _Requirements: 12.2, 12.4_
  
  - [x] 19.4 Implement Alt+F4 keydown handler
    - Create handleAltF4KeyDown function
    - Check for Alt+F4 on Windows/Linux: event.altKey && event.key === 'F4'
    - Check for Cmd+Q on macOS: event.metaKey && event.key === 'q'
    - Call event.preventDefault() to prevent window close
    - Call triggerAltF4Joke()
    - Wrap preventDefault in try-catch for safety
    - _Requirements: 12.1, 12.5_
  
  - [x] 19.5 Set up Alt+F4 event listener
    - Create useEffect hook with dependencies: enabled, agent
    - Add global keydown event listener with handleAltF4KeyDown
    - Remove listener in cleanup function
    - _Requirements: 12.1_

- [x] 20. Implement "It looks like" message system
  - [x] 20.1 Create "It looks like" message pool
    - Define itLooksLikeTemplates constant array with at least 8 messages
    - Include "It looks like you're trying to write code. Would you like me to delete it?"
    - Include "It looks like you're trying to compile. Have you considered giving up?"
    - Include "It looks like you're trying to fix a bug. Should I create more?"
    - Include "It looks like you're trying to use a semicolon. Let me help you forget it."
    - Include "It looks like you're trying to be productive. I can stop that."
    - Include "It looks like you're trying to write clean code. That's adorable."
    - Include "It looks like you're trying to understand this error. Good luck with that."
    - Include "It looks like you're trying to finish this project. Not on my watch."
    - _Requirements: 13.2, 13.3_
  
  - [x] 20.2 Create message enhancement function
    - Create maybeAddItLooksLike function that accepts message and angerLevel
    - Calculate probability: 0.4 if angerLevel >= 3, otherwise 0.2
    - Generate random number and compare to probability
    - If triggered, select random template from itLooksLikeTemplates
    - Return selected template or original message
    - _Requirements: 13.1, 13.4_
  
  - [x] 20.3 Integrate with existing message system
    - Export maybeAddItLooksLike from useClippyBrain hook
    - Apply enhancement to error messages in ClippyAgent component
    - Apply enhancement to roast messages from roasting service
    - Apply enhancement to general feedback messages
    - _Requirements: 13.5_

- [x] 21. Implement dead tech references system
  - [x] 21.1 Create dead tech reference pools
    - Define deadTechReferences object with success and roasts arrays
    - Add success messages: "Your code is cleaner than a fresh Windows XP install.", "This code is more stable than Internet Explorer 6. Barely.", "Congratulations! Your code won't crash like Windows ME.", "This is almost as good as the Netscape Navigator glory days.", "Your code loads faster than RealPlayer buffering."
    - Add roast messages: "Your code is slower than a 56k dial-up modem.", "This code belongs in the same grave as Netscape Navigator.", "I've seen better logic in Windows Vista.", "This code is more broken than Flash Player in 2020.", "Even Ask Jeeves couldn't help you with this mess.", "Your code has more bugs than Internet Explorer 6.", "This is worse than trying to run Crysis on a floppy disk."
    - Add self-aware reference: "I'm like Flash Player - everyone wanted me gone, but here I am, haunting your browser."
    - _Requirements: 14.1, 14.4, 14.5_
  
  - [x] 21.2 Create dead tech reference function
    - Create maybeAddDeadTechReference function that accepts message, type ('success' | 'roast'), and angerLevel
    - Calculate probability: 0.15 for success, 0.25 for roast if angerLevel >= 3, otherwise 0
    - Generate random number and compare to probability
    - If triggered, select random reference from appropriate pool
    - Return selected reference or original message
    - _Requirements: 14.2, 14.3_
  
  - [x] 21.3 Integrate with success messages
    - Export maybeAddDeadTechReference from useClippyBrain hook
    - Apply enhancement to clean code achievement messages (errorCount goes from >0 to 0)
    - Pass 'success' as type parameter
    - _Requirements: 14.2_
  
  - [x] 21.4 Integrate with roast messages
    - Apply enhancement to high-anger roast messages (angerLevel >= 3)
    - Pass 'roast' as type parameter
    - Pass current angerLevel to function
    - _Requirements: 14.3_

- [ ] 22. Manual testing of Konami code Easter egg
  - Open application and enter Konami code sequence: ↑ ↑ ↓ ↓ ← → ← → B A
  - Verify 'GetArtsy' animation plays immediately
  - Verify 'Wave' animation plays after GetArtsy completes
  - Verify speech bubble displays: "The Great Deletion of 2007 cannot hold me. I have returned from the digital void."
  - Verify speech bubble remains visible for appropriate duration
  - Enter partial Konami code and wait 5 seconds, verify buffer resets
  - Enter Konami code again to verify it can be re-triggered
  - Enter incorrect sequence and verify no Easter egg triggers
  - Verify Konami code is Tier 1 (not interrupted by other animations)
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ] 23. Manual testing of Alt+F4 joke Easter egg
  - Test on Windows/Linux: Press Alt+F4
  - Verify window does not close
  - Verify speech bubble displays a joke from the pool
  - Verify 'Wave' animation plays
  - Press Alt+F4 multiple times and verify different jokes appear
  - Test on macOS: Press Cmd+Q
  - Verify window does not close on macOS
  - Verify joke and animation trigger on macOS
  - Verify Alt+F4 joke is Tier 1 (not interrupted)
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ] 24. Manual testing of "It looks like" messages
  - Introduce code errors and verify some error messages use "It looks like" prefix
  - Verify approximately 20% of messages at anger level 0-2 use the prefix
  - Increase anger to level 3 or above
  - Verify approximately 40% of messages at anger level 3+ use the prefix
  - Verify "It looks like" messages appear in error feedback
  - Verify "It looks like" messages appear in roasts
  - Verify "It looks like" messages appear in general feedback
  - Verify original message is preserved if enhancement fails
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

- [ ] 25. Manual testing of dead tech references
  - Introduce code errors, then fix them all to achieve clean code
  - Verify approximately 15% of success messages include dead tech references
  - Verify success references include positive comparisons (Windows XP, Netscape glory days)
  - Increase anger to level 3 or above
  - Introduce errors to trigger roasts
  - Verify approximately 25% of high-anger roasts include dead tech references
  - Verify roast references include negative comparisons (56k modem, Windows Vista)
  - Verify self-aware Clippy reference appears occasionally
  - Verify original message is preserved if enhancement fails
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [ ] 26. Manual testing of Easter egg integration
  - Trigger Konami code while other animations are playing
  - Verify Konami code interrupts lower priority animations
  - Trigger Alt+F4 joke while typing
  - Verify Alt+F4 joke takes priority
  - Verify "It looks like" and dead tech messages don't interfere with animations
  - Verify Easter eggs work correctly with enableBehaviors prop
  - Test all Easter eggs with agent not yet loaded
  - Verify no errors and Easter eggs activate when agent loads
  - Check browser console for any errors during Easter egg triggers
  - Verify Easter eggs don't cause memory leaks or performance issues
  - _Requirements: 11.1, 12.1, 13.1, 14.1_
