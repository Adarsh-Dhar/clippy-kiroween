/**
 * Parse gcc output into standardized format
 * Supports both JSON format (GCC 9.0+) and text format (fallback)
 * @param {string} stdout - Standard output from gcc
 * @param {string} stderr - Standard error from gcc
 * @returns {Array<{line: number, message: string}>}
 */
function parseGccOutput(stdout, stderr) {
  try {
    // Try parsing JSON format first (if -fdiagnostics-format=json is supported)
    if (stdout && stdout.trim().startsWith('[')) {
      return parseGccJsonOutput(stdout);
    }
    
    // Fallback to text parsing from stderr
    return parseGccTextOutput(stderr);
  } catch (error) {
    console.error('Error parsing gcc output:', error);
    // If JSON parsing fails, try text parsing as fallback
    if (stderr) {
      return parseGccTextOutput(stderr);
    }
    return [];
  }
}

/**
 * Parse gcc JSON diagnostic output
 * @param {string} jsonOutput - JSON output from gcc
 * @returns {Array<{line: number, message: string}>}
 */
function parseGccJsonOutput(jsonOutput) {
  const diagnostics = JSON.parse(jsonOutput);
  const results = [];

  for (const diagnostic of diagnostics) {
    // GCC JSON format has nested structure
    if (diagnostic.kind === 'error' || diagnostic.kind === 'warning') {
      const location = diagnostic.locations?.[0]?.caret || {};
      const line = location.line || 0;
      const message = diagnostic.message || '';
      
      results.push({
        line,
        message: `${diagnostic.kind}: ${message}`
      });
    }
  }

  return results;
}

/**
 * Parse gcc text output from stderr
 * Format: filename:line:col: error: message
 * @param {string} stderr - Text output from gcc stderr
 * @returns {Array<{line: number, message: string}>}
 */
function parseGccTextOutput(stderr) {
  if (!stderr || stderr.trim() === '') {
    return [];
  }

  const results = [];
  const lines = stderr.split('\n');
  
  for (const line of lines) {
    // Match pattern: filename:line:col: error: message
    // Example: /tmp/test.c:5:5: error: expected ')'
    const match = line.match(/^[^:]+:(\d+):\d+:\s+(error|warning):\s+(.+)$/);
    
    if (match) {
      const lineNum = parseInt(match[1], 10);
      const type = match[2];
      const message = match[3].trim();
      
      results.push({
        line: lineNum,
        message: `${type}: ${message}`
      });
    }
  }

  return results;
}

module.exports = {
  parseGccOutput
};
