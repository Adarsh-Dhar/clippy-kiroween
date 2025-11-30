import { ValidationError } from './codeValidator';

const API_URL = import.meta.env.VITE_LINT_API_URL || 'http://localhost:3001';

interface BackendLintResult {
  line: number;
  message: string;
}

interface BackendResponse {
  results: BackendLintResult[];
}

/**
 * Lint code using the backend API
 * @param code - The code to lint
 * @param language - The programming language (python, javascript, c, cpp, java)
 * @returns Promise<ValidationError[]> - Array of validation errors
 */
export async function lintCode(code: string, language: string): Promise<ValidationError[]> {
  try {
    // Normalize language to lowercase and validate
    const normalizedLanguage = language.toLowerCase();
    const validLanguages = ['python', 'javascript', 'c', 'cpp', 'java'];
    
    if (!validLanguages.includes(normalizedLanguage)) {
      console.warn(`Invalid language: ${language}, defaulting to javascript`);
      // Default to javascript if invalid language
    }
    
    const finalLanguage = validLanguages.includes(normalizedLanguage) ? normalizedLanguage : 'javascript';
    
    const response = await fetch(`${API_URL}/lint`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code, language: finalLanguage }),
    });

    if (!response.ok) {
      // If backend returns an error, log it and return empty array
      const errorData = await response.json().catch(() => ({}));
      console.error('Linting API error:', response.status, errorData);
      return [];
    }

    const data: BackendResponse = await response.json();
    
    // Map backend response format to ValidationError format
    return data.results.map(result => ({
      line: result.line,
      reason: result.message,
    }));
  } catch (error) {
    // Network errors or other failures - return empty array gracefully
    console.error('Error calling linting API:', error);
    return [];
  }
}

