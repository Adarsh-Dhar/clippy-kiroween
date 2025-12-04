# Database Setup Guide

This guide explains how to set up the PostgreSQL database for Clippy's memory system.

## Prerequisites

- Docker and Docker Compose installed
- Node.js and npm/pnpm installed

## Quick Start

1. **Start the database:**
   ```bash
   docker compose up -d db
   ```

2. **Set up environment variables:**
   Create a `.env` file in the root directory:
   ```bash
   DATABASE_URL="postgresql://postgres:example@localhost:5434/clippy_memory?schema=public"
   VITE_API_URL="http://localhost:3001"
   PORT=3001
   ```

3. **Generate Prisma client:**
   ```bash
   npx prisma generate
   ```

4. **Run database migrations:**
   ```bash
   npx prisma migrate deploy
   ```
   
   Or for development (creates migration files):
   ```bash
   npx prisma migrate dev
   ```

5. **Install server dependencies:**
   ```bash
   cd server
   npm install
   ```

6. **Start the server:**
   ```bash
   npm start
   ```

## Database Schema

The database includes the following models:

- **User**: Root entity for all memory data
- **MistakeRecord**: Tracks coding mistakes with counts
- **CodePattern**: Recognized code patterns and styles
- **InteractionRecord**: History of Clippy interactions
- **AngerEvent**: Anger level changes over time
- **AngerStats**: Aggregated anger statistics

## Migration from localStorage

On first startup, the application automatically migrates data from localStorage to the database. The migration:

1. Checks for existing localStorage data
2. Transfers all records to the database
3. Marks migration as complete
4. Continues using the database for all future operations

## Troubleshooting

### Database Connection Issues

If you see connection errors:

1. Verify the database is running:
   ```bash
   docker compose ps
   ```

2. Check the DATABASE_URL in your `.env` file matches the compose.yaml configuration

3. Test the connection:
   ```bash
   npx prisma db pull
   ```

### Migration Issues

If migration fails:

1. Check server logs for detailed error messages
2. Verify the database schema is up to date:
   ```bash
   npx prisma migrate status
   ```

3. Reset the database (WARNING: deletes all data):
   ```bash
   npx prisma migrate reset
   ```

### Prisma Client Generation

If you see "PrismaClient is not defined" errors:

1. Regenerate the client:
   ```bash
   npx prisma generate
   ```

2. Restart the server after generating

## Production Deployment

For production:

1. Use a managed PostgreSQL database (e.g., AWS RDS, Supabase, Railway)
2. Update DATABASE_URL with production credentials
3. Enable SSL connections:
   ```
   DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"
   ```
4. Run migrations before deploying:
   ```bash
   npx prisma migrate deploy
   ```

## Backup and Restore

### Backup
```bash
docker compose exec db pg_dump -U postgres clippy_memory > backup.sql
```

### Restore
```bash
docker compose exec -T db psql -U postgres clippy_memory < backup.sql
```

