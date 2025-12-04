# Implementation Plan

- [x] 1. Define Prisma schema models
  - Create complete schema.prisma with all 6 models (User, MistakeRecord, CodePattern, InteractionRecord, AngerEvent, AngerStats)
  - Add foreign key relationships with cascade deletes
  - Define strategic indexes for userId, timestamp, errorType, and frequency fields
  - Configure JSON fields for AngerStats levelCounts and timeAtLevel
  - Set up Prisma client generator with correct output path
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

- [-] 2. Set up database infrastructure
  - Add DATABASE_URL environment variable configuration
  - Create Prisma migration files
  - Generate Prisma client
  - Verify database connection and schema deployment
  - _Requirements: 10.1, 10.2_

- [-] 3. Create migration utility
- [ ] 3.1 Implement localStorage detection and parsing
  - Create memoryMigration.ts utility file
  - Write function to check for existing localStorage data
  - Parse and validate localStorage JSON structure
  - Implement migration marker check (clippy_memory_migrated flag)
  - _Requirements: 2.1, 2.4_

- [ ] 3.2 Implement data transfer logic
  - Create User record from localStorage userId
  - Migrate all MistakeRecord entries with proper field mapping
  - Migrate all CodePattern entries including examples array
  - Migrate all InteractionRecord entries with optional context
  - Migrate all AngerEvent entries
  - Create AngerStats record from localStorage statistics
  - _Requirements: 2.2, 2.3_

- [ ] 3.3 Add migration validation and error handling
  - Wrap migration in Prisma transaction for atomicity
  - Validate record counts match after migration
  - Log migration progress and results
  - Mark localStorage as migrated on success
  - Implement rollback on failure
  - _Requirements: 2.5, 10.3, 10.4, 10.5_

- [ ] 4. Implement database-backed Memory Service
- [ ] 4.1 Create Prisma client wrapper and connection management
  - Initialize Prisma client singleton
  - Implement connection error handling with fallback to memory-only mode
  - Add connection timeout configuration (2 seconds)
  - Create database health check function
  - _Requirements: 8.3, 9.5_

- [ ] 4.2 Implement caching layer
  - Create in-memory cache for hot data (recent interactions, common mistakes, favorite patterns)
  - Implement cache invalidation logic for each data type
  - Add 5-minute TTL for cached data
  - Track cache hit rates for monitoring
  - _Requirements: 9.4_

- [ ] 4.3 Implement write batching system
  - Create WriteBatcher class with 500ms debounce
  - Implement pending writes queue
  - Add automatic flush every 5 seconds
  - Wrap batched writes in Prisma transactions
  - Handle write failures with retry logic
  - _Requirements: 3.5, 9.1_

- [ ] 4.4 Migrate mistake management methods to Prisma
  - Reimplement recordMistake with upsert logic (create or increment count)
  - Reimplement getCommonMistakes with Prisma query (count >= 3)
  - Reimplement getMistakeCount with aggregation query
  - Reimplement getMistakes with optional errorType filter
  - Enforce 100 record limit with oldest-first deletion
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 8.1_

- [ ] 4.5 Migrate pattern management methods to Prisma
  - Reimplement analyzeCodePatterns with upsert logic for patterns
  - Update pattern frequency and lastSeen timestamp on existing patterns
  - Reimplement getFavoritePatterns with frequency > 50 filter
  - Reimplement getPatterns to return all patterns
  - Enforce 20 pattern limit with frequency-based prioritization
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 8.1_

- [ ] 4.6 Migrate interaction management methods to Prisma
  - Reimplement recordInteraction with context storage
  - Reimplement getRecentInteractions with limit and ordering
  - Reimplement getInteractionsByType with type filter
  - Enforce 50 interaction rolling window
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 8.1_

- [ ] 4.7 Migrate anger management methods to Prisma
  - Reimplement recordAngerChange to create AngerEvent records
  - Update AngerStats with level counts and time calculations
  - Increment totalDeaths counter when level reaches 5
  - Calculate and store average anger level
  - Reimplement getAngerStats to return current statistics
  - Reimplement getAngerHistory with optional limit
  - Enforce 200 anger event limit
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 8.1_

- [ ] 4.8 Implement utility methods
  - Reimplement flush to execute pending writes immediately
  - Reimplement getSummary to query record counts from database
  - Reimplement reset to delete all user data
  - Reimplement destroy to cleanup connections and flush pending writes
  - _Requirements: 8.4_

- [ ] 5. Implement data cleanup and maintenance
  - Create cleanupOldData method with 30-day archive policy
  - Delete mistakes, patterns, and anger events older than 30 days
  - Implement enforceLimits method for FIFO record limits
  - Schedule automatic cleanup on initialization and hourly
  - Wrap cleanup operations in transactions
  - _Requirements: 4.4, 5.5_

- [ ] 6. Add performance optimizations
  - Verify all indexes are created in schema
  - Implement query result limiting with take parameter
  - Use select to fetch only needed fields in queries
  - Implement batch reads for multiple records
  - Add query performance logging for operations > 2 seconds
  - _Requirements: 9.1, 9.2, 9.3, 9.5_

- [ ] 7. Integrate migration on application startup
  - Call migration utility in Memory Service constructor
  - Run migration before loading data from database
  - Handle migration errors gracefully
  - Log migration status and record counts
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 8. Update Memory Service initialization
  - Load userId from localStorage or create new one
  - Fetch or create User record in database
  - Load all memory data from database into cache
  - Initialize write batcher and cleanup scheduler
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 9. Add logging and monitoring
  - Implement structured logging for all database operations
  - Log migration events with INFO level
  - Log performance warnings for slow queries (> 2s)
  - Log errors for connection failures and transaction rollbacks
  - Track metrics: query times, cache hit rate, batch sizes
  - _Requirements: 9.5_

- [ ] 10. Update environment configuration
  - Add DATABASE_URL to .env file
  - Document required environment variables in README
  - Add optional connection pool settings
  - Configure SSL for production database connections
  - _Requirements: 10.1_

- [ ] 11. Write unit tests for Memory Service
  - Test recordMistake with mocked Prisma client
  - Test getCommonMistakes filtering logic
  - Test analyzeCodePatterns pattern detection
  - Test recordInteraction with context
  - Test recordAngerChange statistics calculation
  - Test caching behavior and invalidation
  - Test write batching and flush
  - Test error handling and fallback modes
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ] 12. Write integration tests for database operations
  - Test migration utility with sample localStorage data
  - Test Prisma queries against test database
  - Test transaction rollback scenarios
  - Verify indexes are used with EXPLAIN ANALYZE
  - Test concurrent write scenarios
  - Measure query performance benchmarks
  - _Requirements: 2.1, 2.2, 2.3, 9.1, 9.2, 9.3_

- [ ] 13. Create migration documentation
  - Document migration process in README
  - Add troubleshooting guide for common issues
  - Document rollback procedure
  - Create database setup guide for development
  - Document environment variable configuration
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_
