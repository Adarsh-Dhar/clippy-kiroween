const { lintCode } = require('./lintingService');
const memoryService = require('./memoryService');

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
 * Get memory context for user
 * @param {string} userId - User ID
 * @param {Array<{line: number, message: string, errorType?: string}>} currentErrors - Current errors
 * @returns {Promise<Object>} Memory context
 */
async function getMemoryContext(userId, currentErrors = []) {
  if (!userId) {
    return null;
  }

  try {
    const [commonMistakes, patterns, angerStats, recentInteractions] = await Promise.all([
      memoryService.getCommonMistakes(userId).catch(() => []),
      memoryService.getFavoritePatterns(userId).catch(() => []),
      memoryService.getAngerStats(userId).catch(() => null),
      memoryService.getRecentInteractions(userId, 5).catch(() => []),
    ]);

    // Check for repeat mistakes
    const repeatMistakes = [];
    if (currentErrors.length > 0) {
      for (const error of currentErrors) {
        // Extract error type from message (same logic as frontend)
        const errorType = error.errorType || error.message
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
        
        // Find matching mistake in common mistakes
        const mistake = commonMistakes.find(m => {
          // Try exact match first
          if (m.errorType === errorType) return true;
          // Try partial match (error type might be in message)
          const mistakeTypeLower = m.errorType.toLowerCase();
          const errorMsgLower = error.message.toLowerCase();
          return errorMsgLower.includes(mistakeTypeLower) || mistakeTypeLower.includes(errorType);
        });
        
        if (mistake && mistake.count >= 3) {
          repeatMistakes.push({
            errorType: mistake.errorType,
            message: mistake.message,
            count: mistake.count,
            currentError: error.message,
          });
        }
      }
    }

    return {
      commonMistakes: repeatMistakes,
      patterns: patterns.slice(0, 3), // Top 3 patterns
      angerStats,
      recentInteractions: recentInteractions.slice(0, 3), // Last 3 interactions
    };
  } catch (error) {
    console.error('Error fetching memory context:', error);
    return null;
  }
}

/**
 * Construct a dynamic prompt with code, errors, and memory context
 * @param {string} code - The code snippet
 * @param {string} language - The programming language
 * @param {Array<{line: number, message: string}>} top3Errors - Top 3 errors from linter
 * @param {Object} memoryContext - Memory context from database
 * @returns {string} The constructed prompt
 */
function constructRoastPrompt(code, language, top3Errors, memoryContext = null) {
  let prompt = `The user wrote this code:
\`\`\`${language}
${code}
\`\`\`

The compiler/linter found these specific errors:
${JSON.stringify(top3Errors, null, 2)}`;

  // Add memory context if available
  if (memoryContext) {
    // Add repeat mistakes context
    if (memoryContext.commonMistakes && memoryContext.commonMistakes.length > 0) {
      prompt += `\n\n**IMPORTANT - User's Repeat Mistakes:**\n`;
      memoryContext.commonMistakes.forEach(mistake => {
        prompt += `- They've made the "${mistake.errorType}" error ${mistake.count} times before. Current error: "${mistake.currentError}"\n`;
      });
      prompt += `\nReference these repeat mistakes in your roast. Be especially harsh about patterns they keep repeating.`;
    }

    // Add coding patterns context
    if (memoryContext.patterns && memoryContext.patterns.length > 0) {
      prompt += `\n\n**User's Coding Patterns:**\n`;
      memoryContext.patterns.forEach(pattern => {
        prompt += `- ${pattern.name}: ${pattern.description} (used ${pattern.frequency}% of the time)\n`;
      });
      prompt += `\nYou can reference their coding style if relevant.`;
    }

    // Add anger stats context
    if (memoryContext.angerStats) {
      const stats = memoryContext.angerStats;
      if (stats.totalDeaths > 0 || stats.highestLevel >= 4) {
        prompt += `\n\n**User's History:**\n`;
        if (stats.totalDeaths > 0) {
          prompt += `- They've triggered ${stats.totalDeaths} BSOD(s) (system crashes)\n`;
        }
        if (stats.highestLevel >= 4) {
          prompt += `- Their highest anger level reached: ${stats.highestLevel}/5\n`;
        }
        prompt += `\nThey have a history of making serious mistakes. Adjust your tone accordingly.`;
      }
    }
  }

  prompt += `\n\nRoast the user specifically about these errors. Quote the error message if possible. Be witty but constructive.`;

  return prompt;
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
 * @param {Object} memoryContext - Memory context from database
 * @returns {Promise<string>} The compliment text
 */
async function generateCompliment(code, language, memoryContext = null) {
  let prompt = `The user wrote this ${language} code and it has ZERO syntax errors:
\`\`\`${language}
${code}
\`\`\``;

  // Add memory context if available
  if (memoryContext) {
    if (memoryContext.angerStats) {
      const stats = memoryContext.angerStats;
      if (stats.totalDeaths > 0) {
        prompt += `\n\n**Context:** This user has triggered ${stats.totalDeaths} BSOD(s) before, so this clean code is genuinely surprising.`;
      } else if (stats.highestLevel >= 3) {
        prompt += `\n\n**Context:** This user usually makes many mistakes (anger level reached ${stats.highestLevel}/5), so this is unexpected.`;
      }
    }

    if (memoryContext.commonMistakes && memoryContext.commonMistakes.length > 0) {
      prompt += `\n\n**Context:** They usually make repeat mistakes, but not this time.`;
    }
  }

  prompt += `\n\nGive them a compliment in your signature passive-aggressive style. Be surprised and slightly suspicious.`;

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
 * @param {string} userId - Optional user ID for memory context
 * @returns {Promise<{status: string, type?: string, roast?: string, message?: string, errors?: Array}>}
 */
async function lintAndRoast(code, language, userId = null) {
  // Step 1: Run the linter first
  const errors = await lintCode(code, language);

  // Step 2: Get memory context if userId is provided
  let memoryContext = null;
  if (userId) {
    memoryContext = await getMemoryContext(userId, errors);
  }

  // Step 3: Check if there are any errors
  if (errors.length === 0) {
    // No errors - generate compliment
    const compliment = await generateCompliment(code, language, memoryContext);
    return {
      status: 'clean',
      type: 'compliment',
      message: compliment
    };
  }

  // Step 4: Extract top 3 errors
  const top3Errors = errors.slice(0, 3);

  // Step 5: Construct dynamic prompt with memory context
  const prompt = constructRoastPrompt(code, language, top3Errors, memoryContext);

  // Step 6: Call LLM to generate roast
  try {
    const roast = await callGeminiAPI(prompt);

    // Step 7: Return response with roast and errors
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
      roast: getFallbackRoast(top3Errors, memoryContext),
      errors
    };
  }
}

/**
 * Generate a fallback roast when LLM is unavailable
 * @param {Array<{line: number, message: string}>} errors - The errors
 * @param {Object} memoryContext - Optional memory context
 * @returns {string} A fallback roast message
 */
function getFallbackRoast(errors, memoryContext = null) {
  if (errors.length === 0) {
    return "It looks like you're trying to write code. How quaint.";
  }

  const firstError = errors[0];
  const errorMessage = firstError.message.toLowerCase();

  // Check for repeat mistakes
  if (memoryContext && memoryContext.commonMistakes && memoryContext.commonMistakes.length > 0) {
    const repeatMistake = memoryContext.commonMistakes[0];
    return `You've made this "${repeatMistake.errorType}" error ${repeatMistake.count} times now. I'm starting to think you're doing it on purpose.`;
  }

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
