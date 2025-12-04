const { execSync } = require('child_process');
const { generateTestFailureRoast } = require('./lib/geminiHookService');
const { incrementAnger, decreaseAnger, readGameState, getClippyMood } = require('./lib/gameStateSync');

console.log("🧪 Clippy is running your tests...");
console.log("   (This should be interesting...)");

async function runTests() {
  try {
    // Run tests with coverage
    const output = execSync('npm test -- --run', { encoding: 'utf-8' });
    console.log(output);
    
    // Tests passed - decrease anger
    const state = decreaseAnger('test_pass');
    
    console.log("\n✅ All tests passed. Clippy is... impressed?");
    console.log("   (Don't let it go to your head.)");
    console.log(`\n📊 Clippy's Mood: ${getClippyMood(state.angerLevel)}`);
    
  } catch (error) {
    console.error("\n❌ TESTS FAILED");
    
    const output = error.stdout ? error.stdout.toString() : error.message;
    
    // Count failed tests from output
    const failMatch = output.match(/(\d+) failed/);
    const failedCount = failMatch ? parseInt(failMatch[1]) : 1;
    
    // Increment anger based on test failures
    const state = incrementAnger('test_fail', { failedCount });
    
    // Generate AI roast for test failures
    const roast = await generateTestFailureRoast(failedCount, output);
    console.error(roast);
    
    console.error(`\n📊 Clippy's Anger Level: ${state.angerLevel}/5`);
    console.error(`   Mood: ${getClippyMood(state.angerLevel)}`);
    
    if (error.stdout) {
      console.log("\n" + error.stdout.toString());
    }
    
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error("💥 Test execution failed:", err.message);
  process.exit(1);
});
