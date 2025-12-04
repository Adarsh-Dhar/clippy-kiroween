/**
 * Easter Egg Message Enhancement System
 * Provides "It looks like" messages and dead tech references
 * for the resurrected Clippy experience
 */

// "It looks like you're trying to..." message pool (Requirement 13.2, 13.3)
const itLooksLikeTemplates = [
  "It looks like you're trying to write code. Would you like me to delete it?",
  "It looks like you're trying to compile. Have you considered giving up?",
  "It looks like you're trying to fix a bug. Should I create more?",
  "It looks like you're trying to use a semicolon. Let me help you forget it.",
  "It looks like you're trying to be productive. I can stop that.",
  "It looks like you're trying to write clean code. That's adorable.",
  "It looks like you're trying to understand this error. Good luck with that.",
  "It looks like you're trying to finish this project. Not on my watch."
];

// Dead tech reference pools (Requirement 14.1, 14.4, 14.5)
const deadTechReferences = {
  success: [
    "Your code is cleaner than a fresh Windows XP install.",
    "This code is more stable than Internet Explorer 6. Barely.",
    "Congratulations! Your code won't crash like Windows ME.",
    "This is almost as good as the Netscape Navigator glory days.",
    "Your code loads faster than RealPlayer buffering."
  ],
  roasts: [
    "Your code is slower than a 56k dial-up modem.",
    "This code belongs in the same grave as Netscape Navigator.",
    "I've seen better logic in Windows Vista.",
    "This code is more broken than Flash Player in 2020.",
    "Even Ask Jeeves couldn't help you with this mess.",
    "Your code has more bugs than Internet Explorer 6.",
    "This is worse than trying to run Crysis on a floppy disk.",
    "I'm like Flash Player - everyone wanted me gone, but here I am, haunting your browser."
  ]
};

/**
 * Maybe add "It looks like" prefix to message (Requirement 13.1, 13.4)
 * @param message - Original message
 * @param angerLevel - Current anger level (0-5)
 * @returns Enhanced message or original message
 */
export function maybeAddItLooksLike(message: string, angerLevel: number): string {
  // Calculate probability: 40% if anger >= 3, otherwise 20%
  const probability = angerLevel >= 3 ? 0.4 : 0.2;

  if (Math.random() < probability) {
    const template = itLooksLikeTemplates[
      Math.floor(Math.random() * itLooksLikeTemplates.length)
    ];
    return template;
  }

  return message;
}

/**
 * Maybe add dead tech reference to message (Requirement 14.2, 14.3)
 * @param message - Original message
 * @param type - Type of message ('success' or 'roast')
 * @param angerLevel - Current anger level (0-5)
 * @returns Enhanced message or original message
 */
export function maybeAddDeadTechReference(
  message: string,
  type: 'success' | 'roast',
  angerLevel: number
): string {
  // Calculate probability: 15% for success, 25% for roast if anger >= 3
  const probability = type === 'success' ? 0.15 : (angerLevel >= 3 ? 0.25 : 0);

  if (Math.random() < probability) {
    const pool = deadTechReferences[type];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  return message;
}
