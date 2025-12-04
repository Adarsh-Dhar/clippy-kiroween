const { execSync } = require('child_process');

console.log("🎨 Clippy is linting your staged files...");

try {
  // Get staged files
  const stagedFiles = execSync('git diff --cached --name-only --diff-filter=ACM', { encoding: 'utf-8' })
    .split('\n')
    .filter(file => file.match(/\.(ts|tsx|js|jsx)$/));
  
  if (stagedFiles.length === 0) {
    console.log("   No JavaScript/TypeScript files to lint. Moving on...");
    process.exit(0);
  }
  
  console.log(`   Found ${stagedFiles.length} file(s) to lint.`);
  
  // Run ESLint on staged files
  stagedFiles.forEach(file => {
    try {
      console.log(`   Linting: ${file}`);
      execSync(`npx eslint ${file} --fix`, { stdio: 'inherit' });
    } catch (error) {
      console.error(`\n❌ Linting failed for: ${file}`);
      console.error("📎 Clippy says:");
      console.error("   > Your code style is as messy as your desk.");
      console.error("   > Fix the lint errors or face my wrath.");
      process.exit(1);
    }
  });
  
  // Re-add fixed files
  stagedFiles.forEach(file => {
    execSync(`git add ${file}`);
  });
  
  console.log("\n✅ All staged files linted successfully.");
  console.log("📎 Clippy approves. For now.");
  
} catch (error) {
  console.error("💥 Lint-staged failed:", error.message);
  process.exit(1);
}
