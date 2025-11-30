const { createTempFile, deleteTempFile } = require('../utils/fileManager');
const { executeLinter } = require('../utils/cliExecutor');
const { parsePylintOutput } = require('../parsers/pylintParser');
const { parseEslintOutput } = require('../parsers/eslintParser');
const path = require('path');

// Configuration for each supported language
const LINTER_CONFIG = {
  python: {
    extension: '.py',
    command: 'pylint',
    args: [
      '--output-format=json',
      '--errors-only',  // Only show actual errors, ignore all warnings/conventions/refactor
      '--max-line-length=200'  // Very lenient line length
    ],
    parser: parsePylintOutput
  },
  javascript: {
    extension: '.js',
    command: 'eslint',
    args: (() => {
      const configPath = path.join(__dirname, '../.eslintrc.json');
      return [
        '--format=json',
        '--config', configPath  // Use our legacy config file
      ];
    })(),
    parser: parseEslintOutput,
    env: {
      ESLINT_USE_FLAT_CONFIG: 'false'  // Force legacy config format
    }
  }
};

/**
 * Lint code in the specified language
 * @param {string} code - The code to lint
 * @param {string} language - The programming language (python, javascript)
 * @returns {Promise<Array<{line: number, message: string}>>}
 */
async function lintCode(code, language) {
  // Normalize language to lowercase
  const normalizedLanguage = language.toLowerCase();
  
  // Validate language is supported
  const config = LINTER_CONFIG[normalizedLanguage];
  if (!config) {
    throw new Error(`Unsupported language: ${language}. Supported languages are: ${Object.keys(LINTER_CONFIG).join(', ')}`);
  }

  console.log(`Linting ${normalizedLanguage} code with ${config.command}`);

  let filepath = null;

  try {
    // Create temporary file
    filepath = await createTempFile(code, config.extension);

    // Execute linter
    const { stdout, stderr, exitCode } = await executeLinter(
      config.command,
      config.args,
      filepath,
      config.env || {}
    );

    // If linter command was not found, return empty results
    if (exitCode === 127) {
      return [];
    }

    // Parse output using language-specific parser
    const results = config.parser(stdout, stderr);

    // Ensure we return an array
    return Array.isArray(results) ? results : [];
  } catch (error) {
    // If linter is not installed, return empty array instead of throwing
    if (error.message.includes('not installed') || error.message.includes('not found')) {
      // Silently return empty results for missing linters
      return [];
    }
    
    console.error(`Error linting ${normalizedLanguage} code:`, error.message);
    throw error;
  } finally {
    // Always clean up temporary file
    if (filepath) {
      await deleteTempFile(filepath);
    }
  }
}

module.exports = {
  lintCode
};
