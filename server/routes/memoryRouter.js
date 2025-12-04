/**
 * Memory API Routes
 * 
 * REST API endpoints for Clippy's memory system
 */

const express = require('express');
const router = express.Router();
const memoryService = require('../services/memoryService');
const { checkHealth } = require('../utils/prismaClient');

// Health check middleware
async function checkDatabaseHealth(req, res, next) {
  const health = await checkHealth();
  if (!health.healthy) {
    return res.status(503).json({
      error: 'Database unavailable',
      details: health.error,
    });
  }
  next();
}

/**
 * POST /api/memory/migrate
 * Migrate localStorage data to database
 */
router.post('/migrate', checkDatabaseHealth, async (req, res) => {
  try {
    const { userId, mistakes, patterns, interactions, angerHistory, angerStats, createdAt } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const prisma = await require('../utils/prismaClient').getPrisma();
    const user = await memoryService.getOrCreateUser(userId);

    // Wrap in transaction
    const result = await prisma.$transaction(async (tx) => {
      let mistakesMigrated = 0;
      let patternsMigrated = 0;
      let interactionsMigrated = 0;
      let angerEventsMigrated = 0;

      // Migrate mistakes
      if (mistakes && Array.isArray(mistakes)) {
        for (const mistake of mistakes) {
          const existing = await tx.mistakeRecord.findFirst({
            where: {
              userId: user.id,
              errorType: mistake.errorType,
              file: mistake.location?.file || mistake.file,
              line: mistake.location?.line || mistake.line,
            },
          });

          if (existing) {
            await tx.mistakeRecord.update({
              where: { id: existing.id },
              data: {
                count: existing.count + (mistake.count || 1),
                timestamp: new Date(mistake.timestamp || Date.now()),
              },
            });
          } else {
            await tx.mistakeRecord.create({
              data: {
                userId: user.id,
                errorType: mistake.errorType,
                message: mistake.message,
                file: mistake.location?.file || mistake.file,
                line: mistake.location?.line || mistake.line,
                count: mistake.count || 1,
                timestamp: new Date(mistake.timestamp || Date.now()),
              },
            });
          }
          mistakesMigrated++;
        }
      }

      // Migrate patterns
      if (patterns && Array.isArray(patterns)) {
        for (const pattern of patterns) {
          const existing = await tx.codePattern.findFirst({
            where: {
              userId: user.id,
              name: pattern.name,
            },
          });

          if (existing) {
            await tx.codePattern.update({
              where: { id: existing.id },
              data: {
                frequency: Math.round((existing.frequency + pattern.frequency) / 2),
                lastSeen: new Date(pattern.lastSeen || Date.now()),
                examples: {
                  set: [...new Set([...existing.examples, ...(pattern.examples || [])])].slice(0, 5),
                },
              },
            });
          } else {
            await tx.codePattern.create({
              data: {
                userId: user.id,
                name: pattern.name,
                description: pattern.description || '',
                frequency: pattern.frequency || 0,
                examples: pattern.examples || [],
                lastSeen: new Date(pattern.lastSeen || Date.now()),
              },
            });
          }
          patternsMigrated++;
        }
      }

      // Migrate interactions
      if (interactions && Array.isArray(interactions)) {
        for (const interaction of interactions) {
          await tx.interactionRecord.create({
            data: {
              userId: user.id,
              type: interaction.type,
              message: interaction.message,
              angerLevel: interaction.context?.angerLevel,
              errorCount: interaction.context?.errorCount,
              timestamp: new Date(interaction.timestamp || Date.now()),
            },
          });
          interactionsMigrated++;
        }
      }

      // Migrate anger events
      if (angerHistory && Array.isArray(angerHistory)) {
        for (const event of angerHistory) {
          await tx.angerEvent.create({
            data: {
              userId: user.id,
              level: event.level,
              trigger: event.trigger,
              timestamp: new Date(event.timestamp || Date.now()),
            },
          });
          angerEventsMigrated++;
        }
      }

      // Migrate anger stats
      if (angerStats) {
        const existing = await tx.angerStats.findUnique({
          where: { userId: user.id },
        });

        if (existing) {
          await tx.angerStats.update({
            where: { userId: user.id },
            data: {
              totalDeaths: Math.max(existing.totalDeaths, angerStats.totalDeaths || 0),
              highestLevel: Math.max(existing.highestLevel, angerStats.highestLevel || 0),
              averageLevel: angerStats.averageLevel || existing.averageLevel,
              levelCounts: angerStats.levelCounts || existing.levelCounts,
              timeAtLevel: angerStats.timeAtLevel || existing.timeAtLevel,
            },
          });
        } else {
          await tx.angerStats.create({
            data: {
              userId: user.id,
              totalDeaths: angerStats.totalDeaths || 0,
              highestLevel: angerStats.highestLevel || 0,
              averageLevel: angerStats.averageLevel || 0,
              levelCounts: angerStats.levelCounts || { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
              timeAtLevel: angerStats.timeAtLevel || { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
            },
          });
        }
      }

      return {
        mistakesMigrated,
        patternsMigrated,
        interactionsMigrated,
        angerEventsMigrated,
      };
    });

    res.json({
      success: true,
      recordsMigrated: result,
    });
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      recordsMigrated: { mistakes: 0, patterns: 0, interactions: 0, angerEvents: 0 },
    });
  }
});

/**
 * POST /api/memory/mistakes
 * Record a mistake
 */
router.post('/mistakes', checkDatabaseHealth, async (req, res) => {
  try {
    const { userId, errorType, message, file, line } = req.body;
    if (!userId || !errorType || !message || !file || line === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await memoryService.recordMistake(userId, { errorType, message, file, line });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/memory/mistakes
 * Get mistakes (optionally filtered by errorType)
 */
router.get('/mistakes', checkDatabaseHealth, async (req, res) => {
  try {
    const { userId, errorType } = req.query;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const mistakes = await memoryService.getMistakes(userId, errorType || null);
    res.json(mistakes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/memory/mistakes/common
 * Get common mistakes (count >= 3)
 */
router.get('/mistakes/common', checkDatabaseHealth, async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const mistakes = await memoryService.getCommonMistakes(userId);
    res.json(mistakes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/memory/mistakes/count
 * Get mistake count for error type
 */
router.get('/mistakes/count', checkDatabaseHealth, async (req, res) => {
  try {
    const { userId, errorType } = req.query;
    if (!userId || !errorType) {
      return res.status(400).json({ error: 'userId and errorType are required' });
    }

    const count = await memoryService.getMistakeCount(userId, errorType);
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/memory/patterns
 * Analyze and save code patterns
 */
router.post('/patterns', checkDatabaseHealth, async (req, res) => {
  try {
    const { userId, patterns } = req.body;
    if (!userId || !patterns || !Array.isArray(patterns)) {
      return res.status(400).json({ error: 'userId and patterns array are required' });
    }

    await memoryService.analyzeCodePatterns(userId, patterns);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/memory/patterns
 * Get all patterns
 */
router.get('/patterns', checkDatabaseHealth, async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const patterns = await memoryService.getPatterns(userId);
    res.json(patterns);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/memory/patterns/favorite
 * Get favorite patterns (frequency > 50)
 */
router.get('/patterns/favorite', checkDatabaseHealth, async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const patterns = await memoryService.getFavoritePatterns(userId);
    res.json(patterns);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/memory/interactions
 * Record an interaction
 */
router.post('/interactions', checkDatabaseHealth, async (req, res) => {
  try {
    const { userId, type, message, context } = req.body;
    if (!userId || !type || !message) {
      return res.status(400).json({ error: 'userId, type, and message are required' });
    }

    const result = await memoryService.recordInteraction(userId, { type, message, context });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/memory/interactions
 * Get interactions (optionally filtered by type)
 */
router.get('/interactions', checkDatabaseHealth, async (req, res) => {
  try {
    const { userId, type, limit } = req.query;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    let interactions;
    if (type) {
      interactions = await memoryService.getInteractionsByType(userId, type);
    } else {
      interactions = await memoryService.getRecentInteractions(userId, limit ? parseInt(limit) : 10);
    }

    res.json(interactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/memory/anger
 * Record anger change
 */
router.post('/anger', checkDatabaseHealth, async (req, res) => {
  try {
    const { userId, level, trigger } = req.body;
    if (!userId || level === undefined) {
      return res.status(400).json({ error: 'userId and level are required' });
    }

    await memoryService.recordAngerChange(userId, level, trigger || null);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/memory/anger/stats
 * Get anger statistics
 */
router.get('/anger/stats', checkDatabaseHealth, async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const stats = await memoryService.getAngerStats(userId);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/memory/anger/history
 * Get anger history
 */
router.get('/anger/history', checkDatabaseHealth, async (req, res) => {
  try {
    const { userId, limit } = req.query;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const history = await memoryService.getAngerHistory(userId, limit ? parseInt(limit) : null);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/memory/summary
 * Get memory summary
 */
router.get('/summary', checkDatabaseHealth, async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const summary = await memoryService.getSummary(userId);
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/memory/reset
 * Reset all user data
 */
router.post('/reset', checkDatabaseHealth, async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    await memoryService.reset(userId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/memory/cleanup
 * Cleanup old data
 */
router.post('/cleanup', checkDatabaseHealth, async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    await memoryService.cleanupOldData(userId);
    await memoryService.enforceLimits(userId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

