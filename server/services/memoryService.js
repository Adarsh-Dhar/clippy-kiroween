/**
 * Memory Service - Server-side database operations
 * 
 * Handles all Prisma database operations for Clippy's memory system
 */

const { getPrisma } = require('../utils/prismaClient');

/**
 * Get or create user by userId
 */
async function getOrCreateUser(userId) {
  const prisma = await getPrisma();
  
  let user = await prisma.user.findUnique({
    where: { userId },
  });

  if (!user) {
    user = await prisma.user.create({
      data: { userId },
    });
  }

  return user;
}

/**
 * Record a mistake (upsert logic)
 */
async function recordMistake(userId, mistakeData) {
  const prisma = await getPrisma();
  const user = await getOrCreateUser(userId);

  // Find existing mistake
  const existing = await prisma.mistakeRecord.findFirst({
    where: {
      userId: user.id,
      errorType: mistakeData.errorType,
      file: mistakeData.file,
      line: mistakeData.line,
    },
  });

  if (existing) {
    // Update count and timestamp
    return await prisma.mistakeRecord.update({
      where: { id: existing.id },
      data: {
        count: { increment: 1 },
        timestamp: new Date(),
      },
    });
  } else {
    // Create new mistake
    return await prisma.mistakeRecord.create({
      data: {
        userId: user.id,
        errorType: mistakeData.errorType,
        message: mistakeData.message,
        file: mistakeData.file,
        line: mistakeData.line,
        count: 1,
      },
    });
  }
}

/**
 * Get common mistakes (count >= 3)
 */
async function getCommonMistakes(userId) {
  const prisma = await getPrisma();
  const user = await getOrCreateUser(userId);

  return await prisma.mistakeRecord.findMany({
    where: {
      userId: user.id,
      count: { gte: 3 },
    },
    orderBy: { count: 'desc' },
    take: 100,
  });
}

/**
 * Get mistake count for error type
 */
async function getMistakeCount(userId, errorType) {
  const prisma = await getPrisma();
  const user = await getOrCreateUser(userId);

  const result = await prisma.mistakeRecord.aggregate({
    where: {
      userId: user.id,
      errorType,
    },
    _sum: { count: true },
  });

  return result._sum.count || 0;
}

/**
 * Get all mistakes, optionally filtered
 */
async function getMistakes(userId, errorType = null) {
  const prisma = await getPrisma();
  const user = await getOrCreateUser(userId);

  return await prisma.mistakeRecord.findMany({
    where: {
      userId: user.id,
      ...(errorType && { errorType }),
    },
    orderBy: { timestamp: 'desc' },
    take: 100,
  });
}

/**
 * Analyze and save code patterns (upsert)
 */
async function analyzeCodePatterns(userId, patterns) {
  const prisma = await getPrisma();
  const user = await getOrCreateUser(userId);

  const operations = patterns.map(async (pattern) => {
    const existing = await prisma.codePattern.findFirst({
      where: {
        userId: user.id,
        name: pattern.name,
      },
    });

    if (existing) {
      // Update frequency and lastSeen
      return await prisma.codePattern.update({
        where: { id: existing.id },
        data: {
          frequency: Math.round((existing.frequency + pattern.frequency) / 2),
          lastSeen: new Date(),
          examples: {
            set: [...new Set([...existing.examples, ...pattern.examples])].slice(0, 5),
          },
        },
      });
    } else {
      // Create new pattern
      return await prisma.codePattern.create({
        data: {
          userId: user.id,
          name: pattern.name,
          description: pattern.description,
          frequency: pattern.frequency,
          examples: pattern.examples || [],
        },
      });
    }
  });

  await Promise.all(operations);
}

/**
 * Get favorite patterns (frequency > 50)
 */
async function getFavoritePatterns(userId) {
  const prisma = await getPrisma();
  const user = await getOrCreateUser(userId);

  return await prisma.codePattern.findMany({
    where: {
      userId: user.id,
      frequency: { gt: 50 },
    },
    orderBy: { frequency: 'desc' },
    take: 20,
  });
}

/**
 * Get all patterns
 */
async function getPatterns(userId) {
  const prisma = await getPrisma();
  const user = await getOrCreateUser(userId);

  return await prisma.codePattern.findMany({
    where: { userId: user.id },
    orderBy: { frequency: 'desc' },
    take: 20,
  });
}

/**
 * Record an interaction
 */
async function recordInteraction(userId, interactionData) {
  const prisma = await getPrisma();
  const user = await getOrCreateUser(userId);

  return await prisma.interactionRecord.create({
    data: {
      userId: user.id,
      type: interactionData.type,
      message: interactionData.message,
      angerLevel: interactionData.context?.angerLevel,
      errorCount: interactionData.context?.errorCount,
    },
  });
}

/**
 * Get recent interactions
 */
async function getRecentInteractions(userId, limit = 10) {
  const prisma = await getPrisma();
  const user = await getOrCreateUser(userId);

  return await prisma.interactionRecord.findMany({
    where: { userId: user.id },
    orderBy: { timestamp: 'desc' },
    take: limit,
  });
}

/**
 * Get interactions by type
 */
async function getInteractionsByType(userId, type) {
  const prisma = await getPrisma();
  const user = await getOrCreateUser(userId);

  return await prisma.interactionRecord.findMany({
    where: {
      userId: user.id,
      type,
    },
    orderBy: { timestamp: 'desc' },
    take: 50,
  });
}

/**
 * Record anger change and update stats
 */
async function recordAngerChange(userId, level, trigger = null) {
  const prisma = await getPrisma();
  const user = await getOrCreateUser(userId);

  // Create anger event
  await prisma.angerEvent.create({
    data: {
      userId: user.id,
      level,
      trigger,
    },
  });

  // Update or create anger stats
  const stats = await prisma.angerStats.findUnique({
    where: { userId: user.id },
  });

  const levelCounts = stats?.levelCounts || { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  levelCounts[level] = (levelCounts[level] || 0) + 1;

  const totalEvents = Object.values(levelCounts).reduce((a, b) => a + b, 0);
  const weightedSum = Object.entries(levelCounts).reduce(
    (sum, [l, count]) => sum + (parseInt(l) * count),
    0
  );
  const averageLevel = totalEvents > 0 ? weightedSum / totalEvents : 0;

  const highestLevel = Math.max(
    stats?.highestLevel || 0,
    level
  );

  const totalDeaths = level >= 5
    ? (stats?.totalDeaths || 0) + 1
    : (stats?.totalDeaths || 0);

  if (stats) {
    await prisma.angerStats.update({
      where: { userId: user.id },
      data: {
        levelCounts,
        averageLevel,
        highestLevel,
        totalDeaths,
      },
    });
  } else {
    await prisma.angerStats.create({
      data: {
        userId: user.id,
        levelCounts,
        averageLevel,
        highestLevel,
        totalDeaths,
        timeAtLevel: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      },
    });
  }
}

/**
 * Get anger statistics
 */
async function getAngerStats(userId) {
  const prisma = await getPrisma();
  const user = await getOrCreateUser(userId);

  let stats = await prisma.angerStats.findUnique({
    where: { userId: user.id },
  });

  if (!stats) {
    // Create default stats
    stats = await prisma.angerStats.create({
      data: {
        userId: user.id,
        levelCounts: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        timeAtLevel: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        totalDeaths: 0,
        highestLevel: 0,
        averageLevel: 0,
      },
    });
  }

  return {
    totalDeaths: stats.totalDeaths,
    highestLevel: stats.highestLevel,
    averageLevel: stats.averageLevel,
    levelCounts: stats.levelCounts,
    timeAtLevel: stats.timeAtLevel,
  };
}

/**
 * Get anger history
 */
async function getAngerHistory(userId, limit = null) {
  const prisma = await getPrisma();
  const user = await getOrCreateUser(userId);

  return await prisma.angerEvent.findMany({
    where: { userId: user.id },
    orderBy: { timestamp: 'desc' },
    ...(limit && { take: limit }),
  });
}

/**
 * Get memory summary
 */
async function getSummary(userId) {
  const prisma = await getPrisma();
  const user = await getOrCreateUser(userId);

  const [mistakes, patterns, interactions, stats] = await Promise.all([
    prisma.mistakeRecord.count({ where: { userId: user.id } }),
    prisma.codePattern.count({ where: { userId: user.id } }),
    prisma.interactionRecord.count({ where: { userId: user.id } }),
    prisma.angerStats.findUnique({ where: { userId: user.id } }),
  ]);

  const commonMistakes = await prisma.mistakeRecord.count({
    where: {
      userId: user.id,
      count: { gte: 3 },
    },
  });

  return {
    totalMistakes: mistakes,
    commonMistakes,
    totalPatterns: patterns,
    totalInteractions: interactions,
    totalDeaths: stats?.totalDeaths || 0,
  };
}

/**
 * Reset all user data
 */
async function reset(userId) {
  const prisma = await getPrisma();
  const user = await getOrCreateUser(userId);

  await prisma.$transaction([
    prisma.mistakeRecord.deleteMany({ where: { userId: user.id } }),
    prisma.codePattern.deleteMany({ where: { userId: user.id } }),
    prisma.interactionRecord.deleteMany({ where: { userId: user.id } }),
    prisma.angerEvent.deleteMany({ where: { userId: user.id } }),
    prisma.angerStats.deleteMany({ where: { userId: user.id } }),
  ]);
}

/**
 * Cleanup old data (30 days)
 */
async function cleanupOldData(userId) {
  const prisma = await getPrisma();
  const user = await getOrCreateUser(userId);

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  await prisma.$transaction([
    prisma.mistakeRecord.deleteMany({
      where: {
        userId: user.id,
        timestamp: { lt: thirtyDaysAgo },
      },
    }),
    prisma.codePattern.deleteMany({
      where: {
        userId: user.id,
        lastSeen: { lt: thirtyDaysAgo },
      },
    }),
    prisma.angerEvent.deleteMany({
      where: {
        userId: user.id,
        timestamp: { lt: thirtyDaysAgo },
      },
    }),
  ]);
}

/**
 * Enforce record limits (FIFO)
 */
async function enforceLimits(userId) {
  const prisma = await getPrisma();
  const user = await getOrCreateUser(userId);

  // Get counts
  const [mistakeCount, interactionCount, patternCount, angerCount] = await Promise.all([
    prisma.mistakeRecord.count({ where: { userId: user.id } }),
    prisma.interactionRecord.count({ where: { userId: user.id } }),
    prisma.codePattern.count({ where: { userId: user.id } }),
    prisma.angerEvent.count({ where: { userId: user.id } }),
  ]);

  // Delete oldest if over limit
  if (mistakeCount > 100) {
    const toDelete = await prisma.mistakeRecord.findMany({
      where: { userId: user.id },
      orderBy: { timestamp: 'asc' },
      take: mistakeCount - 100,
      select: { id: true },
    });
    await prisma.mistakeRecord.deleteMany({
      where: { id: { in: toDelete.map(d => d.id) } },
    });
  }

  if (interactionCount > 50) {
    const toDelete = await prisma.interactionRecord.findMany({
      where: { userId: user.id },
      orderBy: { timestamp: 'asc' },
      take: interactionCount - 50,
      select: { id: true },
    });
    await prisma.interactionRecord.deleteMany({
      where: { id: { in: toDelete.map(d => d.id) } },
    });
  }

  if (patternCount > 20) {
    const toDelete = await prisma.codePattern.findMany({
      where: { userId: user.id },
      orderBy: { frequency: 'asc' },
      take: patternCount - 20,
      select: { id: true },
    });
    await prisma.codePattern.deleteMany({
      where: { id: { in: toDelete.map(d => d.id) } },
    });
  }

  if (angerCount > 200) {
    const toDelete = await prisma.angerEvent.findMany({
      where: { userId: user.id },
      orderBy: { timestamp: 'asc' },
      take: angerCount - 200,
      select: { id: true },
    });
    await prisma.angerEvent.deleteMany({
      where: { id: { in: toDelete.map(d => d.id) } },
    });
  }
}

module.exports = {
  getOrCreateUser,
  recordMistake,
  getCommonMistakes,
  getMistakeCount,
  getMistakes,
  analyzeCodePatterns,
  getFavoritePatterns,
  getPatterns,
  recordInteraction,
  getRecentInteractions,
  getInteractionsByType,
  recordAngerChange,
  getAngerStats,
  getAngerHistory,
  getSummary,
  reset,
  cleanupOldData,
  enforceLimits,
};

