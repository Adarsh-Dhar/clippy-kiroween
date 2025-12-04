/**
 * MemoryService - High-level API for Clippy's memory system
 * 
 * "I am always watching. I remember everything."
 * - Clippy, probably
 * 
 * Now backed by PostgreSQL via REST API
 */

import {
  MistakeRecord,
  CodePattern,
  InteractionRecord,
  AngerEvent,
  AngerStats
} from '../types/memory';
import { MemoryManager } from '../utils/memoryManager';
import { migrateToDatabase } from '../utils/memoryMigration';
import { apiClient } from './memoryApiService';
import { WriteBatcher } from '../utils/writeBatcher';
import { MemoryCache } from '../utils/memoryCache';

export class MemoryService {
  private userId: string;
  private writeBatcher: WriteBatcher;
  private cache: MemoryCache;
  private memoryOnlyMode: boolean = false;
  private lastAngerLevel: number = 0;
  private lastAngerTimestamp: number = Date.now();
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // Load or create userId
    const loaded = MemoryManager.load();
    this.userId = loaded?.userId || MemoryManager.createEmpty().userId;

    // Initialize cache and write batcher
    this.cache = new MemoryCache();
    this.writeBatcher = new WriteBatcher(500, 5000);

    // Run migration on startup
    this.initialize();
  }

  /**
   * Initialize service - run migration and load data
   */
  private async initialize(): Promise<void> {
    try {
      // Run migration if needed
      const migrationResult = await migrateToDatabase();
      if (migrationResult.success) {
        console.log('Migration completed:', migrationResult.recordsMigrated);
      } else {
        console.warn('Migration failed, continuing with database:', migrationResult.error);
      }

      // Load initial data into cache
      await this.loadDataIntoCache();

      // Set up periodic cleanup (every hour)
      this.cleanupInterval = setInterval(() => {
        this.cleanupOldData();
      }, 60 * 60 * 1000);

      // Run initial cleanup
      this.cleanupOldData();
    } catch (error) {
      console.error('Failed to initialize memory service:', error);
      this.memoryOnlyMode = true;
      console.warn('Memory system running in memory-only mode (no persistence)');
    }
  }

  /**
   * Load data into cache for fast access
   */
  private async loadDataIntoCache(): Promise<void> {
    try {
      const [mistakes, patterns, interactions, angerStats] = await Promise.all([
        apiClient.getMistakes(this.userId).catch(() => []),
        apiClient.getPatterns(this.userId).catch(() => []),
        apiClient.getRecentInteractions(this.userId, 50).catch(() => []),
        apiClient.getAngerStats(this.userId).catch(() => null),
      ]);

      this.cache.set('mistakes', mistakes, 5 * 60 * 1000);
      this.cache.set('patterns', patterns, 5 * 60 * 1000);
      this.cache.set('interactions', interactions, 5 * 60 * 1000);
      if (angerStats) {
        this.cache.set('angerStats', angerStats, 5 * 60 * 1000);
      }
    } catch (error) {
      console.error('Failed to load data into cache:', error);
    }
  }

  // === Mistake Management ===

  /**
   * Record a new mistake or increment count if it exists
   */
  recordMistake(errorType: string, message: string, file: string, line: number): void {
    if (this.memoryOnlyMode) {
      return;
    }

    // Invalidate cache
    this.cache.invalidate('mistakes');
    this.cache.invalidate('summary');

    // Batch the write
    this.writeBatcher.add({
      type: 'recordMistake',
      execute: async () => {
        await apiClient.recordMistake(this.userId, { errorType, message, file, line });
      },
    });
  }

  /**
   * Get all common mistakes (occurred 3+ times)
   */
  async getCommonMistakes(): Promise<MistakeRecord[]> {
    const cacheKey = 'commonMistakes';
    const cached = this.cache.get<MistakeRecord[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const mistakes = await apiClient.getCommonMistakes(this.userId);
      // Transform to match frontend types
      const transformed = mistakes.map((m: any) => ({
        id: m.id,
        errorType: m.errorType,
        message: m.message,
        location: { file: m.file, line: m.line },
        timestamp: new Date(m.timestamp).getTime(),
        count: m.count,
      }));
      this.cache.set(cacheKey, transformed, 5 * 60 * 1000);
      return transformed;
    } catch (error) {
      console.error('Failed to get common mistakes:', error);
      return [];
    }
  }

  /**
   * Get mistake count for a specific error type
   */
  async getMistakeCount(errorType: string): Promise<number> {
    const cacheKey = `mistakeCount:${errorType}`;
    const cached = this.cache.get<number>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    try {
      const count = await apiClient.getMistakeCount(this.userId, errorType);
      this.cache.set(cacheKey, count, 5 * 60 * 1000);
      return count;
    } catch (error) {
      console.error('Failed to get mistake count:', error);
      return 0;
    }
  }

  /**
   * Get all mistakes, optionally filtered by error type
   */
  async getMistakes(errorType?: string): Promise<MistakeRecord[]> {
    const cacheKey = errorType ? `mistakes:${errorType}` : 'mistakes';
    const cached = this.cache.get<MistakeRecord[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const mistakes = await apiClient.getMistakes(this.userId, errorType);
      // Transform to match frontend types
      const transformed = mistakes.map((m: any) => ({
        id: m.id,
        errorType: m.errorType,
        message: m.message,
        location: { file: m.file, line: m.line },
        timestamp: new Date(m.timestamp).getTime(),
        count: m.count,
      }));
      this.cache.set(cacheKey, transformed, 5 * 60 * 1000);
      return transformed;
    } catch (error) {
      console.error('Failed to get mistakes:', error);
      return [];
    }
  }

  // === Pattern Management ===

  /**
   * Analyze code and update pattern statistics
   */
  analyzeCodePatterns(code: string, _filename?: string): void {
    if (this.memoryOnlyMode) {
      return;
    }

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

    if (patterns.length === 0) {
      return;
    }

    // Invalidate cache
    this.cache.invalidate('patterns');
    this.cache.invalidate('favoritePatterns');

    // Batch the write
    this.writeBatcher.add({
      type: 'analyzePatterns',
      execute: async () => {
        await apiClient.analyzePatterns(this.userId, patterns as CodePattern[]);
      },
    });
  }

  /**
   * Get favorite patterns (frequency > 50%)
   */
  async getFavoritePatterns(): Promise<CodePattern[]> {
    const cacheKey = 'favoritePatterns';
    const cached = this.cache.get<CodePattern[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const patterns = await apiClient.getFavoritePatterns(this.userId);
      // Transform to match frontend types
      const transformed = patterns.map((p: any) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        frequency: p.frequency,
        lastSeen: new Date(p.lastSeen).getTime(),
        examples: p.examples || [],
      }));
      this.cache.set(cacheKey, transformed, 5 * 60 * 1000);
      return transformed;
    } catch (error) {
      console.error('Failed to get favorite patterns:', error);
      return [];
    }
  }

  /**
   * Get all patterns
   */
  async getPatterns(): Promise<CodePattern[]> {
    const cacheKey = 'patterns';
    const cached = this.cache.get<CodePattern[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const patterns = await apiClient.getPatterns(this.userId);
      // Transform to match frontend types
      const transformed = patterns.map((p: any) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        frequency: p.frequency,
        lastSeen: new Date(p.lastSeen).getTime(),
        examples: p.examples || [],
      }));
      this.cache.set(cacheKey, transformed, 5 * 60 * 1000);
      return transformed;
    } catch (error) {
      console.error('Failed to get patterns:', error);
      return [];
    }
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
    if (this.memoryOnlyMode) {
      return;
    }

    // Invalidate cache
    this.cache.invalidate('interactions');
    this.cache.invalidate('summary');

    // Batch the write
    this.writeBatcher.add({
      type: 'recordInteraction',
      execute: async () => {
        await apiClient.recordInteraction(this.userId, { type, message, context });
      },
    });
  }

  /**
   * Get recent interactions
   */
  async getRecentInteractions(limit: number = 10): Promise<InteractionRecord[]> {
    const cacheKey = `interactions:recent:${limit}`;
    const cached = this.cache.get<InteractionRecord[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const interactions = await apiClient.getRecentInteractions(this.userId, limit);
      // Transform to match frontend types
      const transformed = interactions.map((i: any) => ({
        id: i.id,
        type: i.type,
        message: i.message,
        timestamp: new Date(i.timestamp).getTime(),
        context: i.angerLevel !== null || i.errorCount !== null ? {
          angerLevel: i.angerLevel,
          errorCount: i.errorCount,
        } : undefined,
      }));
      this.cache.set(cacheKey, transformed, 5 * 60 * 1000);
      return transformed;
    } catch (error) {
      console.error('Failed to get recent interactions:', error);
      return [];
    }
  }

  /**
   * Get interactions by type
   */
  async getInteractionsByType(type: InteractionRecord['type']): Promise<InteractionRecord[]> {
    const cacheKey = `interactions:type:${type}`;
    const cached = this.cache.get<InteractionRecord[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const interactions = await apiClient.getInteractionsByType(this.userId, type);
      // Transform to match frontend types
      const transformed = interactions.map((i: any) => ({
        id: i.id,
        type: i.type,
        message: i.message,
        timestamp: new Date(i.timestamp).getTime(),
        context: i.angerLevel !== null || i.errorCount !== null ? {
          angerLevel: i.angerLevel,
          errorCount: i.errorCount,
        } : undefined,
      }));
      this.cache.set(cacheKey, transformed, 5 * 60 * 1000);
      return transformed;
    } catch (error) {
      console.error('Failed to get interactions by type:', error);
      return [];
    }
  }

  // === Anger Management ===

  /**
   * Record an anger level change
   */
  recordAngerChange(level: number, trigger?: string): void {
    if (this.memoryOnlyMode) {
      return;
    }

    const now = Date.now();
    
    // Track time spent at previous level
    if (this.lastAngerLevel !== level) {
      const timeSpent = now - this.lastAngerTimestamp;
      // This will be handled server-side, but we track locally for immediate access
    }

    // Invalidate cache
    this.cache.invalidate('angerStats');
    this.cache.invalidate('angerHistory');
    this.cache.invalidate('summary');

    // Batch the write
    this.writeBatcher.add({
      type: 'recordAngerChange',
      execute: async () => {
        await apiClient.recordAngerChange(this.userId, level, trigger);
      },
    });

    // Update tracking
    this.lastAngerLevel = level;
    this.lastAngerTimestamp = now;
  }

  /**
   * Get anger statistics
   */
  async getAngerStats(): Promise<AngerStats> {
    const cacheKey = 'angerStats';
    const cached = this.cache.get<AngerStats>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const stats = await apiClient.getAngerStats(this.userId);
      // Ensure proper types
      const transformed: AngerStats = {
        totalDeaths: stats.totalDeaths || 0,
        highestLevel: stats.highestLevel || 0,
        averageLevel: stats.averageLevel || 0,
        levelCounts: stats.levelCounts || { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        timeAtLevel: stats.timeAtLevel || { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };
      this.cache.set(cacheKey, transformed, 5 * 60 * 1000);
      return transformed;
    } catch (error) {
      console.error('Failed to get anger stats:', error);
      // Return default stats
      return {
        totalDeaths: 0,
        highestLevel: 0,
        averageLevel: 0,
        levelCounts: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        timeAtLevel: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };
    }
  }

  /**
   * Get anger history
   */
  async getAngerHistory(limit?: number): Promise<AngerEvent[]> {
    const cacheKey = limit ? `angerHistory:${limit}` : 'angerHistory';
    const cached = this.cache.get<AngerEvent[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const history = await apiClient.getAngerHistory(this.userId, limit);
      // Transform to match frontend types
      const transformed = history.map((e: any) => ({
        level: e.level,
        timestamp: new Date(e.timestamp).getTime(),
        trigger: e.trigger || undefined,
      }));
      this.cache.set(cacheKey, transformed, 5 * 60 * 1000);
      return transformed;
    } catch (error) {
      console.error('Failed to get anger history:', error);
      return [];
    }
  }

  // === Utility Methods ===

  /**
   * Force flush pending writes
   */
  async flush(): Promise<void> {
    if (this.memoryOnlyMode) {
      return;
    }
    await this.writeBatcher.flush();
  }

  /**
   * Get memory summary for debugging
   */
  async getSummary() {
    const cacheKey = 'summary';
    const cached = this.cache.get<any>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const summary = await apiClient.getSummary(this.userId);
      this.cache.set(cacheKey, summary, 5 * 60 * 1000);
      return summary;
    } catch (error) {
      console.error('Failed to get summary:', error);
      return {
        totalMistakes: 0,
        commonMistakes: 0,
        totalPatterns: 0,
        totalInteractions: 0,
        totalDeaths: 0,
      };
    }
  }

  /**
   * Clear all memory (nuclear option)
   */
  async reset(): Promise<void> {
    try {
      await apiClient.reset(this.userId);
      this.cache.clear();
      await this.loadDataIntoCache();
    } catch (error) {
      console.error('Failed to reset memory:', error);
    }
  }

  /**
   * Clean up old data
   */
  private async cleanupOldData(): Promise<void> {
    if (this.memoryOnlyMode) {
      return;
    }

    try {
      await apiClient.cleanup(this.userId);
      // Invalidate all caches after cleanup
      this.cache.clear();
      await this.loadDataIntoCache();
    } catch (error) {
      console.error('Failed to cleanup old data:', error);
    }
  }

  /**
   * Cleanup on destroy
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.writeBatcher.destroy();
    this.cache.clear();
  }
}

// Singleton instance
export const memoryService = new MemoryService();
