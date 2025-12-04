const { execSync } = require('child_process');

console.log("🚀 Clippy is validating your push...");
console.log("   (You better have run the tests.)");

try {
  // Check if there are uncommitted changes
  const status = execSync('git status --porcelain', { encoding: 'utf-8' });
  if (status.trim().length > 0) {
    console.warn("\n⚠️  WARNING: You have uncommitted changes.");
    console.warn("   Clippy is judging you silently.");
  }
  
  // Run tests before allowing push
  console.log("\n🧪 Running tests before push...");
  execSync('npm test -- --run', { stdio: 'inherit' });
  
  // Check for large files
  console.log("\n📏 Checking for large files...");
  const largeFiles = execSync('git diff --cached --name-only | xargs -I {} du -k {} 2>/dev/null | awk \'$1 > 500\' || true', { encoding: 'utf-8' });
  
  if (largeFiles.trim().length > 0) {
    console.warn("\n⚠️  LARGE FILES DETECTED:");
    console.warn(largeFiles);
    console.warn("📎 Clippy asks: Do you REALLY need to commit that?");
  }
  
  console.log("\n✅ Push validation passed.");
  console.log("📎 Clippy says: 'Go ahead. But I'll be watching the CI logs.'");
  
} catch (error) {
  console.error("\n❌ PUSH BLOCKED BY CLIPPY");
  console.error("📎 Reasons:");
  console.error("   > Tests failed. Fix them before pushing.");
  console.error("   > I'm not letting you embarrass yourself in front of the team.");
  console.error("   > Run 'npm test' locally and try again.");
  
  process.exit(1);
}
