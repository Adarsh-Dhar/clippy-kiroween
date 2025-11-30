/**
 * Parse eslint JSON output into standardized format
 * @param {string} stdout - Standard output from eslint
 * @param {string} stderr - Standard error from eslint
 * @returns {Array<{line: number, message: string}>}
 */
function parseEslintOutput(stdout, stderr) {
  try {
    // ESLint outputs JSON format when --format=json is used
    if (!stdout || stdout.trim() === '') {
      return [];
    }

    const results = JSON.parse(stdout);
    const allMessages = [];

    // ESLint returns an array of file results
    for (const fileResult of results) {
      if (fileResult.messages && Array.isArray(fileResult.messages)) {
        for (const msg of fileResult.messages) {
          // Include both fatal parsing errors and regular errors (severity === 2)
          // ESLint severity: 0 = off, 1 = warning, 2 = error
          // fatal: true means it's a parsing error
          if (msg.severity === 2 || msg.fatal === true) {
            allMessages.push({
              line: msg.line || 0,
              message: msg.fatal ? `Syntax Error: ${msg.message}` : `${msg.message} (${msg.ruleId || 'unknown'})`
            });
          }
        }
      }
    }

    return allMessages;
  } catch (error) {
    console.error('Error parsing eslint output:', error);
    throw new Error(`Failed to parse eslint output: ${error.message}`);
  }
}

module.exports = {
  parseEslintOutput
};
