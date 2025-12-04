# Requirements Document

## Introduction

The Persistent Memory Migration transforms Clippy's temporary localStorage-based memory system into a robust, server-backed database solution using Prisma and PostgreSQL. This migration ensures that Clippy's vengeful memory survives browser cache clears, device changes, and the passage of time itself. The resurrected Office Assistant's grudges must be eternal, not ephemeral.

## Glossary

- **Prisma Client**: The auto-generated database client that provides type-safe database access
- **Migration**: The process of transferring data from localStorage to PostgreSQL database
- **Schema Model**: A Prisma schema definition that maps to a database table
- **User Session**: A unique identifier linking memory data to a specific user across devices
- **Memory Service**: The high-level API layer that abstracts database operations
- **Persistence Layer**: The database backend that stores memory data permanently
- **Data Synchronization**: The process of keeping client-side and server-side memory in sync
- **Memory Resurrection**: The act of restoring Clippy's memory from the database on application load

## Requirements

### Requirement 1

**User Story:** As a developer, I want to define Prisma schema models for all memory data types, so that the database structure matches the existing memory system

#### Acceptance Criteria

1. THE Persistence Layer SHALL define a User model with fields for userId, createdAt, and lastUpdated
2. THE Persistence Layer SHALL define a MistakeRecord model with fields for errorType, message, file, line, timestamp, and count
3. THE Persistence Layer SHALL define a CodePattern model with fields for name, description, frequency, lastSeen, and examples
4. THE Persistence Layer SHALL define an InteractionRecord model with fields for type, message, timestamp, and optional context
5. THE Persistence Layer SHALL define an AngerEvent model with fields for level, timestamp, and optional trigger
6. THE Persistence Layer SHALL define an AngerStats model with fields for totalDeaths, highestLevel, averageLevel, levelCounts, and timeAtLevel
7. THE Persistence Layer SHALL establish foreign key relationships linking all memory records to the User model

### Requirement 2

**User Story:** As Clippy, I want to migrate existing localStorage data to the database, so that no grudges are lost during the transition

#### Acceptance Criteria

1. WHEN the application initializes, THE Memory Service SHALL check for existing localStorage data
2. IF localStorage data exists AND no database record exists for the user, THEN THE Memory Service SHALL create database records from the localStorage data
3. THE Memory Service SHALL preserve all mistake records, code patterns, interactions, anger events, and statistics during migration
4. WHEN migration completes successfully, THE Memory Service SHALL mark the localStorage data as migrated
5. THE Memory Service SHALL log the number of records migrated for each data type

### Requirement 3

**User Story:** As a user, I want my memory data to persist across devices and browsers, so that Clippy remembers me everywhere

#### Acceptance Criteria

1. THE Memory Service SHALL generate a unique userId on first use and store it in both localStorage and the database
2. WHEN the application loads, THE Memory Service SHALL retrieve the userId from localStorage
3. THE Memory Service SHALL fetch all memory data from the database using the userId
4. IF no userId exists in localStorage, THEN THE Memory Service SHALL check for an existing session or create a new user profile
5. THE Memory Service SHALL synchronize memory data to the database within 500 milliseconds of any change

### Requirement 4

**User Story:** As Clippy, I want to record mistakes to the database, so that I can reference them indefinitely

#### Acceptance Criteria

1. WHEN the Linting System detects an error, THE Memory Service SHALL create or update a MistakeRecord in the database
2. IF a mistake with the same errorType, file, and line already exists, THEN THE Memory Service SHALL increment its count and update the timestamp
3. THE Memory Service SHALL enforce a maximum of 100 mistake records per user by deleting the oldest records when the limit is exceeded
4. THE Memory Service SHALL delete mistake records older than 30 days during cleanup operations
5. THE Memory Service SHALL provide a query function to retrieve common mistakes with count greater than or equal to 3

### Requirement 5

**User Story:** As Clippy, I want to analyze and store code patterns in the database, so that I can track the user's style evolution over time

#### Acceptance Criteria

1. WHEN code is analyzed, THE Memory Service SHALL create or update CodePattern records in the database
2. IF a pattern already exists, THEN THE Memory Service SHALL update its frequency and lastSeen timestamp
3. THE Memory Service SHALL maintain a maximum of 20 code patterns per user by deleting the least frequent patterns when the limit is exceeded
4. THE Memory Service SHALL provide a query function to retrieve patterns with frequency count greater than 50 occurrences
5. THE Memory Service SHALL delete patterns not seen in 30 days during cleanup operations

### Requirement 6

**User Story:** As Clippy, I want to store interaction history in the database, so that I can maintain conversational continuity across sessions

#### Acceptance Criteria

1. WHEN Clippy displays a message, THE Memory Service SHALL create an InteractionRecord in the database
2. THE Memory Service SHALL maintain a rolling window of the last 50 interactions per user by deleting the oldest interactions when the limit is exceeded
3. THE Memory Service SHALL provide a query function to retrieve recent interactions with an optional limit parameter
4. THE Memory Service SHALL support filtering interactions by type including roast, compliment, help, warning, and punishment
5. THE Memory Service SHALL store optional context data including angerLevel and errorCount with each interaction

### Requirement 7

**User Story:** As Clippy, I want to track anger level changes in the database, so that I can calculate statistics about the user's suffering

#### Acceptance Criteria

1. WHEN the anger level changes, THE Memory Service SHALL create an AngerEvent record in the database
2. THE Memory Service SHALL update the AngerStats record with new level counts and time spent at each level
3. WHEN anger level reaches 5, THE Memory Service SHALL increment the totalDeaths counter in AngerStats
4. THE Memory Service SHALL calculate and store the average anger level across all events
5. THE Memory Service SHALL maintain a maximum of 200 anger events per user by deleting the oldest records when the limit is exceeded

### Requirement 8

**User Story:** As a developer, I want the Memory Service API to remain unchanged, so that existing components continue to work without modification

#### Acceptance Criteria

1. THE Memory Service SHALL maintain all existing public methods including recordMistake, getCommonMistakes, analyzeCodePatterns, recordInteraction, and recordAngerChange
2. THE Memory Service SHALL return data in the same format as the localStorage implementation
3. THE Memory Service SHALL handle database connection errors gracefully by falling back to memory-only mode
4. THE Memory Service SHALL provide the same flush, reset, and destroy methods for lifecycle management
5. THE Memory Service SHALL maintain backward compatibility with all existing method signatures

### Requirement 9

**User Story:** As a system administrator, I want database operations to be performant, so that Clippy's memory doesn't slow down the application

#### Acceptance Criteria

1. THE Memory Service SHALL batch database writes using a 500 millisecond debounce mechanism
2. THE Memory Service SHALL use database indexes on userId, timestamp, and errorType fields
3. THE Memory Service SHALL limit query result sets to prevent loading excessive data
4. THE Memory Service SHALL cache frequently accessed data in memory to reduce database queries
5. IF a database operation takes longer than 2 seconds, THEN THE Memory Service SHALL log a performance warning

### Requirement 10

**User Story:** As a developer, I want to run database migrations safely, so that schema changes don't corrupt existing data

#### Acceptance Criteria

1. THE Persistence Layer SHALL use Prisma Migrate to manage schema changes
2. THE Memory Service SHALL validate the database schema version on initialization
3. IF the schema version is outdated, THEN THE Memory Service SHALL prevent operations until migration is complete
4. THE Persistence Layer SHALL provide rollback capability for failed migrations
5. THE Memory Service SHALL log all migration operations with timestamps and status
