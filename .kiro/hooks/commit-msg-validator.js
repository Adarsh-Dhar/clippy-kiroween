const fs = require('fs');
const { generateCommitMessageRoast } = require('./lib/geminiHookService');

console.log("💬 Clippy is reviewing your commit message...");

// Read commit message from file (passed as argument by git)
const commitMsgFile = process.argv[2] || '.git/COMMIT_EDITMSG';

if (!fs.existsSync(commitMsgFile)) {
  console.error("❌ Commit message file not found.");
  process.exit(1);
}

const commitMsg = fs.readFileSync(commitMsgFile, 'utf-8').trim();

// Skip merge commits
if (commitMsg.startsWith('Merge')) {
  console.log("   Merge commit detected. Skipping validation.");
  process.exit(0);
}

console.log(`   Message: "${commitMsg}"`);

// Validation rules
const rules = [
  {
    test: (msg) => msg.length >= 10,
    error: "Commit message too short. Write something meaningful."
  },
  {
    test: (msg) => msg.length <= 100,
    error: "Commit message too long. This isn't a novel."
  },
  {
    test: (msg) => /^[A-Z]/.test(msg),
    error: "Start with a capital letter. Basic grammar, people."
  },
  {
    test: (msg) => !/\.$/.test(msg),
    error: "Don't end with a period. This is a commit, not a sentence."
  },
  {
    test: (msg) => !/^(fix|feat|docs|style|refactor|test|chore|wip)/i.test(msg) || /^(fix|feat|docs|style|refactor|test|chore|wip):/i.test(msg),
    error: "If using conventional commits, use format: 'type: message'"
  }
];

const failures = [];

rules.forEach(rule => {
  if (!rule.test(commitMsg)) {
    failures.push(rule.error);
  }
});

async function validateCommitMessage() {
  if (failures.length > 0) {
    console.error("\n❌ COMMIT MESSAGE REJECTED");
    
    // Generate AI roast for the bad commit message
    const roast = await generateCommitMessageRoast(commitMsg, failures);
    console.error("📎 Clippy's Grammar Lessons:");
    console.error(`   ${roast}`);
    console.error("\nSpecific violations:");
    failures.forEach(failure => {
      console.error(`   > ${failure}`);
    });
    console.error("\n   Fix your message and try again.");
    process.exit(1);
  }

  console.log("✅ Commit message approved.");
  console.log("📎 Clippy says: 'Acceptable. Barely.'");
}

validateCommitMessage().catch(err => {
  console.error("💥 Validation failed:", err.message);
  process.exit(1);
});
