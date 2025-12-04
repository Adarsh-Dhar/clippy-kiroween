/**
 * Game State Synchronization
 * Allows hooks to communicate with the frontend game state
 */

const fs = require('fs');
const path = require('path');

const STATE_FILE = path.join(__dirname, '../../.hook-state.json');

/**
 * Read the current game state from file
 * @returns {Object} The game state
 */
function readGameState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const data = fs.readFileSync(STATE_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading game state:', error.message);
  }
  
  return {
    angerLevel: 0,
    errorCount: 0,
    lastEvent: null,
    timestamp: Date.now(),
  };
}

/**
 * Write game state to file
 * @param {Object} state - The state to write
 */
function writeGameState(state) {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  } catch (error) {
    console.error('Error writing game state:', error.message);
  }
}

/**
 * Increment anger level based on hook event
 * @param {string} eventType - The type of event (commit_fail, test_fail, etc.)
 * @param {Object} context - Additional context
 */
function incrementAnger(eventType, context = {}) {
  const state = readGameState();
  
  // Anger increment rules based on event type
  const angerMap = {
    commit_fail: 1,
    test_fail: 2,
    build_fail: 2,
    large_file: 1,
    todo_found: 1,
    complexity_high: 1,
    security_vuln: 3,
  };
  
  const increment = angerMap[eventType] || 1;
  state.angerLevel = Math.min(state.angerLevel + increment, 5);
  state.errorCount += 1;
  state.lastEvent = {
    type: eventType,
    context,
    timestamp: Date.now(),
  };
  
  writeGameState(state);
  
  return state;
}

/**
 * Decrease anger level (for successful actions)
 * @param {string} eventType - The type of success event
 */
function decreaseAnger(eventType) {
  const state = readGameState();
  
  state.angerLevel = Math.max(state.angerLevel - 1, 0);
  state.lastEvent = {
    type: eventType,
    timestamp: Date.now(),
  };
  
  writeGameState(state);
  
  return state;
}

/**
 * Reset game state
 */
function resetGameState() {
  const state = {
    angerLevel: 0,
    errorCount: 0,
    lastEvent: null,
    timestamp: Date.now(),
  };
  
  writeGameState(state);
  return state;
}

/**
 * Get Clippy's mood based on anger level
 * @param {number} angerLevel - Current anger level (0-5)
 * @returns {string} Mood description
 */
function getClippyMood(angerLevel) {
  const moods = {
    0: 'Calm (Idle animations, helpful sarcasm)',
    1: 'Annoyed (Tapping glass, "Really?" comments)',
    2: 'Angry (Eyes turn red, insults variable names)',
    3: 'Furious (Screaming text, "DELETE THIS")',
    4: 'Haunted (Demonic voice, glitch animations)',
    5: 'FATAL (BSOD Triggered, Game Over)',
  };
  
  return moods[angerLevel] || moods[0];
}

module.exports = {
  readGameState,
  writeGameState,
  incrementAnger,
  decreaseAnger,
  resetGameState,
  getClippyMood,
};
