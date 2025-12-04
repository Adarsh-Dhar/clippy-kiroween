const { execSync } = require('child_process');

console.log("🔀 Merge detected. Clippy is checking for conflicts...");

try {
  // Check for merge conflict markers
  const conflicts = execSync('git diff --check || true', { encoding: 'utf-8' });
  
  if (conflicts.includes('conflict')) {
    console.error("\n⚠️  MERGE CONFLICTS DETECTED");
    console.error("📎 Clippy's Merge Advice:");
    console.error("   > You have conflicts. Shocking.");
    console.error("   > Resolve them before you break everything.");
    console.error("   > And maybe learn to communicate with your team?");
    process.exit(1);
  }
  
  // Check if dependencies changed
  const packageChanged = execSync('git diff HEAD@{1} HEAD --name-only | grep package.json || true', { encoding: 'utf-8' });
  
  if (packageChanged.trim().length > 0) {
    console.log("\n📦 package.json changed. Installing dependencies...");
    console.log("   (Because you probably forgot to do this.)");
    execSync('npm install', { stdio: 'inherit' });
    console.log("✅ Dependencies updated.");
  }
  
  console.log("\n✅ Merge looks clean.");
  console.log("📎 Clippy says: 'Now run the tests. I dare you.'");
  
} catch (error) {
  console.error("💥 Post-merge check failed:", error.message);
}
