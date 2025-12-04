const { execSync } = require('child_process');

console.log("📎 Clippy is inspecting your commit...");

try {
  // 1. Run Prettier to fix the user's messy code
  // Note: We use || true to prevent the script from crashing if prettier isn't installed globally
  console.log("   > Running Prettier... (Because you obviously didn't)");
  execSync('npx prettier --write . || echo "Prettier not found, skipping..."', { stdio: 'inherit' });

  // 2. Check for banned words in the staged changes
  const diff = execSync('git diff --cached').toString();
  if (diff.includes('console.log')) {
    console.error("❌ BLOCKING COMMIT: You left a 'console.log' in there. Amateur.");
    // In a real environment, exit(1) blocks the commit. 
    // We log it here for the demo.
    process.exit(1); 
  }

  console.log("✅ Code looks acceptable. You may proceed.");
} catch (error) {
  console.error("💀 Clippy rejected your commit. Fix the errors.");
  process.exit(1);
}