/**
 * Detect programming language from code patterns
 * @param code - The code to analyze
 * @returns The detected language: 'python' or 'javascript' (default)
 */
export function detectLanguage(code: string): string {
  if (!code || code.trim().length === 0) {
    return 'javascript'; // Default to JavaScript for empty code
  }

  const trimmedCode = code.trim();
  
  // Quick check for obvious Python indicators in the raw code (including comments)
  if (/#.*python/i.test(trimmedCode) || /#.*demo.*python/i.test(trimmedCode)) {
    return 'python';
  }

  const lines = code.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  if (lines.length === 0) {
    return 'javascript';
  }

  // Check first few non-empty lines for language-specific patterns
  // Also check all lines to catch patterns even after comments
  const firstLines = lines.slice(0, 10).join('\n');
  const allLines = lines.join('\n');

  // Python detection patterns (more specific, check first)
  // Check in both firstLines and allLines to catch patterns after comments
  const pythonPatterns = [
    /\bdef\s+\w+\s*\(/,           // def function_name( (anywhere in line)
    /^def\s+\w+\s*\(/,            // def function_name( (start of line)
    /\bimport\s+\w+/,             // import module (anywhere)
    /^import\s+\w+/,              // import module (start of line)
    /\bfrom\s+\w+\s+import/,      // from module import
    /^from\s+\w+\s+import/,       // from module import (start)
    /\bclass\s+\w+.*:/,           // class definition with colon
    /^class\s+\w+.*:/,            // class definition (start)
    /\bif\s+__name__\s*==/,       // if __name__ == '__main__'
    /^\s*#.*python/i,             // Python comment indicator
    /^\s*#.*demo.*python/i,       // Demo Python code comment
    /^\s*#.*---.*python/i,        // Comment with --- Python pattern
    /\b@\w+/,                     // Python decorator
    /\basync\s+def\s+\w+/,        // async def
    /\bwith\s+\w+\s+as/,          // with statement
    /\bexcept\s+\w+:/,            // except clause
    /\belif\s+/,                  // elif statement
    /\blambda\s+/,                // lambda expression
    /\bprint\s*\(/,               // print() function
    /\bf\s*"[^"]*"/,              // f-string
    /\bf\s*'[^']*'/,              // f-string with single quotes
  ];


  // JavaScript detection patterns (more specific to avoid false positives)
  const javascriptPatterns = [
    /^function\s+\w+\s*\(/,       // function name(
    /^const\s+\w+\s*=\s*\(/,      // const name = (
    /^const\s+\w+\s*=\s*=>/,      // const name = =>
    /^let\s+\w+\s*=\s*\(/,        // let name = (
    /^let\s+\w+\s*=\s*=>/,        // let name = =>
    /^var\s+\w+\s*=\s*function/,  // var name = function
    /^export\s+(default\s+)?(function|const|let|class)/, // ES6 export
    /^import\s+.*from\s+['"]/,    // ES6 import ... from
    /^console\.(log|error|warn|info)/, // console methods
    /=>\s*{/,                     // arrow function
    /^\s*\/\/.*javascript/i,      // JavaScript comment indicator
    /^\s*\/\*.*javascript/i,      // JavaScript block comment
    /document\.(getElementById|querySelector)/, // DOM API
    /window\.(location|localStorage|sessionStorage)/, // Window API
    /require\s*\(/,               // CommonJS require
    /module\.exports/,             // CommonJS exports
  ];

  // Check lines for Python patterns FIRST (most specific, check aggressively)
  // Check both first lines and all lines to catch patterns after comments
  let pythonScore = 0;
  for (const pattern of pythonPatterns) {
    if (pattern.test(firstLines) || pattern.test(allLines)) {
      pythonScore++;
      // If we find strong Python indicators, return immediately
      if (pattern.source.includes('def') || pattern.source.includes('class') || pattern.source.includes('import') || pattern.source.includes('python')) {
        return 'python';
      }
    }
  }
  
  // If we found multiple Python patterns, it's definitely Python
  if (pythonScore >= 2) {
    return 'python';
  }

  // Check for JavaScript patterns (less specific, but still useful)
  let jsScore = 0;
  for (const pattern of javascriptPatterns) {
    if (pattern.test(firstLines)) {
      jsScore++;
    }
  }

  // If we found clear JavaScript patterns, return JavaScript
  if (jsScore >= 2) {
    return 'javascript';
  }

  // Check for common JavaScript keywords that might appear in other languages
  // but are more likely JavaScript
  const jsKeywords = /\b(console|document|window|require|module\.exports|export|import\s+.*from)\b/;
  if (jsKeywords.test(firstLines)) {
    return 'javascript';
  }

  // Default to JavaScript for backward compatibility
  // Most code snippets without clear patterns are likely JavaScript
  return 'javascript';
}

