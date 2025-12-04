/**
 * Memory Migration Utility
 * 
 * Migrates localStorage data to database on first run.
 * "The Great Migration of 2024 - Never Again"
 */

import { UserMemory, isUserMemory } from '../types/memory';
import { MemoryManager } from './memoryManager';

const MIGRATION_MARKER = 'clippy_memory_migrated';
const MIGRATION_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface MigrationResult {
  success: boolean;
  recordsMigrated: {
    mistakes: number;
    patterns: number;
    interactions: number;
    angerEvents: number;
  };
  error?: string;
}

/**
 * Check if migration has already been completed
 */
export function isMigrationComplete(): boolean {
  try {
    if (typeof localStorage === 'undefined') {
      return false;
    }
    return localStorage.getItem(MIGRATION_MARKER) === 'true';
  } catch {
    return false;
  }
}

/**
 * Check if localStorage has data to migrate
 */
export function hasLocalStorageData(): boolean {
  try {
    if (typeof localStorage === 'undefined') {
      return false;
    }
    const stored = localStorage.getItem(MemoryManager['STORAGE_KEY'] || 'clippy_memory');
    if (!stored) {
      return false;
    }
    const parsed = JSON.parse(stored);
    return isUserMemory(parsed) && parsed.mistakes.length + parsed.patterns.length + 
           parsed.interactions.length + parsed.angerHistory.length > 0;
  } catch {
    return false;
  }
}

/**
 * Load and parse localStorage data
 */
function loadLocalStorageData(): UserMemory | null {
  try {
    if (typeof localStorage === 'undefined') {
      return null;
    }
    const stored = localStorage.getItem(MemoryManager['STORAGE_KEY'] || 'clippy_memory');
    if (!stored) {
      return null;
    }
    const parsed = JSON.parse(stored);
    if (!isUserMemory(parsed)) {
      console.warn('Invalid localStorage data structure');
      return null;
    }
    return parsed;
  } catch (error) {
    console.error('Failed to load localStorage data:', error);
    return null;
  }
}

/**
 * Migrate localStorage data to database via API
 */
export async function migrateToDatabase(): Promise<MigrationResult> {
  // Check if already migrated
  if (isMigrationComplete()) {
    console.log('Migration already completed');
    return {
      success: true,
      recordsMigrated: { mistakes: 0, patterns: 0, interactions: 0, angerEvents: 0 }
    };
  }

  // Check if there's data to migrate
  if (!hasLocalStorageData()) {
    console.log('No localStorage data to migrate');
    // Mark as migrated anyway to skip future checks
    try {
      localStorage.setItem(MIGRATION_MARKER, 'true');
    } catch {
      // Ignore localStorage errors
    }
    return {
      success: true,
      recordsMigrated: { mistakes: 0, patterns: 0, interactions: 0, angerEvents: 0 }
    };
  }

  // Load localStorage data
  const memory = loadLocalStorageData();
  if (!memory) {
    return {
      success: false,
      recordsMigrated: { mistakes: 0, patterns: 0, interactions: 0, angerEvents: 0 },
      error: 'Failed to load localStorage data'
    };
  }

  try {
    // Send migration request to API
    const response = await fetch(`${MIGRATION_API_URL}/api/memory/migrate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: memory.userId,
        mistakes: memory.mistakes,
        patterns: memory.patterns,
        interactions: memory.interactions,
        angerHistory: memory.angerHistory,
        angerStats: memory.angerStats,
        createdAt: memory.createdAt,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `Migration failed: ${response.statusText}`);
    }

    const result: MigrationResult = await response.json();

    // Mark migration as complete on success
    if (result.success) {
      try {
        localStorage.setItem(MIGRATION_MARKER, 'true');
        console.log('Migration completed successfully:', result.recordsMigrated);
      } catch {
        // Ignore localStorage errors, migration still succeeded
      }
    }

    return result;
  } catch (error) {
    console.error('Migration failed:', error);
    return {
      success: false,
      recordsMigrated: { mistakes: 0, patterns: 0, interactions: 0, angerEvents: 0 },
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

