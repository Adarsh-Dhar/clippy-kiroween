import { memoryService } from '../services/memoryService';

// Backend API URL
const BACKEND_API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

/**
 * Response when code has no errors and receives a compliment
 */
export interface ComplimentResponse {
  status: 'clean';
  type: 'compliment';
  message: string;
}

/**
 * Response when code has errors and receives a roast
 */
export interface RoastResponse {
  status: 'error';
  type: 'roast';
  roast: string;
  errors: Array<{
    line: number;
    message: string;
  }>;
}

/**
 * Legacy response format (for backward compatibility)
 */
interface LegacyResponse {
  status: 'clean' | 'error';
  roast?: string;
  errors?: Array<{
    line: number;
    message: string;
  }>;
}

/**
 * Union type for all possible feedback responses
 */
export type FeedbackResponse = ComplimentResponse | RoastResponse | LegacyResponse;

/**
 * Get Clippy feedback by calling the backend roasting service
 * The backend will lint the code first and generate either a roast or compliment
 */
export async function getClippyFeedback(
  code: string,
  language: string = 'javascript',
  filename: string = 'unknown'
): Promise<FeedbackResponse> {
  try {
    const response = await fetch(`${BACKEND_API_URL}/roast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        language
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Backend roast API error:', {
        status: response.status,
        error: errorData
      });
      throw new Error(`Backend API error: ${response.status}`);
    }

    const data: FeedbackResponse = await response.json();

    // Record mistakes in memory if errors exist
    if (data.status === 'error' && 'errors' in data && data.errors) {
      data.errors.forEach(error => {
        // Extract error type from message (e.g., "Missing semicolon" -> "missing-semicolon")
        const errorType = error.message
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
        
        memoryService.recordMistake(
          errorType || 'unknown-error',
          error.message,
          filename,
          error.line
        );
      });
    }

    // Handle compliment response
    if (data.status === 'clean' && 'type' in data && data.type === 'compliment') {
      return data as ComplimentResponse;
    }

    // Handle roast response
    if (data.status === 'error' && 'type' in data && data.type === 'roast') {
      return data as RoastResponse;
    }

    // Handle legacy response format (backward compatibility)
    return {
      status: data.status,
      roast: 'roast' in data ? data.roast : undefined,
      errors: 'errors' in data ? data.errors : undefined
    };
  } catch (error) {
    console.error('Error calling backend roast API:', error);
    // Return fallback response
    return {
      status: 'error',
      roast: getFallbackMessage(),
      errors: []
    };
  }
}

function getFallbackMessage(): string {
  return "It looks like you're trying to write code. The backend seems to be having issues. How fitting.";
}


