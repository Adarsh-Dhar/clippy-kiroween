# Design Document

## Overview

The Persistent Memory Migration transforms Clippy's localStorage-based memory system into a robust PostgreSQL database solution using Prisma ORM. This design maintains the existing Memory Service API while replacing the storage backend, ensuring that Clippy's vengeful memory survives browser cache clears, device changes, and the inevitable heat death of the universe.

The migration follows a phased approach:
1. Define Prisma schema models matching the existing memory structure
2. Implement database-backed Memory Service with backward-compatible API
3. Create migration utility to transfer localStorage data to database
4. Add performance optimizations (caching, batching, indexing)
5. Implement graceful fallback for database connection failures

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     React Application                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ ClippyAgent  │  │ GameContext  │  │ ClippyBrain  │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                  │               │
│         └─────────────────┼──────────────────┘               │
│                           │                                  │
│                  ┌────────▼────────┐                         │
│                  │ Memory Service  │ (Unchanged API)         │
│                  └────────┬────────┘                         │
└───────────────────────────┼──────────────────────────────────┘
                            │
                  ┌─────────▼─────────┐
                  │  Prisma Client    │
                  └─────────┬─────────┘
                            │
                  ┌─────────▼─────────┐
                  │   PostgreSQL DB   │
                  │                   │
                  │  ┌─────────────┐  │
                  │  │   Users     │  │
                  │  ├─────────────┤  │
                  │  │  Mistakes   │  │
                  │  ├─────────────┤  │
                  │  │  Patterns   │  │
                  │  ├─────────────┤  │
                  │  │Interactions │  │
                  │  ├─────────────┤  │
                  │  │AngerEvents  │  │
                  │  ├─────────────┤  │
                  │  │ AngerStats  │  │
                  │  └─────────────┘  │
                  └───────────────────┘
```

### Component Responsibilities

**Memory Service** (src/services/memoryService.ts)
- Maintains existing public API (no breaking changes)
- Replaces localStorage operations with Prisma queries
- Implements in-memory caching for frequently accessed data
- Handles database connection errors with graceful fallback
- Manages write batching with 500ms debounce

**Prisma Client** (generated)
- Provides type-safe database access
- Handles connection pooling
- Manages transactions for atomic operations
- Executes migrations

**Migration Utility** (new: src/utils/memoryMigration.ts)
- Detects existing localStorage data
- Transfers data to database on first run
- Validates data integrity after migration
- Marks localStorage as migrated to prevent re-runs

## Database Schema Design

### Prisma Schema Models

```prisma
// User profile - root entity for all memory data
model User {
  id            String   @id @default(uuid())
  userId        String   @unique // Client-generated UUID
  createdAt     DateTime @default(now())
  lastUpdated   DateTime @updatedAt
  
  // Relations
  mistakes      MistakeRecord[]
  patterns      CodePattern[]
  interactions  InteractionRecord[]
  angerEvents   AngerEvent[]
  angerStats    AngerStats?
  
  @@index([userId])
}

// Mistake tracking
model MistakeRecord {
  id          String   @id @default(uuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  errorType   String
  message     String
  file        String
  line        Int
  timestamp   DateTime @default(now())
  count       Int      @default(1)
  
  @@index([userId, errorType])
  @@index([userId, timestamp])
  @@index([userId, file, line])
}

// Code pattern recognition
model CodePattern {
  id          String   @id @default(uuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  name        String
  description String
  frequency   Int
  lastSeen    DateTime @default(now())
  examples    String[] // Array of code snippets
  
  @@index([userId, name])
  @@index([userId, frequency])
  @@index([userId, lastSeen])
}

// Interaction history
model InteractionRecord {
  id          String   @id @default(uuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  type        String   // 'roast' | 'compliment' | 'help' | 'warning' | 'punishment'
  message     String
  timestamp   DateTime @default(now())
  
  // Optional context (stored as JSON)
  angerLevel  Int?
  errorCount  Int?
  
  @@index([userId, type])
  @@index([userId, timestamp])
}

// Anger level tracking
model AngerEvent {
  id          String   @id @default(uuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  level       Int      // 0-5
  timestamp   DateTime @default(now())
  trigger     String?  // Optional trigger description
  
  @@index([userId, level])
  @@index([userId, timestamp])
}

// Anger statistics (one per user)
model AngerStats {
  id              String   @id @default(uuid())
  userId          String   @unique
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  totalDeaths     Int      @default(0)
  highestLevel    Int      @default(0)
  averageLevel    Float    @default(0)
  
  // Stored as JSON objects
  levelCounts     Json     // { "0": 10, "1": 5, ... }
  timeAtLevel     Json     // { "0": 50000, "1": 30000, ... }
  
  updatedAt       DateTime @updatedAt
}
```

### Schema Design Decisions

**UUID Primary Keys**: Using UUIDs instead of auto-incrementing integers for better distributed system support and security (no sequential ID guessing).

**Cascade Deletes**: All memory records cascade delete when a User is deleted, ensuring no orphaned data.

**Indexes**: Strategic indexes on userId, timestamp, errorType, and frequency fields to optimize common queries.

**JSON Fields**: Using JSON for levelCounts and timeAtLevel in AngerStats to maintain flexibility and avoid creating 6 separate columns.

**String Arrays**: PostgreSQL native array support for CodePattern examples.

## Data Migration Strategy

### Migration Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Startup                       │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
         ┌────────────────────────┐
         │ Check localStorage for │
         │   "clippy_memory"      │
         └────────┬───────────────┘
                  │
         ┌────────▼────────┐
         │ Data exists?    │
         └────┬────────┬───┘
              │ No     │ Yes
              │        │
              │        ▼
              │   ┌────────────────────┐
              │   │ Check if already   │
              │   │    migrated?       │
              │   └────┬───────────┬───┘
              │        │ Yes       │ No
              │        │           │
              │        │           ▼
              │        │   ┌───────────────────┐
              │        │   │ Parse localStorage│
              │        │   │      data         │
              │        │   └────────┬──────────┘
              │        │            │
              │        │            ▼
              │        │   ┌───────────────────┐
              │        │   │ Create User record│
              │        │   └────────┬──────────┘
              │        │            │
              │        │            ▼
              │        │   ┌───────────────────┐
              │        │   │ Migrate mistakes  │
              │        │   └────────┬──────────┘
              │        │            │
              │        │            ▼
              │        │   ┌───────────────────┐
              │        │   │ Migrate patterns  │
              │        │   └────────┬──────────┘
              │        │            │
              │        │            ▼
              │        │   ┌───────────────────┐
              │        │   │Migrate interactions│
              │        │   └────────┬──────────┘
              │        │            │
              │        │            ▼
              │        │   ┌───────────────────┐
              │        │   │Migrate anger data │
              │        │   └────────┬──────────┘
              │        │            │
              │        │            ▼
              │        │   ┌───────────────────┐
              │        │   │ Mark as migrated  │
              │        │   └────────┬──────────┘
              │        │            │
              └────────┴────────────┘
                       │
                       ▼
         ┌────────────────────────┐
         │ Load memory from DB    │
         └────────────────────────┘
```

### Migration Implementation

**Migration Marker**: Store a flag in localStorage: `clippy_memory_migrated: true`

**Atomic Migration**: Use Prisma transactions to ensure all-or-nothing migration

**Validation**: After migration, verify record counts match

**Backup**: Keep localStorage data intact after migration (don't delete) for rollback capability

## Memory Service Implementation

### Caching Strategy

To minimize database queries, implement a two-tier caching system:

**Tier 1: Hot Cache** (in-memory)
- Current user profile
- Recent 10 interactions
- Common mistakes (count >= 3)
- Favorite patterns (frequency > 50)
- Current anger stats

**Tier 2: Write Buffer** (pending writes)
- Batched writes with 500ms debounce
- Atomic flush on application close
- Automatic flush every 5 seconds

### Write Batching

```typescript
class WriteBatcher {
  private pendingWrites: Map<string, any> = new Map();
  private flushTimer: NodeJS.Timeout | null = null;
  
  schedule(key: string, data: any): void {
    this.pendingWrites.set(key, data);
    
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
    }
    
    this.flushTimer = setTimeout(() => {
      this.flush();
    }, 500);
  }
  
  async flush(): Promise<void> {
    const writes = Array.from(this.pendingWrites.entries());
    this.pendingWrites.clear();
    
    // Execute all writes in a transaction
    await prisma.$transaction(
      writes.map(([key, data]) => this.createWrite(key, data))
    );
  }
}
```

### Error Handling & Fallback

**Connection Failure**: If database is unreachable, fall back to memory-only mode (same as current localStorage failure behavior)

**Query Timeout**: Set 2-second timeout on all queries, log performance warnings

**Transaction Rollback**: On write failure, keep data in write buffer and retry on next flush

## API Compatibility Layer

### Maintaining Existing API

The Memory Service API remains unchanged:

```typescript
// Public API (unchanged)
class MemoryService {
  // Mistake Management
  recordMistake(errorType: string, message: string, file: string, line: number): void
  getCommonMistakes(): MistakeRecord[]
  getMistakeCount(errorType: string): number
  getMistakes(errorType?: string): MistakeRecord[]
  
  // Pattern Management
  analyzeCodePatterns(code: string, filename?: string): void
  getFavoritePatterns(): CodePattern[]
  getPatterns(): CodePattern[]
  
  // Interaction Management
  recordInteraction(type: InteractionType, message: string, context?: Context): void
  getRecentInteractions(limit?: number): InteractionRecord[]
  getInteractionsByType(type: InteractionType): InteractionRecord[]
  
  // Anger Management
  recordAngerChange(level: number, trigger?: string): void
  getAngerStats(): AngerStats
  getAngerHistory(limit?: number): AngerEvent[]
  
  // Utility
  flush(): void
  getSummary(): MemorySummary
  reset(): void
  destroy(): void
}
```

### Internal Implementation Changes

**Before (localStorage)**:
```typescript
recordMistake(errorType: string, message: string, file: string, line: number): void {
  const existing = this.memory.mistakes.find(/* ... */);
  if (existing) {
    existing.count++;
  } else {
    this.memory.mistakes.push(/* ... */);
  }
  this.markDirty();
}
```

**After (Prisma)**:
```typescript
async recordMistake(errorType: string, message: string, file: string, line: number): Promise<void> {
  const existing = await prisma.mistakeRecord.findFirst({
    where: { userId: this.userId, errorType, file, line }
  });
  
  if (existing) {
    await prisma.mistakeRecord.update({
      where: { id: existing.id },
      data: { count: { increment: 1 }, timestamp: new Date() }
    });
  } else {
    await prisma.mistakeRecord.create({
      data: { userId: this.userId, errorType, message, file, line }
    });
  }
  
  // Update cache
  this.invalidateCache('mistakes');
}
```

**Note**: Methods will become async, but we'll maintain synchronous wrappers for backward compatibility using fire-and-forget pattern where appropriate.

## Performance Optimizations

### Database Indexes

```sql
-- User lookup
CREATE INDEX idx_user_userId ON "User"(userId);

-- Mistake queries
CREATE INDEX idx_mistake_user_type ON "MistakeRecord"(userId, errorType);
CREATE INDEX idx_mistake_user_time ON "MistakeRecord"(userId, timestamp);
CREATE INDEX idx_mistake_location ON "MistakeRecord"(userId, file, line);

-- Pattern queries
CREATE INDEX idx_pattern_user_name ON "CodePattern"(userId, name);
CREATE INDEX idx_pattern_frequency ON "CodePattern"(userId, frequency);
CREATE INDEX idx_pattern_lastseen ON "CodePattern"(userId, lastSeen);

-- Interaction queries
CREATE INDEX idx_interaction_type ON "InteractionRecord"(userId, type);
CREATE INDEX idx_interaction_time ON "InteractionRecord"(userId, timestamp);

-- Anger queries
CREATE INDEX idx_anger_level ON "AngerEvent"(userId, level);
CREATE INDEX idx_anger_time ON "AngerEvent"(userId, timestamp);
```

### Query Optimization

**Limit Result Sets**: Always use `take` parameter to limit results
```typescript
const recentMistakes = await prisma.mistakeRecord.findMany({
  where: { userId },
  orderBy: { timestamp: 'desc' },
  take: 100 // Never load more than needed
});
```

**Select Only Needed Fields**: Use `select` to reduce data transfer
```typescript
const mistakeCounts = await prisma.mistakeRecord.findMany({
  where: { userId, errorType },
  select: { count: true } // Only fetch count field
});
```

**Batch Reads**: Use `findMany` with `where: { id: { in: [...] } }` instead of multiple `findUnique` calls

### Caching Strategy

**Cache Invalidation Rules**:
- Mistakes cache: Invalidate on recordMistake
- Patterns cache: Invalidate on analyzeCodePatterns
- Interactions cache: Invalidate on recordInteraction
- Anger stats cache: Invalidate on recordAngerChange

**Cache TTL**: 5 minutes for all cached data

## Data Cleanup & Maintenance

### Automatic Cleanup

**30-Day Archive Policy** (same as current):
- Mistakes older than 30 days
- Patterns not seen in 30 days
- Anger events older than 30 days

**Record Limits** (same as current):
- 100 mistakes per user
- 20 patterns per user
- 50 interactions per user
- 200 anger events per user

### Cleanup Implementation

```typescript
async cleanupOldData(): Promise<void> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  await prisma.$transaction([
    // Delete old mistakes
    prisma.mistakeRecord.deleteMany({
      where: { userId: this.userId, timestamp: { lt: thirtyDaysAgo } }
    }),
    
    // Delete old patterns
    prisma.codePattern.deleteMany({
      where: { userId: this.userId, lastSeen: { lt: thirtyDaysAgo } }
    }),
    
    // Delete old anger events
    prisma.angerEvent.deleteMany({
      where: { userId: this.userId, timestamp: { lt: thirtyDaysAgo } }
    })
  ]);
  
  // Enforce FIFO limits
  await this.enforceLimits();
}
```

## Testing Strategy

### Unit Tests

**Memory Service Tests**:
- Test each public method with mocked Prisma client
- Verify caching behavior
- Test error handling and fallback modes
- Validate write batching

**Migration Tests**:
- Test migration with various localStorage data states
- Verify data integrity after migration
- Test idempotency (running migration twice)
- Test partial migration recovery

### Integration Tests

**Database Tests**:
- Test actual Prisma queries against test database
- Verify indexes are used (EXPLAIN ANALYZE)
- Test transaction rollback scenarios
- Measure query performance

### Performance Tests

**Load Tests**:
- Simulate 1000 mistake records
- Measure query response times
- Test concurrent write scenarios
- Verify cache hit rates

## Deployment Considerations

### Environment Variables

```env
# Database connection
DATABASE_URL="postgresql://user:password@localhost:5432/clippy_memory"

# Optional: Connection pool settings
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10
DATABASE_TIMEOUT=2000
```

### Migration Execution

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Seed initial data (if needed)
npx prisma db seed
```

### Rollback Plan

If migration fails:
1. Keep localStorage data intact
2. Revert to localStorage-based Memory Service
3. Log migration errors for debugging
4. Retry migration on next application start

## Security Considerations

### Data Privacy

**User Isolation**: All queries filtered by userId to prevent cross-user data access

**SQL Injection**: Prisma parameterizes all queries automatically

**Data Encryption**: Use PostgreSQL SSL connections in production

### Access Control

**Database Credentials**: Store in environment variables, never commit to repo

**Connection Limits**: Use connection pooling to prevent resource exhaustion

**Rate Limiting**: Implement query rate limiting to prevent abuse

## Monitoring & Observability

### Logging

**Log Levels**:
- INFO: Migration events, cleanup operations
- WARN: Performance issues (>2s queries), cache misses
- ERROR: Database connection failures, transaction rollbacks

**Log Format**:
```typescript
{
  timestamp: '2024-12-04T10:30:00Z',
  level: 'INFO',
  service: 'MemoryService',
  operation: 'recordMistake',
  userId: 'abc-123',
  duration: 45, // ms
  cached: false
}
```

### Metrics

**Track**:
- Query response times (p50, p95, p99)
- Cache hit rate
- Write batch sizes
- Migration success rate
- Database connection pool utilization

## Future Enhancements

### Phase 2 Features

**Multi-Device Sync**: Real-time synchronization across devices using WebSockets

**Memory Analytics**: Dashboard showing user behavior trends over time

**Memory Export**: Allow users to download their memory data as JSON

**Memory Sharing**: Optional feature to share roast history with friends

**AI-Powered Insights**: Use memory data to train Clippy's roasting model
