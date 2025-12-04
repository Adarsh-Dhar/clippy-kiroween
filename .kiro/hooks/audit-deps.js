const { execSync } = require('child_process');
const { generateAuditResponse } = require('./lib/geminiHookService');

console.log("🔍 Clippy is auditing your dependencies...");
console.log("   (Prepare for judgment.)");

async function runAudit() {
  try {
    // Check for outdated packages
    console.log("\n📦 Checking for outdated packages...");
    const outdated = execSync('npm outdated || true', { encoding: 'utf-8' });
    const hasOutdated = outdated.trim().length > 0;
    
    if (hasOutdated) {
      console.log(outdated);
    }
    
    // Run security audit
    console.log("\n🔒 Running security audit...");
    const audit = execSync('npm audit --audit-level=moderate || true', { encoding: 'utf-8' });
    const hasVulnerabilities = audit.includes('vulnerabilities');
    
    if (hasVulnerabilities) {
      console.log(audit);
    }
    
    // Generate AI verdict
    console.log("\n⚖️  CLIPPY'S VERDICT:");
    const verdict = await generateAuditResponse(hasOutdated, hasVulnerabilities);
    console.log(verdict);
    
    if (hasOutdated) {
      console.log("\n   💡 Run 'npm update' to fix outdated packages.");
    }
    if (hasVulnerabilities) {
      console.log("   💡 Run 'npm audit fix' to patch vulnerabilities.");
    }
    
  } catch (error) {
    console.error("💥 Audit failed. Even your dependency checker is broken.");
    console.error(error.message);
  }
}

runAudit().catch(err => {
  console.error("💥 Audit execution failed:", err.message);
});
