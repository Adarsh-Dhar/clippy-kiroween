/**
 * Parse pylint JSON output into standardized format
 * @param {string} stdout - Standard output from pylint
 * @param {string} stderr - Standard error from pylint
 * @returns {Array<{line: number, message: string}>}
 */
function parsePylintOutput(stdout, stderr) {
  try {
    // Pylint outputs JSON format when --output-format=json is used
    if (!stdout || stdout.trim() === '') {
      return [];
    }

    const results = JSON.parse(stdout);
    
    // If results is not an array, return empty (pylint might return object with messages array)
    if (!Array.isArray(results)) {
      if (results.messages && Array.isArray(results.messages)) {
        return parsePylintOutput(JSON.stringify(results.messages), stderr);
      }
      return [];
    }
    
    // Filter to only show actual errors (type: 'error' or 'fatal')
    // Be very strict - only include if we're 100% sure it's an error
    const errorsOnly = results.filter(error => {
      // Check multiple fields for error type
      const type = (error.type || '').toLowerCase();
      const messageId = (error['message-id'] || '').toUpperCase();
      const symbol = (error.symbol || '').toUpperCase();
      
      // Pylint message types: E=error, F=fatal, W=warning, C=convention, R=refactor
      // Only include if it's clearly an error or fatal
      const isErrorType = type === 'error' || type === 'fatal';
      const isErrorById = messageId && (messageId.startsWith('E') || messageId.startsWith('F'));
      const isErrorBySymbol = symbol && (symbol.charAt(0) === 'E' || symbol.charAt(0) === 'F');
      
      // Exclude anything that looks like a warning, convention, or refactor
      const isWarning = type === 'warning' || messageId.startsWith('W') || symbol.charAt(0) === 'W';
      const isConvention = type === 'convention' || messageId.startsWith('C') || symbol.charAt(0) === 'C';
      const isRefactor = type === 'refactor' || messageId.startsWith('R') || symbol.charAt(0) === 'R';
      
      // Only include if it's an error AND not a warning/convention/refactor
      return (isErrorType || isErrorById || isErrorBySymbol) && !isWarning && !isConvention && !isRefactor;
    });
    
    // Pylint returns an array of error objects
    return errorsOnly.map(error => ({
      line: error.line || 0,
      message: `${error.message} (${error['message-id'] || error.symbol || ''})`
    }));
  } catch (error) {
    console.error('Error parsing pylint output:', error);
    // If parsing fails, return empty array instead of throwing (graceful degradation)
    return [];
  }
}

module.exports = {
  parsePylintOutput
};
