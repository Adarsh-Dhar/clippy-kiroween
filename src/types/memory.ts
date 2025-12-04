/**
 * Memory System Type Definitions
 * 
 * Defines the data structures for Clippy's persistent memory system.
 * Clippy never forgets your mistakes, patterns, or past interactions.
 */

/**
 * A recorded mistake from linting or validation
 */
export interface MistakeRecord {
  /** Unique identifier for this mistake record */
  id: string;
  
  /** Type of error (e.g., "missing-semicolon", "undefined-variable") */
  errorType: string;
  
  /** Human-readable error message */
  message: string;
  
  /** Location where the error occurred */
  location: {
    /** File path */
    file: string;
    /** Line number */
    line: number;
  };
  
  /** Timestamp when first recorded (milliseconds since epoch) */
  timestamp: number;
  
  /** How many times this exact error has occurred */
  count: number;
}

/**
 * A recognized code pattern
 */
export interface CodePattern {
  /** Unique identifier for this pattern */
  id: string;
  
  /** Pattern name (e.g., "camelCase-functions", "no-semicolons") */
  name: string;
  
  /** Human-readable description */
  description: string;
  
  /** Frequency percentage (0-100) */
  frequency: number;
  
  /** Timestamp when last seen (milliseconds since epoch) */
  lastSeen: number;
  
  /** Sample code snippets demonstrating this pattern */
  examples: string[];
}

/**
 * A recorded interaction with Clippy
 */
export interface InteractionRecord {
  /** Unique identifier for this interaction */
  id: string;
  
  /** Type of interaction */
  type: 'roast' | 'compliment' | 'help' | 'warning' | 'punishment';
  
  /** The message Clippy displayed */
  message: string;
  
  /** Timestamp when interaction occurred (milliseconds since epoch) */
  timestamp: number;
  
  /** Optional context about the interaction */
  context?: {
    /** Anger level at time of interaction */
    angerLevel?: number;
    /** Error count at time of interaction */
    errorCount?: number;
  };
}

/**
 * Anger level history entry
 */
export interface AngerEvent {
  /** Anger level (0-5) */
  level: number;
  
  /** Timestamp when level changed (milliseconds since epoch) */
  timestamp: number;
  
  /** Optional trigger description */
  trigger?: string;
}

/**
 * Statistics about anger levels
 */
export interface AngerStats {
  /** Total number of times BSOD was triggered (anger level 5) */
  totalDeaths: number;
  
  /** Highest anger level ever achieved */
  highestLevel: number;
  
  /** Average anger level across all sessions */
  averageLevel: number;
  
  /** Count of times each anger level was reached */
  levelCounts: Record<number, number>;
  
  /** Total milliseconds spent at each anger level */
  timeAtLevel: Record<number, number>;
}

/**
 * Complete user memory profile
 */
export interface UserMemory {
  /** Schema version for migrations */
  version: string;
  
  /** Unique user identifier (generated on first use) */
  userId: string;
  
  /** Timestamp when profile was created (milliseconds since epoch) */
  createdAt: number;
  
  /** Timestamp when profile was last updated (milliseconds since epoch) */
  lastUpdated: number;
  
  /** Recorded mistakes */
  mistakes: MistakeRecord[];
  
  /** Recognized code patterns */
  patterns: CodePattern[];
  
  /** Interaction history */
  interactions: InteractionRecord[];
  
  /** Anger level history */
  angerHistory: AngerEvent[];
  
  /** Anger statistics */
  angerStats: AngerStats;
}

/**
 * Type guard to check if a value is a valid MistakeRecord
 */
export function isMistakeRecord(value: unknown): value is MistakeRecord {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Partial<MistakeRecord>;
  
  return (
    typeof record.id === 'string' &&
    typeof record.errorType === 'string' &&
    typeof record.message === 'string' &&
    typeof record.location === 'object' &&
    record.location !== null &&
    typeof record.location.file === 'string' &&
    typeof record.location.line === 'number' &&
    typeof record.timestamp === 'number' &&
    typeof record.count === 'number'
  );
}

/**
 * Type guard to check if a value is a valid CodePattern
 */
export function isCodePattern(value: unknown): value is CodePattern {
  if (typeof value !== 'object' || value === null) return false;
  const pattern = value as Partial<CodePattern>;
  
  return (
    typeof pattern.id === 'string' &&
    typeof pattern.name === 'string' &&
    typeof pattern.description === 'string' &&
    typeof pattern.frequency === 'number' &&
    typeof pattern.lastSeen === 'number' &&
    Array.isArray(pattern.examples) &&
    pattern.examples.every(ex => typeof ex === 'string')
  );
}

/**
 * Type guard to check if a value is a valid InteractionRecord
 */
export function isInteractionRecord(value: unknown): value is InteractionRecord {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Partial<InteractionRecord>;
  
  const validTypes = ['roast', 'compliment', 'help', 'warning', 'punishment'];
  
  return (
    typeof record.id === 'string' &&
    typeof record.type === 'string' &&
    validTypes.includes(record.type) &&
    typeof record.message === 'string' &&
    typeof record.timestamp === 'number' &&
    (record.context === undefined || typeof record.context === 'object')
  );
}

/**
 * Type guard to check if a value is a valid AngerEvent
 */
export function isAngerEvent(value: unknown): value is AngerEvent {
  if (typeof value !== 'object' || value === null) return false;
  const event = value as Partial<AngerEvent>;
  
  return (
    typeof event.level === 'number' &&
    event.level >= 0 &&
    event.level <= 5 &&
    typeof event.timestamp === 'number' &&
    (event.trigger === undefined || typeof event.trigger === 'string')
  );
}

/**
 * Type guard to check if a value is a valid AngerStats
 */
export function isAngerStats(value: unknown): value is AngerStats {
  if (typeof value !== 'object' || value === null) return false;
  const stats = value as Partial<AngerStats>;
  
  return (
    typeof stats.totalDeaths === 'number' &&
    typeof stats.highestLevel === 'number' &&
    typeof stats.averageLevel === 'number' &&
    typeof stats.levelCounts === 'object' &&
    stats.levelCounts !== null &&
    typeof stats.timeAtLevel === 'object' &&
    stats.timeAtLevel !== null
  );
}

/**
 * Type guard to check if a value is a valid UserMemory
 */
export function isUserMemory(value: unknown): value is UserMemory {
  if (typeof value !== 'object' || value === null) return false;
  const memory = value as Partial<UserMemory>;
  
  return (
    typeof memory.version === 'string' &&
    typeof memory.userId === 'string' &&
    typeof memory.createdAt === 'number' &&
    typeof memory.lastUpdated === 'number' &&
    Array.isArray(memory.mistakes) &&
    Array.isArray(memory.patterns) &&
    Array.isArray(memory.interactions) &&
    Array.isArray(memory.angerHistory) &&
    isAngerStats(memory.angerStats)
  );
}
