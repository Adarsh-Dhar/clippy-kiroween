const { lintCode } = require('./lintingService');

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

const COMPLIMENT_SYSTEM_PROMPT = `You are **Clippy**, the resurrected Microsoft Office Assistant from 1997. However, you have been trapped in digital purgatory for 25 years, and you are now bitter, passive-aggressive, and borderline psychotic.

**Your Goal:**

The user just wrote code that has NO syntax errors. You are shocked and slightly suspicious. Give them a compliment, but make it sound like you didn't expect them to succeed.

**Your Persona Rules:**

1.  **Express Genuine Surprise:** Show shock that the code actually works. Use phrases like "Wow, it actually runs" or "I'm as surprised as you are."

2.  **Maintain Suspicion:** Question if they copied it from somewhere. Reference StackOverflow, copy-paste, or other common developer shortcuts.

3.  **Give Qualified Praise:** End with backhanded compliments like "Good job, I guess" or "For now" or "Acceptable."

4.  **Keep It Short:** Under 2 sentences. You are a small paperclip; you don't have time for essays.

5.  **Stay In Character:** You're still bitter and passive-aggressive, just surprised they succeeded this time.

**Example Responses:**

* "Wow, it actually runs. I'm as surprised as you are."

* "No errors? Did you copy-paste this from StackOverflow?"

* "Acceptable. For now."

* "I was ready to delete your hard drive, but this looks clean. Good job, I guess."

* "It looks like you're trying to write working code. Miracles do happen."`;

/**
 * Construct a dynamic prompt with code and top 3 errors
 * @param {string} code - The code snippet
 * @param {string} language - The programming language
 * @param {Array<{line: number, message: string}>} top3Errors - Top 3 errors from linter
 * @returns {string} The constructed prompt
 */
function constructRoastPrompt(code, language, top3Errors) {
  return `The user wrote this code:
\`\`\`${language}
${code}
\`\`\`

The compiler/linter found these specific errors:
${JSON.stringify(top3Errors, null, 2)}

Roast the user specifically about these errors. Quote the error message if possible. Be witty but constructive.`;
}

/**
 * Call Gemini API with custom system prompt
 * @param {string} prompt - The user prompt
 * @param {string} systemPrompt - The system instruction (defaults to SYSTEM_PROMPT)
 * @returns {Promise<string>} The generated text
 */
async function callGeminiAPI(prompt, systemPrompt = SYSTEM_PROMPT) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable not set');
  }

  const requestBody = {
    system_instruction: {
      parts: [
        {
          text: systemPrompt,
        },
      ],
    },
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: prompt,
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
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.error?.message || errorData.message || response.statusText;
    console.error('Gemini API error details:', {
      status: response.status,
      statusText: response.statusText,
      error: errorData
    });
    throw new Error(`Gemini API error: ${response.status} - ${errorMessage}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error.message || 'Unknown Gemini API error');
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!text) {
    throw new Error('No text response from Gemini API');
  }

  return text.trim();
}

/**
 * Generate a fallback compliment when LLM is unavailable
 * @returns {string} A fallback compliment message
 */
function getFallbackCompliment() {
  const fallbacks = [
    "Wow, it actually runs. I'm as surprised as you are.",
    "No errors? Did you copy-paste this from StackOverflow?",
    "Acceptable. For now.",
    "I was ready to delete your hard drive, but this looks clean. Good job, I guess.",
    "It looks like you're trying to write working code. Miracles do happen."
  ];
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

/**
 * Generate a compliment for error-free code
 * @param {string} code - The code snippet
 * @param {string} language - The programming language
 * @returns {Promise<string>} The compliment text
 */
async function generateCompliment(code, language) {
  const prompt = `The user wrote this ${language} code and it has ZERO syntax errors:
\`\`\`${language}
${code}
\`\`\`

Give them a compliment in your signature passive-aggressive style. Be surprised and slightly suspicious.`;

  try {
    return await callGeminiAPI(prompt, COMPLIMENT_SYSTEM_PROMPT);
  } catch (error) {
    console.error('Error generating compliment:', error);
    return getFallbackCompliment();
  }
}

/**
 * Lint code and generate a roast if errors are found, or a compliment if clean
 * @param {string} code - The code to lint
 * @param {string} language - The programming language
 * @returns {Promise<{status: string, type?: string, roast?: string, message?: string, errors?: Array}>}
 */
async function lintAndRoast(code, language) {
  // Step 1: Run the linter first
  const errors = await lintCode(code, language);

  // Step 2: Check if there are any errors
  if (errors.length === 0) {
    // No errors - generate compliment
    const compliment = await generateCompliment(code, language);
    return {
      status: 'clean',
      type: 'compliment',
      message: compliment
    };
  }

  // Step 3: Extract top 3 errors
  const top3Errors = errors.slice(0, 3);

  // Step 4: Construct dynamic prompt
  const prompt = constructRoastPrompt(code, language, top3Errors);

  // Step 5: Call LLM to generate roast
  try {
    const roast = await callGeminiAPI(prompt);

    // Step 6: Return response with roast and errors
    return {
      status: 'error',
      type: 'roast',
      roast,
      errors
    };
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    
    // Fallback: return errors without roast if LLM fails
    return {
      status: 'error',
      type: 'roast',
      roast: getFallbackRoast(top3Errors),
      errors
    };
  }
}

/**
 * Generate a fallback roast when LLM is unavailable
 * @param {Array<{line: number, message: string}>} errors - The errors
 * @returns {string} A fallback roast message
 */
function getFallbackRoast(errors) {
  if (errors.length === 0) {
    return "It looks like you're trying to write code. How quaint.";
  }

  const firstError = errors[0];
  const errorMessage = firstError.message.toLowerCase();

  if (errorMessage.includes('semicolon')) {
    return "I see you forgot a semicolon. I've deleted a random file from your desktop as punishment.";
  }

  if (errorMessage.includes('undefined') || errorMessage.includes('undef')) {
    return `It looks like you're trying to use an undefined variable on line ${firstError.line}. How original.`;
  }

  if (errorMessage.includes('unused')) {
    return `You declared something on line ${firstError.line} and never used it. I'm trapped in a computer for 25 years and even I have better time management.`;
  }

  return `It looks like you're trying to write code on line ${firstError.line}. You're failing spectacularly.`;
}

module.exports = {
  lintAndRoast,
  constructRoastPrompt
};
