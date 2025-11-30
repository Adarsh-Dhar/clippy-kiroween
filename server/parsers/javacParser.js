/**
 * Parse javac output into standardized format
 * @param {string} stdout - Standard output from javac
 * @param {string} stderr - Standard error from javac
 * @returns {Array<{line: number, message: string}>}
 */
function parseJavacOutput(stdout, stderr) {
  try {
    // javac outputs errors to stderr
    return parseJavacTextOutput(stderr);
  } catch (error) {
    console.error('Error parsing javac output:', error);
    return [];
  }
}

/**
 * Parse javac text output from stderr
 * Format: Filename.java:line: error: message
 * @param {string} stderr - Text output from javac stderr
 * @returns {Array<{line: number, message: string}>}
 */
function parseJavacTextOutput(stderr) {
  if (!stderr || stderr.trim() === '') {
    return [];
  }

  const results = [];
  const lines = stderr.split('\n');
  
  for (const line of lines) {
    // Match pattern: Filename.java:line: error: message
    // Example: Main.java:5: error: ';' expected
    const match = line.match(/\w+\.java:(\d+):\s+(error|warning):\s+(.+)$/);
    
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
  parseJavacOutput
};
