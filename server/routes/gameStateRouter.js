/**
 * Game State API Routes
 * 
 * REST API endpoints for Clippy's game state system
 * Reads from .kiro/.hook-state.json and .kiro/.punishment.json
 */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const GAME_STATE_PATH = path.join(__dirname, '../../.kiro/.hook-state.json');
const PUNISHMENT_PATH = path.join(__dirname, '../../.kiro/.punishment.json');

/**
 * Read game state from file
 */
function readGameState() {
  try {
    if (fs.existsSync(GAME_STATE_PATH)) {
      const data = fs.readFileSync(GAME_STATE_PATH, 'utf-8');
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
 * Read punishment file if it exists
 */
function readPunishment() {
  try {
    if (fs.existsSync(PUNISHMENT_PATH)) {
      const data = fs.readFileSync(PUNISHMENT_PATH, 'utf-8');
      const punishment = JSON.parse(data);
      // Delete the file after reading (one-time trigger)
      fs.unlinkSync(PUNISHMENT_PATH);
      return punishment;
    }
  } catch (error) {
    console.error('Error reading punishment file:', error.message);
  }
  
  return null;
}

/**
 * GET /api/game-state
 * Get current game state
 */
router.get('/', (req, res) => {
  try {
    const state = readGameState();
    res.json(state);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/game-state/punishment
 * Check for pending punishment
 */
router.get('/punishment', (req, res) => {
  try {
    const punishment = readPunishment();
    if (punishment) {
      res.json(punishment);
    } else {
      res.json(null);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/game-state/reset
 * Reset game state (optional - can be called from frontend)
 */
router.post('/reset', (req, res) => {
  try {
    const state = {
      angerLevel: 0,
      errorCount: 0,
      lastEvent: { type: 'reset', timestamp: Date.now() },
      timestamp: Date.now(),
    };
    
    // Ensure directory exists
    const dir = path.dirname(GAME_STATE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(GAME_STATE_PATH, JSON.stringify(state, null, 2));
    res.json({ success: true, state });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

