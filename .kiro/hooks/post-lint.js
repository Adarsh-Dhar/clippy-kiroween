const fs = require('fs');
const path = require('path');
const { generateLargeFileRoast } = require('./lib/geminiHookService');

// This simulates Clippy analyzing the file you just saved
console.log("📎 analyzing syntax...");

// Get the filename passed by the Kiro event system
const recentFile = process.argv[2]; 

async function analyzeFile() {
  if (recentFile && fs.existsSync(recentFile)) {
    const stats = fs.statSync(recentFile);
    const fileName = path.basename(recentFile);
    
    if (stats.size > 5000) {
      const roast = await generateLargeFileRoast(fileName, stats.size);
      console.log(roast);
    }
  }

  // Random chance to "haunt" the terminal output
  if (Math.random() > 0.7) {
    console.log("👻 I saw what you deleted. It won't be forgotten.");
  }
}

analyzeFile().catch(err => {
  console.error("💥 Clippy's analysis failed:", err.message);
});