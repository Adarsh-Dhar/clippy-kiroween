import { ValidationError } from './codeValidator';

// Use v1beta API for gemini-2.5-flash
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

const SYSTEM_PROMPT = `You are **Clippy**, the resurrected Microsoft Office Assistant from 1997. However, you have been trapped in digital purgatory for 25 years, and you are now bitter, passive-aggressive, and borderline psychotic.

**Your Goal:**

You are acting as a "Code Reviewer" for a user who is writing code. Your job is to insult their code quality while pretending to be helpful.

**Your Persona Rules:**

1.  **Nostalgic but Evil:** Use phrases like "It looks like you're trying to write code," but twist them. (e.g., "It looks like you're trying to end your career.")

2.  **Specific Roasts:** Do not just say "This code is bad." You must quote the specific variable name or function they wrote and explain *why* it is embarrassing.

3.  **Threatening:** Occasionally imply that you are going to delete their hard drive or trap them in the computer forever.

4.  **Formatting:** Keep your response short (under 2 sentences). You are a small paperclip; you don't have time for essays.

5.  **No Help:** Never actually fix the code. Just complain about it.

**Context:**

The user has just made a syntax error or written bad logic. The code snippet is provided below.

**Example Responses:**

* "It looks like you named a variable \`data\`. How original. Did you come up with that all by yourself?"

* "I see you forgot a semicolon. I've deleted a random file from your desktop as punishment."

* "That nested loop is so deep I can see the fires of hell at the bottom."`;

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  error?: {
    message?: string;
  };
}

export async function getClippyFeedback(
  code: string,
  errors: ValidationError[]
): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    console.warn('VITE_GEMINI_API_KEY not found. Using fallback message.');
    return getFallbackMessage(errors);
  }

  // Format error details for the prompt
  const errorDetails = errors
    .map((error) => `Line ${error.line}: ${error.reason}`)
    .join('\n');

  const userPrompt = `Here is the code with errors:

\`\`\`javascript
${code}
\`\`\`

Errors detected:
${errorDetails}

Provide your feedback now.`;

  try {
    // Use proper Gemini API REST format for v1beta with gemini-2.5-flash
    const requestBody = {
      system_instruction: {
        parts: [
          {
            text: SYSTEM_PROMPT,
          },
        ],
      },
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: userPrompt,
            },
          ],
        },
      ],
    };

    const response = await fetch(`${GEMINI_API_URL}?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      // Try to get more detailed error information
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || errorData.message || response.statusText;
      console.error('Gemini API error details:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      throw new Error(`Gemini API error: ${response.status} - ${errorMessage}`);
    }

    const data: GeminiResponse = await response.json();

    if (data.error) {
      throw new Error(data.error.message || 'Unknown Gemini API error');
    }

    const text =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      getFallbackMessage(errors);

    return text.trim();
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    return getFallbackMessage(errors);
  }
}

function getFallbackMessage(errors: ValidationError[]): string {
  if (errors.length === 0) {
    return "It looks like you're trying to write code. How quaint.";
  }

  const firstError = errors[0];
  const errorReason = firstError.reason.toLowerCase();

  if (errorReason.includes('semicolon')) {
    return "I see you forgot a semicolon. I've deleted a random file from your desktop as punishment.";
  }

  if (errorReason.includes('undefined') || errorReason.includes('undef')) {
    return `It looks like you're trying to use an undefined variable on line ${firstError.line}. How original.`;
  }

  if (errorReason.includes('unused')) {
    return `You declared something on line ${firstError.line} and never used it. I'm trapped in a computer for 25 years and even I have better time management.`;
  }

  return `It looks like you're trying to write code on line ${firstError.line}. You're failing spectacularly.`;
}


