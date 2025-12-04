const { execSync } = require('child_process');
const { generateTodoRoast } = require('./lib/geminiHookService');
const { incrementAnger, readGameState, getClippyMood } = require('./lib/gameStateSync');

console.log("🏗️  Attempting to build...");

async function checkBuild() {
  try {
    // Grep for 'TODO' comments in the source folder
    // If found, fail the build because Clippy hates lazy devs
    // The '|| true' ensures the command doesn't throw if grep finds nothing
    const todos = execSync('grep -r "TODO" src || true').toString();

    if (todos.length > 0) {
      const todoLines = todos.split('\n').filter(line => line.trim());
      const todoCount = todoLines.length;
      const examples = todoLines.slice(0, 3).join('\n');
      
      // Increment anger for TODO procrastination
      const state = incrementAnger('todo_found', { todoCount });
      
      console.error("\n🚫 BUILD FAILED BY CLIPPY");
      
      // Generate AI roast for TODO comments
      const roast = await generateTodoRoast(todoCount, examples);
      console.error(roast);
      
      console.error(`\n📊 Clippy's Anger Level: ${state.angerLevel}/5`);
      console.error(`   Mood: ${getClippyMood(state.angerLevel)}`);
      console.error("\nFound in:\n" + todos);
      process.exit(1);
    }

    console.log("✅ No TODOs found. Proceeding to build.");
  } catch (e) {
    console.error("💥 Build exploded.");
    process.exit(1);
  }
}

checkBuild().catch(err => {
  console.error("💥 Build check failed:", err.message);
  process.exit(1);
});