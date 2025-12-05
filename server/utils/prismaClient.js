/**
 * Prisma Client Wrapper
 * 
 * Singleton Prisma client with connection management and error handling
 */

// Use the generated Prisma client from the root
// Note: Prisma client must be generated before running the server
// Run: npx prisma generate (from project root)
const path = require('path');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

// Add root node_modules to NODE_PATH so generated Prisma client can find its dependencies
const rootNodeModules = path.join(__dirname, '../../node_modules');
if (!process.env.NODE_PATH) {
  process.env.NODE_PATH = rootNodeModules;
} else if (!process.env.NODE_PATH.includes(rootNodeModules)) {
  process.env.NODE_PATH = `${rootNodeModules}:${process.env.NODE_PATH}`;
}
// Force Node.js to recognize the new NODE_PATH
require('module')._initPaths();

let PrismaClientClass;
try {
  // Try to use the generated client
  // The generated client exports PrismaClient as a class constructor
  const clientModule = require(path.join(__dirname, '../../src/generated/prisma/client'));
  PrismaClientClass = clientModule.PrismaClient || clientModule.default?.PrismaClient;
  if (!PrismaClientClass) {
    throw new Error('PrismaClient not found in generated client');
  }
} catch (error) {
  console.warn('⚠️  Failed to load Prisma client. Server will run in memory-only mode.');
  console.warn('   Error:', error.message);
  console.warn('   Hint: Run "npx prisma generate" from the project root to enable database features.');
  // Don't throw - allow server to continue in memory-only mode
  PrismaClientClass = null;
}

let prisma = null;
let isConnected = false;
let lastError = null;
// Increased timeout for production (Neon may need more time for initial connection)
const CONNECTION_TIMEOUT = process.env.NODE_ENV === 'production' ? 10000 : 2000; // 10s production, 2s development

/**
 * Check if DATABASE_URL is set
 */
function checkDatabaseUrl() {
  return {
    isSet: !!process.env.DATABASE_URL,
    masked: process.env.DATABASE_URL 
      ? `${process.env.DATABASE_URL.split('@')[0]}@***` 
      : null,
  };
}

/**
 * Categorize database connection errors
 */
function categorizeError(error) {
  const errorMessage = error?.message || String(error);
  const errorLower = errorMessage.toLowerCase();
  
  // Check for specific error patterns
  if (!process.env.DATABASE_URL) {
    return {
      category: 'DATABASE_URL_NOT_SET',
      message: 'DATABASE_URL environment variable is not set',
      hint: 'Set DATABASE_URL in your .env file or environment variables',
    };
  }
  
  if (errorLower.includes('timeout') || errorLower.includes('timed out')) {
    return {
      category: 'CONNECTION_TIMEOUT',
      message: `Database connection timed out after ${CONNECTION_TIMEOUT}ms`,
      hint: 'Check if database is running: docker ps | grep postgres',
    };
  }
  
  if (errorLower.includes('connection refused') || errorLower.includes('econnrefused')) {
    return {
      category: 'CONNECTION_REFUSED',
      message: 'Database connection refused',
      hint: 'Database may not be running. Start with: docker compose up -d db',
    };
  }
  
  if (errorLower.includes('authentication') || errorLower.includes('password') || errorLower.includes('auth')) {
    return {
      category: 'AUTHENTICATION_FAILED',
      message: 'Database authentication failed',
      hint: 'Check DATABASE_URL credentials (username/password)',
    };
  }
  
  if (errorLower.includes('database') && (errorLower.includes('does not exist') || errorLower.includes('not found'))) {
    return {
      category: 'DATABASE_NOT_FOUND',
      message: 'Database does not exist',
      hint: 'Create the database or check DATABASE_URL database name',
    };
  }
  
  if (errorLower.includes('prisma') || errorLower.includes('client') || errorLower.includes('engine type') || errorLower.includes('adapter') || errorLower.includes('accelerateurl')) {
    return {
      category: 'PRISMA_CLIENT_ERROR',
      message: errorMessage.includes('engine type') 
        ? 'Prisma client engine type configuration error. Regenerate client with correct engine type.'
        : 'Prisma client error',
      hint: 'Run: pnpm prisma generate (make sure schema.prisma has engineType = "library" in generator)',
    };
  }
  
  if (errorLower.includes('network') || errorLower.includes('enotfound') || errorLower.includes('eai_again')) {
    return {
      category: 'NETWORK_ERROR',
      message: 'Network connectivity error',
      hint: 'Check network connection and database host/port',
    };
  }
  
  return {
    category: 'UNKNOWN_ERROR',
    message: errorMessage,
    hint: 'Check server logs for more details',
  };
}

/**
 * Initialize Prisma client with connection timeout
 */
async function initPrisma() {
  // If PrismaClientClass is not available, return null (memory-only mode)
  if (!PrismaClientClass) {
    isConnected = false;
    return null;
  }

  // If already connected, return existing client
  if (prisma && isConnected) {
    return prisma;
  }

  // Check DATABASE_URL first
  const dbUrlCheck = checkDatabaseUrl();
  if (!dbUrlCheck.isSet) {
    const error = categorizeError(new Error('DATABASE_URL not set'));
    lastError = {
      ...error,
      timestamp: new Date().toISOString(),
      databaseUrlSet: false,
    };
    isConnected = false;
    return null;
  }

  // If prisma exists but not connected, disconnect and create new one
  if (prisma && !isConnected) {
    try {
      await prisma.$disconnect();
    } catch (disconnectError) {
      // Ignore disconnect errors
    }
    prisma = null;
    lastError = null;
  }

  // Create new client if needed
  if (!prisma) {
    try {
      // Create PostgreSQL pool for the adapter
      // Enhanced configuration for production (Neon database)
      const poolConfig = {
        connectionString: process.env.DATABASE_URL,
        // Connection pool settings optimized for Neon
        max: process.env.DATABASE_POOL_MAX ? parseInt(process.env.DATABASE_POOL_MAX) : 10,
        min: process.env.DATABASE_POOL_MIN ? parseInt(process.env.DATABASE_POOL_MIN) : 2,
        // Connection timeout (in milliseconds)
        connectionTimeoutMillis: process.env.NODE_ENV === 'production' ? 10000 : 5000,
        // Idle timeout - close idle clients after 30 seconds
        idleTimeoutMillis: 30000,
        // SSL is handled by connection string parameters (sslmode=require)
        // But we can also set it explicitly if needed
        ssl: process.env.DATABASE_URL?.includes('sslmode=require') ? { rejectUnauthorized: true } : undefined,
      };
      
      const pool = new Pool(poolConfig);
      
      // Create Prisma adapter
      const adapter = new PrismaPg(pool);
      
      // Prisma client configuration with adapter
      const prismaOptions = {
        adapter: adapter,
        log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
      };
      
      prisma = new PrismaClientClass(prismaOptions);
    } catch (createError) {
      const errorMessage = createError.message || String(createError);
      console.error('❌ Failed to create Prisma client:', errorMessage);
      
      // Categorize the creation error
      const categorized = categorizeError(createError);
      lastError = {
        ...categorized,
        timestamp: new Date().toISOString(),
        originalError: errorMessage,
        databaseUrlSet: dbUrlCheck.isSet,
      };
      isConnected = false;
      
      // Don't throw - allow fallback to memory-only mode
      return null;
    }
  }

  // Test connection with timeout
  try {
    await Promise.race([
      prisma.$connect(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), CONNECTION_TIMEOUT)
      )
    ]);
    isConnected = true;
    lastError = null;
    console.log('✅ Prisma client connected to database');
  } catch (error) {
    const categorized = categorizeError(error);
    lastError = {
      ...categorized,
      timestamp: new Date().toISOString(),
      originalError: error.message,
      databaseUrlSet: true,
    };
    isConnected = false;
    console.error(`❌ Failed to connect to database [${categorized.category}]:`, categorized.message);
    console.error(`   Hint: ${categorized.hint}`);
    console.error(`   Original error: ${error.message}`);
    console.error(`   Error stack: ${error.stack}`);
    // Don't throw - allow fallback to memory-only mode
  }

  return prisma;
}

/**
 * Get Prisma client instance
 */
async function getPrisma() {
  if (!prisma) {
    await initPrisma();
  }
  return prisma;
}

/**
 * Check database health with detailed diagnostics
 */
async function checkHealth() {
  const dbUrlCheck = checkDatabaseUrl();
  
  // If not connected, return detailed error info
  if (!isConnected) {
    if (lastError) {
      return {
        healthy: false,
        category: lastError.category,
        error: lastError.message,
        hint: lastError.hint,
        timestamp: lastError.timestamp,
        databaseUrlSet: dbUrlCheck.isSet,
        databaseUrlMasked: dbUrlCheck.masked,
      };
    }
    
    // Try to initialize if not already attempted
    try {
      const result = await initPrisma();
      
      // If initPrisma returned null, it means client creation failed
      if (!result && lastError) {
        return {
          healthy: false,
          category: lastError.category,
          error: lastError.message,
          hint: lastError.hint,
          timestamp: lastError.timestamp,
          databaseUrlSet: dbUrlCheck.isSet,
          databaseUrlMasked: dbUrlCheck.masked,
          originalError: lastError.originalError,
        };
      }
      
      if (isConnected) {
        return { healthy: true };
      }
      
      // Check lastError after initialization attempt
      if (lastError) {
        return {
          healthy: false,
          category: lastError.category,
          error: lastError.message,
          hint: lastError.hint,
          timestamp: lastError.timestamp,
          databaseUrlSet: dbUrlCheck.isSet,
          databaseUrlMasked: dbUrlCheck.masked,
          originalError: lastError.originalError,
        };
      }
    } catch (error) {
      // Categorize and store the error
      const categorized = categorizeError(error);
      lastError = {
        ...categorized,
        timestamp: new Date().toISOString(),
        originalError: error.message,
        databaseUrlSet: dbUrlCheck.isSet,
      };
      return {
        healthy: false,
        category: categorized.category,
        error: categorized.message,
        hint: categorized.hint,
        timestamp: lastError.timestamp,
        databaseUrlSet: dbUrlCheck.isSet,
        databaseUrlMasked: dbUrlCheck.masked,
        originalError: error.message,
      };
    }
    
    return {
      healthy: false,
      category: 'NOT_CONNECTED',
      error: 'Not connected to database',
      hint: 'Database connection was not established',
      databaseUrlSet: dbUrlCheck.isSet,
      databaseUrlMasked: dbUrlCheck.masked,
    };
  }
  
  // Test connection with query
  try {
    const client = await getPrisma();
    if (!client) {
      return {
        healthy: false,
        category: 'PRISMA_CLIENT_ERROR',
        error: 'Prisma client not available',
        hint: 'Run: npx prisma generate',
        databaseUrlSet: dbUrlCheck.isSet,
        databaseUrlMasked: dbUrlCheck.masked,
      };
    }
    
    await client.$queryRaw`SELECT 1`;
    return { 
      healthy: true,
      databaseUrlSet: dbUrlCheck.isSet,
    };
  } catch (error) {
    const categorized = categorizeError(error);
    return {
      healthy: false,
      category: categorized.category,
      error: categorized.message,
      hint: categorized.hint,
      originalError: error.message,
      databaseUrlSet: dbUrlCheck.isSet,
      databaseUrlMasked: dbUrlCheck.masked,
    };
  }
}

/**
 * Disconnect Prisma client
 */
async function disconnect() {
  if (prisma) {
    try {
      await prisma.$disconnect();
      isConnected = false;
      console.log('Prisma client disconnected');
    } catch (error) {
      console.error('Error disconnecting Prisma:', error);
    }
  }
}

module.exports = {
  getPrisma,
  checkHealth,
  disconnect,
  isConnected: () => isConnected,
  getLastError: () => lastError,
  checkDatabaseUrl,
};

