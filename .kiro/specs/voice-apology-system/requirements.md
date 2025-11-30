# Requirements Document

## Introduction

The Voice Apology System is a game mechanic that requires user interaction through voice or text input to prevent game failure. When the AI character (Clippy) reaches a critical anger threshold, the system presents a modal interface demanding an apology from the user. The user must either speak an apology using their device's microphone or, if speech recognition is unavailable, type a specific apology phrase multiple times to reset the game state and continue playing.

## Glossary

- **Apology Modal**: A modal dialog component that captures user apology input through voice or text
- **Game Context**: The React context managing the game state including anger level and reset functionality
- **Speech Recognition API**: The browser's Web Speech API for capturing and transcribing voice input
- **Anger Level**: A numeric value (0-5) representing Clippy's frustration state
- **Game Reset**: The action of returning the game state to its initial values
- **Transcript**: The text output from the Speech Recognition API representing spoken words
- **Fallback Input**: A text input field used when Speech Recognition API is unavailable

## Requirements

### Requirement 1

**User Story:** As a player, I want to be prompted to apologize when Clippy becomes critically angry, so that I have a chance to reset the game before it crashes.

#### Acceptance Criteria

1. WHEN the Anger Level reaches 4, THE Apology Modal SHALL display on screen
2. THE Apology Modal SHALL render a dark overlay covering the entire viewport
3. THE Apology Modal SHALL display the text "SAY IT. SAY YOU ARE SORRY."
4. THE Apology Modal SHALL prevent interaction with underlying game components while visible

### Requirement 2

**User Story:** As a player with a working microphone, I want to speak my apology, so that I can quickly reset the game without typing.

#### Acceptance Criteria

1. WHEN the Apology Modal displays, THE Apology Modal SHALL initialize the Speech Recognition API
2. WHEN the Speech Recognition API is available, THE Apology Modal SHALL display a pulsating microphone icon
3. WHEN the Speech Recognition API is available, THE Apology Modal SHALL begin listening for voice input automatically
4. WHEN the Transcript contains the word "sorry", THE Apology Modal SHALL trigger the Game Reset
5. WHEN the Transcript contains the word "apologize", THE Apology Modal SHALL trigger the Game Reset

### Requirement 3

**User Story:** As a player, I want the game to escalate if I remain silent, so that there are consequences for ignoring Clippy's demand.

#### Acceptance Criteria

1. WHEN the Apology Modal begins listening, THE Apology Modal SHALL start a 5-second silence timer
2. WHEN the silence timer reaches 5 seconds without detecting speech, THE Apology Modal SHALL set the Anger Level to 5
3. WHEN the Anger Level is set to 5, THE Game Context SHALL trigger the game crash sequence

### Requirement 4

**User Story:** As a player without Speech Recognition support, I want an alternative way to apologize, so that I can still play the game on my device.

#### Acceptance Criteria

1. WHEN the Speech Recognition API is unavailable, THE Apology Modal SHALL display a text input field
2. WHEN the Speech Recognition API is unavailable, THE Apology Modal SHALL display instructions to type "I am sorry Clippy" 10 times
3. WHEN the user submits text in the Fallback Input, THE Apology Modal SHALL validate the text matches "I am sorry Clippy"
4. WHEN the user has submitted exactly 10 valid apologies, THE Apology Modal SHALL trigger the Game Reset
5. THE Apology Modal SHALL display a counter showing how many valid apologies have been submitted

### Requirement 5

**User Story:** As a player, I want the apology modal to close after I successfully apologize, so that I can continue playing the game.

#### Acceptance Criteria

1. WHEN the Game Reset is triggered, THE Apology Modal SHALL close and remove itself from the screen
2. WHEN the Game Reset is triggered, THE Game Context SHALL reset the Anger Level to 0
3. WHEN the Apology Modal closes, THE Game Context SHALL restore normal game interaction
