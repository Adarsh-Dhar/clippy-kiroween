const express = require('express');
const { lintCode } = require('../services/lintingService');
const { lintAndRoast } = require('../services/roastingService');

const router = express.Router();

/**
 * POST /lint
 * Lint code in the specified language
 */
router.post('/lint', async (req, res) => {
  try {
    const { code, language } = req.body;

    // Validate required fields
    if (!code) {
      return res.status(400).json({
        error: 'Missing required field: code'
      });
    }

    if (!language) {
      return res.status(400).json({
        error: 'Missing required field: language'
      });
    }

    // Call linting service
    const results = await lintCode(code, language);

    // Return results
    res.status(200).json({
      results
    });
  } catch (error) {
    // Check if it's a validation error (unsupported language)
    if (error.message.includes('Unsupported language')) {
      return res.status(400).json({
        error: error.message
      });
    }

    // Check if it's a linter not installed error - return empty results instead of error
    if (error.message.includes('not installed') || error.message.includes('not found')) {
      console.warn(`Linter not available: ${error.message}. Returning empty results.`);
      return res.status(200).json({
        results: []
      });
    }

    // Check if it's a parsing error
    if (error.message.includes('Failed to parse')) {
      return res.status(500).json({
        error: 'Failed to parse linter output',
        details: error.message
      });
    }

    // Generic server error
    console.error('Error in /lint endpoint:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

/**
 * POST /roast
 * Lint code and generate a context-aware roast if errors are found
 */
router.post('/roast', async (req, res) => {
  try {
    const { code, language, userId } = req.body;

    // Validate required fields
    if (!code) {
      return res.status(400).json({
        error: 'Missing required field: code'
      });
    }

    if (!language) {
      return res.status(400).json({
        error: 'Missing required field: language'
      });
    }

    // Call roasting service (lints first, then generates roast if errors exist)
    // userId is optional - if provided, responses will be personalized with memory
    const result = await lintAndRoast(code, language, userId || null);

    // Return result
    res.status(200).json(result);
  } catch (error) {
    // Check if it's a validation error (unsupported language)
    if (error.message.includes('Unsupported language')) {
      return res.status(400).json({
        error: error.message
      });
    }

    // Check if it's a linter not installed error - return clean status
    if (error.message.includes('not installed') || error.message.includes('not found')) {
      console.warn(`Linter not available: ${error.message}. Returning clean status.`);
      return res.status(200).json({
        status: 'clean'
      });
    }

    // Check if it's a Gemini API error - return errors without roast
    if (error.message.includes('Gemini API') || error.message.includes('GEMINI_API_KEY')) {
      console.warn(`Gemini API unavailable: ${error.message}. Returning errors without roast.`);
      // Try to get errors from linting only
      try {
        const { lintCode } = require('../services/lintingService');
        const errors = await lintCode(code, language);
        return res.status(200).json({
          status: errors.length > 0 ? 'error' : 'clean',
          errors: errors.length > 0 ? errors : undefined
        });
      } catch (lintError) {
        return res.status(200).json({
          status: 'clean'
        });
      }
    }

    // Generic server error
    console.error('Error in /roast endpoint:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

module.exports = router;
