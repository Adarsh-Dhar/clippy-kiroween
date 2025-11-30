const express = require('express');
const { lintCode } = require('../services/lintingService');

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

module.exports = router;
