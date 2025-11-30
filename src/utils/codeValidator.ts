import { JSHINT } from 'jshint';

export interface ValidationError {
  line: number;
  reason: string;
}

export function validateCode(codeString: string): ValidationError[] {
  try {
    const jshintConfig = {
      asi: false,        // Require semicolons
      unused: true,      // Check for unused variables and functions
      undef: true,       // Disallow undefined variables
      esversion: 6,      // Support ES6 syntax
      browser: true,     // Browser environment
      devel: true        // Allow console, alert, etc.
    };

    JSHINT(codeString, jshintConfig);

    if (!JSHINT.errors) {
      return [];
    }

    const lines = codeString.split('\n');
    
    return JSHINT.errors
      .filter(error => error !== null)
      // Filter out "unused" errors for functions - only flag unused variables
      // Functions are commonly defined without immediate calls in code editors
      .filter(error => {
        const reason = error.reason?.toLowerCase() || '';
        if (reason.includes('unused') || reason.includes('never used')) {
          // Check if the line with the error defines a function
          const errorLine = lines[error.line - 1] || '';
          const trimmedLine = errorLine.trim();
          // If the line starts with 'function' or contains 'function' keyword, it's a function definition
          if (trimmedLine.startsWith('function ') || 
              trimmedLine.startsWith('async function ') ||
              /^\s*(const|let|var)\s+\w+\s*=\s*(async\s+)?function/.test(trimmedLine) ||
              /^\s*(const|let|var)\s+\w+\s*=\s*\(/.test(trimmedLine)) {
            return false; // Filter out unused function warnings
          }
        }
        return true;
      })
      .map(error => ({
        line: error.line,
        reason: error.reason
      }));
  } catch (error) {
    console.error('Code validation error:', error);
    return [];
  }
}
