/**
 * Prisma Client Wrapper
 * 
 * Singleton Prisma client with connection management and error handling
 */

// Use the generated Prisma client from the root
// Note: Prisma client must be generated before running the server
// Run: npx prisma generate (from project root)
const path = require('path');
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
  console.error('Failed to load Prisma client. Make sure to run "npx prisma generate" from the project root.');
  console.error('Error:', error.message);
  throw error;
}

let prisma = null;
let isConnected = false;
const CONNECTION_TIMEOUT = 2000; // 2 seconds

/**
 * Initialize Prisma client with connection timeout
 */
async function initPrisma() {
  if (prisma) {
    return prisma;
  }

  prisma = new PrismaClientClass({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

  // Test connection with timeout
  try {
    await Promise.race([
      prisma.$connect(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), CONNECTION_TIMEOUT)
      )
    ]);
    isConnected = true;
    console.log('✅ Prisma client connected to database');
  } catch (error) {
    console.error('❌ Failed to connect to database:', error.message);
    isConnected = false;
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
 * Check database health
 */
async function checkHealth() {
  try {
    const client = await getPrisma();
    if (!isConnected) {
      return { healthy: false, error: 'Not connected to database' };
    }
    await client.$queryRaw`SELECT 1`;
    return { healthy: true };
  } catch (error) {
    return { healthy: false, error: error.message };
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
};

