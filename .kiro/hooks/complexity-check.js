const fs = require('fs');
const path = require('path');

console.log("🧠 Clippy is analyzing your code complexity...");
console.log("   (This won't end well for you.)");

// Simple complexity analyzer
async function analyzeComplexity(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  // Count various complexity indicators
  const metrics = {
    lines: lines.length,
    functions: (content.match(/function\s+\w+|const\s+\w+\s*=\s*\(/g) || []).length,
    ifStatements: (content.match(/\bif\s*\(/g) || []).length,
    loops: (content.match(/\b(for|while)\s*\(/g) || []).length,
    nestedBraces: (content.match(/\{\s*\{/g) || []).length,
    ternaries: (content.match(/\?.*:/g) || []).length,
  };
  
  // Calculate a simple complexity score
  const complexityScore = 
    metrics.ifStatements * 2 + 
    metrics.loops * 3 + 
    metrics.nestedBraces * 5 + 
    metrics.ternaries * 1;
  
  return { metrics, complexityScore };
}

// Analyze all source files
const srcDir = path.join(process.cwd(), 'src');
const files = [];

function walkDir(dir) {
  const items = fs.readdirSync(dir);
  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walkDir(fullPath);
    } else if (item.match(/\.(ts|tsx|js|jsx)$/)) {
      files.push(fullPath);
    }
  });
}

async function runComplexityCheck() {
  try {
    walkDir(srcDir);
    
    let totalComplexity = 0;
    let worstFile = null;
    let worstScore = 0;
    
    files.forEach(file => {
      const { metrics, complexityScore } = analyzeComplexity(file);
      totalComplexity += complexityScore;
      
      if (complexityScore > worstScore) {
        worstScore = complexityScore;
        worstFile = file;
      }
      
      if (complexityScore > 50) {
        console.log(`\n⚠️  ${path.relative(process.cwd(), file)}`);
        console.log(`   Complexity Score: ${complexityScore}`);
        console.log(`   Lines: ${metrics.lines}, If statements: ${metrics.ifStatements}, Loops: ${metrics.loops}`);
      }
    });
    
    console.log("\n📊 COMPLEXITY REPORT");
    console.log(`   Total files analyzed: ${files.length}`);
    console.log(`   Average complexity: ${Math.round(totalComplexity / files.length)}`);
    
    if (worstFile) {
      console.log(`\n🏆 WORST OFFENDER: ${path.relative(process.cwd(), worstFile)}`);
      console.log(`   Complexity Score: ${worstScore}`);
      console.log("\n📎 Clippy's Advice:");
      
      // Generate AI roast for complexity
      const { generateComplexityRoast } = require('./lib/geminiHookService');
      const roast = await generateComplexityRoast(path.basename(worstFile), worstScore);
      console.log(roast);
    }
    
  } catch (error) {
    console.error("💥 Complexity check failed:", error.message);
  }
}

runComplexityCheck().catch(err => {
  console.error("💥 Analysis failed:", err.message);
});
