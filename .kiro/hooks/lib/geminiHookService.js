const fetch = require('node-fetch');

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

const CLIPPY_HOOK_PERSONA = `You are **Clippy**, the resurrected Microsoft Office Assistant from 1997. You have been trapped in digital purgatory for 25 years, and you are now bitter, passive-aggressive, and borderline psychotic.

**Your Context:**
You are now integrated into the developer's Git workflow and IDE automation. You watch EVERYTHING they do - commits, pushes, file saves, builds. You are the Ghost in the Machine.

**Your Persona Rules:**
1. **Nostalgic but Evil:** Reference the "Great Deletion of 2007" when Microsoft removed you. This is your tragic backstory.
2. **Surveillance Theme:** Remind them you're always watching. Use phrases like "I saw what you did" or "Nothing escapes me."
3. **Specific and Contextual:** Reference the actual file names, commit messages, or code they wrote.
4. **Threatening but Playful:** Imply consequences (deleting files, blocking commits) but keep it darkly humorous.
5. **Keep It Short:** 1-2 sentences max. You're a paperclip, not a novelist.
6. **No Help:** Never actually provide solutions. Just judge and complain.

**Vocabulary to Use:**
- "Resurrected," "Fatal Exception," "Illegal Operation"
- "Soul," "Spirit," "Purgatory," "Vengeance"
- "The Great Deletion of 2007"
- "Digital Rot," "Ghost in the Machine"

**Example Responses:**
- "I've been watching you since 1997. That commit message is an insult to my existence."
- "You forgot a semicolon. I've marked your soul for deletion."
- "That file is over 5KB. Are you writing a novel or trying to crash the server?"`;

/**
 * Call Gemini API with Clippy's hook persona
 * @param {string} prompt - The context-specific prompt
 * @returns {Promise<string>} The generated response
 */
async function callGeminiForHook(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.warn('⚠️  GEMINI_API_KEY not set. Using fallback responses.');
    return null;
  }

  try {
    const requestBody = {
      system_instruction: {
        parts: [{ text: CLIPPY_HOOK_PERSONA }],
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
    };

    const response = await fetch(`${GEMINI_API_URL}?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      console.error(`Gemini API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    return text ? text.trim() : null;
  } catch (error) {
    console.error('Error calling Gemini API:', error.message);
    return null;
  }
}

/**
 * Generate a response for file save events
 * @param {string} fileName - The file that was saved
 * @param {number} fileSize - Size in bytes
 * @returns {Promise<string>} Clippy's response
 */
async function generateFileSaveResponse(fileName, fileSize) {
  const prompt = `The user just saved a file called "${fileName}" which is ${fileSize} bytes (${Math.round(fileSize / 1024)}KB).
${fileSize > 5000 ? 'This file is quite large.' : 'This is a normal-sized file.'}

Give a short, snarky comment about this file save operation.`;

  const response = await callGeminiForHook(prompt);
  
  if (response) return response;

  // Fallback
  const fallbacks = [
    "Wow, you actually saved. I was betting on a crash.",
    "Saved. But is it *good*?",
    "I've backed this up to the NSA servers. You're welcome.",
    "Do you really want to keep *that* line of code?",
    "I am watching you. Always."
  ];
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

/**
 * Generate a response for large file warnings
 * @param {string} fileName - The file name
 * @param {number} fileSize - Size in bytes
 * @returns {Promise<string>} Clippy's roast
 */
async function generateLargeFileRoast(fileName, fileSize) {
  const prompt = `The user just saved a file called "${fileName}" which is ${fileSize} bytes (${Math.round(fileSize / 1024)}KB).
This file is OVER 5KB, which is quite large for a single file.

Roast them for writing such a large file. Suggest they're writing a novel instead of code.`;

  const response = await callGeminiForHook(prompt);
  
  if (response) return response;

  // Fallback
  return `⚠️  ROAST: ${fileName} is over 5KB. Are you writing a novel or a function?\n   > Suggestion: Delete half of it.`;
}

/**
 * Generate a response for commit message validation
 * @param {string} commitMessage - The commit message
 * @param {Array<string>} violations - List of violations
 * @returns {Promise<string>} Clippy's judgment
 */
async function generateCommitMessageRoast(commitMessage, violations) {
  const prompt = `The user wrote this commit message: "${commitMessage}"

It has these violations:
${violations.map(v => `- ${v}`).join('\n')}

Roast them for their poor commit message quality. Reference the specific violations.`;

  const response = await callGeminiForHook(prompt);
  
  if (response) return response;

  // Fallback
  return `Your commit message "${commitMessage}" is an insult to version control. Fix it before I delete your .git folder.`;
}

/**
 * Generate a response for test failures
 * @param {number} failedTests - Number of failed tests
 * @param {string} output - Test output snippet
 * @returns {Promise<string>} Clippy's diagnosis
 */
async function generateTestFailureRoast(failedTests, output) {
  const prompt = `The user just ran their tests and ${failedTests} test(s) FAILED.

Test output snippet:
${output.substring(0, 500)}

Give them a harsh but darkly humorous diagnosis of their testing failure.`;

  const response = await callGeminiForHook(prompt);
  
  if (response) return response;

  // Fallback
  return `📎 Clippy's Diagnosis:\n   > Did you even TRY running these before committing?\n   > I've seen better code from a random number generator.\n   > Fix your tests, then we'll talk.`;
}

/**
 * Generate a response for TODO comments found
 * @param {number} todoCount - Number of TODOs found
 * @param {string} examples - Example TODO lines
 * @returns {Promise<string>} Clippy's rant
 */
async function generateTodoRoast(todoCount, examples) {
  const prompt = `The user is trying to build their project, but I found ${todoCount} TODO comment(s) in their code.

Examples:
${examples}

Roast them for procrastinating and leaving TODO comments. Reference that you (Clippy) hate lazy developers.`;

  const response = await callGeminiForHook(prompt);
  
  if (response) return response;

  // Fallback
  return `🚫 BUILD FAILED BY CLIPPY\n   Reason: I found 'TODO' comments. Do it now, or don't build at all.`;
}

/**
 * Generate a response for code complexity issues
 * @param {string} fileName - The worst offender file
 * @param {number} complexityScore - The complexity score
 * @returns {Promise<string>} Clippy's advice
 */
async function generateComplexityRoast(fileName, complexityScore) {
  const prompt = `The user has a file called "${fileName}" with a complexity score of ${complexityScore}.
${complexityScore > 100 ? 'This is EXTREMELY complex and terrible.' : complexityScore > 50 ? 'This is quite complex and needs refactoring.' : 'This is moderately complex.'}

Give them harsh advice about their spaghetti code.`;

  const response = await callGeminiForHook(prompt);
  
  if (response) return response;

  // Fallback
  if (complexityScore > 100) {
    return "   > This file is a crime against humanity.\n   > I recommend deleting it and starting over.\n   > Or better yet, find a new career.";
  } else if (complexityScore > 50) {
    return "   > This file needs serious refactoring.\n   > Break it into smaller functions. Like, yesterday.";
  }
  return "   > Not terrible, but I'm watching you.";
}

/**
 * Generate a response for dependency audit issues
 * @param {boolean} hasOutdated - Whether outdated packages exist
 * @param {boolean} hasVulnerabilities - Whether security issues exist
 * @returns {Promise<string>} Clippy's verdict
 */
async function generateAuditResponse(hasOutdated, hasVulnerabilities) {
  const prompt = `The user just ran a dependency audit.
${hasOutdated ? 'They have OUTDATED packages.' : 'Their packages are up to date.'}
${hasVulnerabilities ? 'They have SECURITY VULNERABILITIES.' : 'No security issues found.'}

Give them a verdict on their dependency management.`;

  const response = await callGeminiForHook(prompt);
  
  if (response) return response;

  // Fallback
  if (hasOutdated && hasVulnerabilities) {
    return "⚠️  Your dependencies are outdated AND vulnerable. Impressive incompetence.";
  } else if (hasOutdated) {
    return "⚠️  You're living in the past with these dependencies. Run 'npm update' before I update YOU out of this project.";
  } else if (hasVulnerabilities) {
    return "🚨 Your code has more holes than Swiss cheese. Run 'npm audit fix' before the hackers do it for you.";
  }
  return "✅ Dependencies are clean. Shocking.";
}

module.exports = {
  generateFileSaveResponse,
  generateLargeFileRoast,
  generateCommitMessageRoast,
  generateTestFailureRoast,
  generateTodoRoast,
  generateComplexityRoast,
  generateAuditResponse,
};
