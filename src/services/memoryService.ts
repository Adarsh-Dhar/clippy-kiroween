/**
 * MemoryService - High-level API for Clippy's memory system
 * 
 * "I am always watching. I remember everything."
 * - Clippy, probably
 */

import {
  UserMemory,
  MistakeRecord,
  CodePattern,
  InteractionRecord,
  AngerEvent,
  AngerStats
} from '../types/memory';
import { MemoryManager } from '../utils/memoryManager';

export class MemoryService {
  private memory: UserMemory;
  private syncTimer: ReturnType<typeof setTimeout> | null = null;
  private isDirty: boolean = false;
  private memoryOnlyMode: boolean = false;
  private lastAngerLevel: number = 0;
  private lastAngerTimestamp: number = Date.now();

  constructor() {
    // Load from storage or create new
    const loaded = MemoryManager.load();
    this.memory = loaded || MemoryManager.createEmpty();

    // If we couldn't load and storage is unavailable, enter memory-only mode
    if (!loaded && !MemoryManager.isStorageAvailable()) {
      console.warn('Memory system running in memory-only mode (no persistence)');
      this.memoryOnlyMode = true;
    }

    // Clean up old data on initialization
    this.cleanupOldData();

    // Set up auto-sync
    this.startAutoSync();
    
    // Set up periodic cleanup (every hour)
    setInterval(() => {
      this.cleanupOldData();
    }, 60 * 60 * 1000);
  }

  // === Private Utility Methods ===

  /**
   * Mark memory as dirty and schedule sync
   */
  private markDirty(): void {
    this.isDirty = true;
  }

  /**
   * Start auto-sync timer (500ms debounce)
   */
  private startAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    this.syncTimer = setInterval(() => {
      if (this.isDirty && !this.memoryOnlyMode) {
        this.flush();
      }
    }, 500);
  }

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clean up old data to prevent unbounded growth
   */
  private cleanupOldData(): void {
    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);

    // Remove mistake records older than 30 days
    const oldMistakeCount = this.memory.mistakes.length;
    this.memory.mistakes = this.memory.mistakes.filter(
      m => m.timestamp > thirtyDaysAgo
    );
    
    if (this.memory.mistakes.length < oldMistakeCount) {
      console.log(`Archived ${oldMistakeCount - this.memory.mistakes.length} old mistake records`);
      this.markDirty();
    }

    // Remove anger events older than 30 days
    const oldAngerCount = this.memory.angerHistory.length;
    this.memory.angerHistory = this.memory.angerHistory.filter(
      e => e.timestamp > thirtyDaysAgo
    );
    
    if (this.memory.angerHistory.length < oldAngerCount) {
      console.log(`Archived ${oldAngerCount - this.memory.angerHistory.length} old anger events`);
      this.markDirty();
    }

    // Remove patterns not seen in 30 days
    const oldPatternCount = this.memory.patterns.length;
    this.memory.patterns = this.memory.patterns.filter(
      p => p.lastSeen > thirtyDaysAgo
    );
    
    if (this.memory.patterns.length < oldPatternCount) {
      console.log(`Archived ${oldPatternCount - this.memory.patterns.length} old patterns`);
      this.markDirty();
    }

    // Enforce FIFO limits if still over capacity
    if (this.memory.mistakes.length > 100) {
      this.memory.mistakes.sort((a, b) => b.timestamp - a.timestamp);
      this.memory.mistakes = this.memory.mistakes.slice(0, 100);
      this.markDirty();
    }

    if (this.memory.interactions.length > 50) {
      this.memory.interactions.sort((a, b) => b.timestamp - a.timestamp);
      this.memory.interactions = this.memory.interactions.slice(0, 50);
      this.markDirty();
    }

    if (this.memory.patterns.length > 20) {
      this.memory.patterns.sort((a, b) => b.frequency - a.frequency);
      this.memory.patterns = this.memory.patterns.slice(0, 20);
      this.markDirty();
    }

    if (this.memory.angerHistory.length > 200) {
      this.memory.angerHistory.sort((a, b) => b.timestamp - a.timestamp);
      this.memory.angerHistory = this.memory.angerHistory.slice(0, 200);
      this.markDirty();
    }
  }

  // === Mistake Management ===

  /**
   * Record a new mistake or increment count if it exists
   */
  recordMistake(errorType: string, message: string, file: string, line: number): void {
    // Check if this exact mistake already exists
    const existing = this.memory.mistakes.find(
      m => m.errorType === errorType && m.location.file === file && m.location.line === line
    );

    if (existing) {
      // Increment count
      existing.count++;
      existing.timestamp = Date.now(); // Update timestamp
    } else {
      // Create new mistake record
      const mistake: MistakeRecord = {
        id: this.generateId(),
        errorType,
        message,
        location: { file, line },
        timestamp: Date.now(),
        count: 1
      };

      this.memory.mistakes.push(mistake);
    }

    // Cleanup: maintain max 100 records (FIFO)
    if (this.memory.mistakes.length > 100) {
      this.memory.mistakes.sort((a, b) => a.timestamp - b.timestamp);
      this.memory.mistakes = this.memory.mistakes.slice(-100);
    }

    this.markDirty();
  }

  /**
   * Get all common mistakes (occurred 3+ times)
   */
  getCommonMistakes(): MistakeRecord[] {
    return this.memory.mistakes.filter(m => m.count >= 3);
  }

  /**
   * Get mistake count for a specific error type
   */
  getMistakeCount(errorType: string): number {
    return this.memory.mistakes
      .filter(m => m.errorType === errorType)
      .reduce((sum, m) => sum + m.count, 0);
  }

  /**
   * Get all mistakes, optionally filtered by error type
   */
  getMistakes(errorType?: string): MistakeRecord[] {
    if (errorType) {
      return this.memory.mistakes.filter(m => m.errorType === errorType);
    }
    return [...this.memory.mistakes];
  }

  // === Pattern Management ===

  /**
   * Analyze code and update pattern statistics
   */
  analyzeCodePatterns(code: string, _filename?: string): void {
    const patterns: Partial<CodePattern>[] = [];

    // Detect naming conventions
    const functionNames = code.match(/function\s+(\w+)/g) || [];
    const variableNames = code.match(/(?:const|let|var)\s+(\w+)/g) || [];
    
    let camelCaseCount = 0;
    let snakeCaseCount = 0;
    let pascalCaseCount = 0;
    let totalNames = 0;

    [...functionNames, ...variableNames].forEach(match => {
      const name = match.split(/\s+/).pop() || '';
      totalNames++;
      
      if (/^[a-z][a-zA-Z0-9]*$/.test(name)) camelCaseCount++;
      else if (/^[a-z][a-z0-9_]*$/.test(name)) snakeCaseCount++;
      else if (/^[A-Z][a-zA-Z0-9]*$/.test(name)) pascalCaseCount++;
    });

    if (totalNames > 0) {
      if (camelCaseCount / totalNames > 0.5) {
        patterns.push({
          name: 'camelCase-naming',
          description: 'Uses camelCase for identifiers',
          frequency: Math.round((camelCaseCount / totalNames) * 100),
          examples: functionNames.slice(0, 3)
        });
      }
      if (snakeCaseCount / totalNames > 0.5) {
        patterns.push({
          name: 'snake_case-naming',
          description: 'Uses snake_case for identifiers',
          frequency: Math.round((snakeCaseCount / totalNames) * 100),
          examples: variableNames.slice(0, 3)
        });
      }
    }

    // Detect semicolon usage
    const lines = code.split('\n').filter(l => l.trim().length > 0);
    const linesWithSemicolon = lines.filter(l => l.trim().endsWith(';')).length;
    
    if (lines.length > 0) {
      const semicolonFreq = (linesWithSemicolon / lines.length) * 100;
      if (semicolonFreq > 80) {
        patterns.push({
          name: 'always-semicolons',
          description: 'Consistently uses semicolons',
          frequency: Math.round(semicolonFreq),
          examples: [lines.find(l => l.trim().endsWith(';')) || ''].filter(Boolean)
        });
      } else if (semicolonFreq < 20) {
        patterns.push({
          name: 'no-semicolons',
          description: 'Avoids semicolons',
          frequency: Math.round(100 - semicolonFreq),
          examples: [lines.find(l => !l.trim().endsWith(';')) || ''].filter(Boolean)
        });
      }
    }

    // Detect indentation style
    const indentedLines = lines.filter(l => /^\s+/.test(l));
    const spacesCount = indentedLines.filter(l => /^ +/.test(l)).length;
    const tabsCount = indentedLines.filter(l => /^\t+/.test(l)).length;
    
    if (indentedLines.length > 0) {
      if (spacesCount > tabsCount) {
        patterns.push({
          name: 'spaces-indentation',
          description: 'Uses spaces for indentation',
          frequency: Math.round((spacesCount / indentedLines.length) * 100),
          examples: []
        });
      } else if (tabsCount > spacesCount) {
        patterns.push({
          name: 'tabs-indentation',
          description: 'Uses tabs for indentation',
          frequency: Math.round((tabsCount / indentedLines.length) * 100),
          examples: []
        });
      }
    }

    // Detect quote style
    const singleQuotes = (code.match(/'/g) || []).length;
    const doubleQuotes = (code.match(/"/g) || []).length;
    const backticks = (code.match(/`/g) || []).length;
    const totalQuotes = singleQuotes + doubleQuotes + backticks;

    if (totalQuotes > 0) {
      const maxQuoteType = Math.max(singleQuotes, doubleQuotes, backticks);
      if (maxQuoteType === singleQuotes && singleQuotes / totalQuotes > 0.5) {
        patterns.push({
          name: 'single-quotes',
          description: 'Prefers single quotes',
          frequency: Math.round((singleQuotes / totalQuotes) * 100),
          examples: []
        });
      } else if (maxQuoteType === doubleQuotes && doubleQuotes / totalQuotes > 0.5) {
        patterns.push({
          name: 'double-quotes',
          description: 'Prefers double quotes',
          frequency: Math.round((doubleQuotes / totalQuotes) * 100),
          examples: []
        });
      }
    }

    // Update or create patterns
    const now = Date.now();
    patterns.forEach(p => {
      const existing = this.memory.patterns.find(mp => mp.name === p.name);
      
      if (existing) {
        // Update existing pattern
        existing.frequency = Math.round((existing.frequency + (p.frequency || 0)) / 2);
        existing.lastSeen = now;
        if (p.examples && p.examples.length > 0) {
          existing.examples = [...new Set([...existing.examples, ...p.examples])].slice(0, 5);
        }
      } else {
        // Create new pattern
        const newPattern: CodePattern = {
          id: this.generateId(),
          name: p.name || 'unknown',
          description: p.description || '',
          frequency: p.frequency || 0,
          lastSeen: now,
          examples: p.examples || []
        };
        this.memory.patterns.push(newPattern);
      }
    });

    // Cleanup: maintain max 20 patterns
    if (this.memory.patterns.length > 20) {
      this.memory.patterns.sort((a, b) => b.frequency - a.frequency);
      this.memory.patterns = this.memory.patterns.slice(0, 20);
    }

    this.markDirty();
  }

  /**
   * Get favorite patterns (frequency > 50%)
   */
  getFavoritePatterns(): CodePattern[] {
    return this.memory.patterns.filter(p => p.frequency > 50);
  }

  /**
   * Get all patterns
   */
  getPatterns(): CodePattern[] {
    return [...this.memory.patterns];
  }

  // === Interaction Management ===

  /**
   * Record a new interaction
   */
  recordInteraction(
    type: InteractionRecord['type'],
    message: string,
    context?: InteractionRecord['context']
  ): void {
    const interaction: InteractionRecord = {
      id: this.generateId(),
      type,
      message,
      timestamp: Date.now(),
      context
    };

    this.memory.interactions.push(interaction);

    // Cleanup: maintain rolling window of 50 interactions
    if (this.memory.interactions.length > 50) {
      this.memory.interactions.sort((a, b) => a.timestamp - b.timestamp);
      this.memory.interactions = this.memory.interactions.slice(-50);
    }

    this.markDirty();
  }

  /**
   * Get recent interactions
   */
  getRecentInteractions(limit: number = 10): InteractionRecord[] {
    return [...this.memory.interactions]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Get interactions by type
   */
  getInteractionsByType(type: InteractionRecord['type']): InteractionRecord[] {
    return this.memory.interactions.filter(i => i.type === type);
  }

  // === Anger Management ===

  /**
   * Record an anger level change
   */
  recordAngerChange(level: number, trigger?: string): void {
    const now = Date.now();
    
    // Track time spent at previous level
    if (this.lastAngerLevel !== level) {
      const timeSpent = now - this.lastAngerTimestamp;
      this.memory.angerStats.timeAtLevel[this.lastAngerLevel] = 
        (this.memory.angerStats.timeAtLevel[this.lastAngerLevel] || 0) + timeSpent;
    }

    // Record event
    const event: AngerEvent = {
      level,
      timestamp: now,
      trigger
    };

    this.memory.angerHistory.push(event);

    // Update stats
    this.memory.angerStats.levelCounts[level] = 
      (this.memory.angerStats.levelCounts[level] || 0) + 1;

    if (level > this.memory.angerStats.highestLevel) {
      this.memory.angerStats.highestLevel = level;
    }

    // Check for BSOD (death)
    if (level >= 5) {
      this.memory.angerStats.totalDeaths++;
    }

    // Recalculate average
    const totalEvents = Object.values(this.memory.angerStats.levelCounts).reduce((a, b) => a + b, 0);
    const weightedSum = Object.entries(this.memory.angerStats.levelCounts)
      .reduce((sum, [level, count]) => sum + (parseInt(level) * count), 0);
    this.memory.angerStats.averageLevel = totalEvents > 0 ? weightedSum / totalEvents : 0;

    // Update tracking
    this.lastAngerLevel = level;
    this.lastAngerTimestamp = now;

    // Cleanup: maintain max 200 anger events
    if (this.memory.angerHistory.length > 200) {
      this.memory.angerHistory.sort((a, b) => a.timestamp - b.timestamp);
      this.memory.angerHistory = this.memory.angerHistory.slice(-200);
    }

    this.markDirty();
  }

  /**
   * Get anger statistics
   */
  getAngerStats(): AngerStats {
    return { ...this.memory.angerStats };
  }

  /**
   * Get anger history
   */
  getAngerHistory(limit?: number): AngerEvent[] {
    const sorted = [...this.memory.angerHistory].sort((a, b) => b.timestamp - a.timestamp);
    return limit ? sorted.slice(0, limit) : sorted;
  }

  // === Utility Methods ===

  /**
   * Force save to localStorage
   */
  flush(): void {
    if (this.memoryOnlyMode) {
      return;
    }

    const success = MemoryManager.save(this.memory);
    if (success) {
      this.isDirty = false;
    } else {
      console.warn('Failed to flush memory to storage');
    }
  }

  /**
   * Get memory summary for debugging
   */
  getSummary() {
    return {
      totalMistakes: this.memory.mistakes.length,
      commonMistakes: this.getCommonMistakes().length,
      totalPatterns: this.memory.patterns.length,
      totalInteractions: this.memory.interactions.length,
      totalDeaths: this.memory.angerStats.totalDeaths
    };
  }

  /**
   * Clear all memory (nuclear option)
   */
  reset(): void {
    this.memory = MemoryManager.createEmpty();
    MemoryManager.clear();
    this.isDirty = false;
  }

  /**
   * Cleanup on destroy
   */
  destroy(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
    this.flush();
  }
}

// Singleton instance
export const memoryService = new MemoryService();
