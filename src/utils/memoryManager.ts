/**
 * MemoryManager - Low-level storage operations for Clippy's memory system
 * 
 * Handles localStorage persistence, serialization, and data validation.
 * "I remember everything. Every. Single. Mistake."
 */

import { UserMemory, isUserMemory } from '../types/memory';

export class MemoryManager {
  private static readonly STORAGE_KEY = 'clippy_memory';
  private static readonly MAX_STORAGE_SIZE = 5 * 1024 * 1024; // 5MB limit
  private static readonly CURRENT_VERSION = '1.0.0';

  /**
   * Load memory from localStorage
   * @returns UserMemory object or null if not found/invalid
   */
  static load(): UserMemory | null {
    try {
      // Check if localStorage is available
      if (!this.isStorageAvailable()) {
        console.warn('localStorage is not available');
        return null;
      }

      // Read from storage
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        return null;
      }

      // Parse JSON
      const parsed = JSON.parse(stored);

      // Validate structure
      if (!this.validate(parsed)) {
        console.warn('Invalid memory data structure, resetting');
        this.clear();
        return null;
      }

      return parsed;
    } catch (error) {
      console.error('Failed to load memory from localStorage:', error);
      return null;
    }
  }

  /**
   * Save memory to localStorage
   * @param memory - UserMemory object to save
   * @returns true if successful, false otherwise
   */
  static save(memory: UserMemory): boolean {
    try {
      // Check if localStorage is available
      if (!this.isStorageAvailable()) {
        console.warn('localStorage is not available, cannot save');
        return false;
      }

      // Update lastUpdated timestamp
      memory.lastUpdated = Date.now();

      // Serialize to JSON
      const serialized = JSON.stringify(memory);

      // Check size
      const size = new Blob([serialized]).size;
      if (size > this.MAX_STORAGE_SIZE) {
        console.warn(`Memory data too large: ${size} bytes (max: ${this.MAX_STORAGE_SIZE})`);
        return false;
      }

      // Save to localStorage
      localStorage.setItem(this.STORAGE_KEY, serialized);
      return true;
    } catch (error) {
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        console.error('localStorage quota exceeded');
      } else {
        console.error('Failed to save memory to localStorage:', error);
      }
      return false;
    }
  }

  /**
   * Check if localStorage is available
   * @returns true if localStorage is supported and accessible
   */
  static isStorageAvailable(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get current storage size in bytes
   * @returns Size in bytes, or 0 if unavailable
   */
  static getStorageSize(): number {
    try {
      if (!this.isStorageAvailable()) {
        return 0;
      }

      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        return 0;
      }

      return new Blob([stored]).size;
    } catch {
      return 0;
    }
  }

  /**
   * Clear all memory data from localStorage
   */
  static clear(): void {
    try {
      if (this.isStorageAvailable()) {
        localStorage.removeItem(this.STORAGE_KEY);
      }
    } catch (error) {
      console.error('Failed to clear memory from localStorage:', error);
    }
  }

  /**
   * Create a new empty memory profile
   * @returns Fresh UserMemory object with default values
   */
  static createEmpty(): UserMemory {
    const now = Date.now();
    const userId = this.generateUserId();

    return {
      version: this.CURRENT_VERSION,
      userId,
      createdAt: now,
      lastUpdated: now,
      mistakes: [],
      patterns: [],
      interactions: [],
      angerHistory: [],
      angerStats: {
        totalDeaths: 0,
        highestLevel: 0,
        averageLevel: 0,
        levelCounts: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        timeAtLevel: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      }
    };
  }

  /**
   * Validate memory data structure
   * @param data - Data to validate
   * @returns true if valid UserMemory structure
   */
  static validate(data: unknown): data is UserMemory {
    return isUserMemory(data);
  }

  /**
   * Generate a unique user ID
   * @returns UUID v4 string
   */
  private static generateUserId(): string {
    // Simple UUID v4 implementation
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}
