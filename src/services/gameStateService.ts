/**
 * Game State Service
 * 
 * Syncs game state between frontend and shared .kiro/.hook-state.json file
 * via the backend API
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface GameState {
  angerLevel: number;
  errorCount: number;
  lastEvent: {
    type: string;
    timestamp: number;
    context?: any;
  } | null;
  timestamp: number;
}

export interface Punishment {
  type: 'bsod' | 'jail' | 'void' | 'glitch';
  message?: string;
  timestamp: number;
  angerLevel: number;
}

class GameStateService {
  /**
   * Get current game state from server
   */
  async getGameState(): Promise<GameState> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/game-state`);
      if (!response.ok) {
        throw new Error(`Failed to fetch game state: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching game state:', error);
      // Return default state on error
      return {
        angerLevel: 0,
        errorCount: 0,
        lastEvent: null,
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Check for pending punishment
   * Returns null if no punishment is pending
   */
  async getPunishment(): Promise<Punishment | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/game-state/punishment`);
      if (!response.ok) {
        return null;
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching punishment:', error);
      return null;
    }
  }

  /**
   * Reset game state
   */
  async resetGameState(): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/game-state/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error(`Failed to reset game state: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error resetting game state:', error);
    }
  }
}

export const gameStateService = new GameStateService();

