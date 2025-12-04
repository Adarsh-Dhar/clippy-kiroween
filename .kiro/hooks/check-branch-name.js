const { execSync } = require('child_process');

console.log("🌿 Clippy is checking your branch name...");

try {
  const branchName = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
  
  console.log(`   Current branch: ${branchName}`);
  
  // Define valid branch name patterns
  const validPatterns = [
    /^feature\/.+/,
    /^bugfix\/.+/,
    /^hotfix\/.+/,
    /^release\/.+/,
    /^main$/,
    /^master$/,
    /^develop$/,
    /^dev$/
  ];
  
  const isValid = validPatterns.some(pattern => pattern.test(branchName));
  
  if (!isValid) {
    console.warn("\n⚠️  BRANCH NAME VIOLATION");
    console.warn("📎 Clippy's Branch Naming Rules:");
    console.warn("   > Use: feature/, bugfix/, hotfix/, or release/");
    console.warn("   > Example: feature/add-clippy-sass");
    console.warn(`   > Your branch '${branchName}' doesn't follow conventions.`);
    console.warn("   > I'm disappointed, but not surprised.");
    console.warn("\n   (Continuing anyway, but Clippy is judging you.)");
  } else {
    console.log("✅ Branch name follows conventions. Well done.");
  }
  
} catch (error) {
  console.error("💥 Branch check failed:", error.message);
}
