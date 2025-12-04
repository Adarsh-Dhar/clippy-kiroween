#!/usr/bin/env node

/**
 * Clippy Hooks CLI
 * Manage and test hooks from the command line
 */

const { readGameState, resetGameState, getClippyMood } = require('./lib/gameStateSync');
const fs = require('fs');
const path = require('path');

const HOOKS_CONFIG = path.join(__dirname, 'hooks.json');

function showHelp() {
  console.log(`
📎 Clippy Hooks CLI

Usage: node .kiro/hooks/clippy-hooks.js <command>

Commands:
  status          Show current game state and Clippy's mood
  reset           Reset game state (anger level, error count)
  list            List all configured hooks
  enable <name>   Enable a specific hook
  disable <name>  Disable a specific hook
  test            Run integration tests
  help            Show this help message

Examples:
  node .kiro/hooks/clippy-hooks.js status
  node .kiro/hooks/clippy-hooks.js reset
  node .kiro/hooks/clippy-hooks.js disable "Test Runner with Roast"
`);
}

function showStatus() {
  const state = readGameState();
  
  console.log('\n📊 Current Game State\n');
  console.log('═'.repeat(50));
  console.log(`Anger Level:  ${state.angerLevel}/5`);
  console.log(`Error Count:  ${state.errorCount}`);
  console.log(`Mood:         ${getClippyMood(state.angerLevel)}`);
  
  if (state.lastEvent) {
    console.log(`\nLast Event:   ${state.lastEvent.type}`);
    console.log(`Timestamp:    ${new Date(state.lastEvent.timestamp).toLocaleString()}`);
    if (state.lastEvent.context) {
      console.log(`Context:      ${JSON.stringify(state.lastEvent.context)}`);
    }
  }
  
  console.log('═'.repeat(50));
  
  // Visual anger meter
  const meterFilled = '█'.repeat(state.angerLevel);
  const meterEmpty = '░'.repeat(5 - state.angerLevel);
  console.log(`\n📈 Anger Meter: [${meterFilled}${meterEmpty}]`);
  
  if (state.angerLevel >= 4) {
    console.log('\n⚠️  WARNING: Clippy is extremely angry!');
    console.log('   Write better code or face the consequences.');
  } else if (state.angerLevel === 0) {
    console.log('\n✅ Clippy is calm. For now.');
  }
  
  console.log('');
}

function resetState() {
  console.log('\n🔄 Resetting game state...');
  const state = resetGameState();
  console.log('✅ Game state reset successfully.');
  console.log(`   Anger Level: ${state.angerLevel}/5`);
  console.log(`   Error Count: ${state.errorCount}`);
  console.log('\n📎 Clippy says: "Fresh start. Don\'t waste it."\n');
}

function listHooks() {
  try {
    const config = JSON.parse(fs.readFileSync(HOOKS_CONFIG, 'utf-8'));
    
    console.log('\n🪝 Configured Hooks\n');
    console.log('═'.repeat(70));
    
    config.hooks.forEach((hook, index) => {
      const status = hook.enabled ? '✅' : '❌';
      console.log(`\n${index + 1}. ${status} ${hook.name}`);
      console.log(`   Event:       ${hook.event}`);
      console.log(`   Command:     ${hook.command}`);
      console.log(`   Description: ${hook.description}`);
      if (hook.pattern) {
        console.log(`   Pattern:     ${hook.pattern}`);
      }
    });
    
    console.log('\n' + '═'.repeat(70));
    
    const enabled = config.hooks.filter(h => h.enabled).length;
    const total = config.hooks.length;
    console.log(`\n📊 ${enabled}/${total} hooks enabled\n`);
    
  } catch (error) {
    console.error('❌ Error reading hooks config:', error.message);
  }
}

function toggleHook(name, enable) {
  try {
    const config = JSON.parse(fs.readFileSync(HOOKS_CONFIG, 'utf-8'));
    
    const hook = config.hooks.find(h => h.name === name);
    
    if (!hook) {
      console.error(`❌ Hook not found: "${name}"`);
      console.log('\nAvailable hooks:');
      config.hooks.forEach(h => console.log(`  - ${h.name}`));
      return;
    }
    
    hook.enabled = enable;
    
    fs.writeFileSync(HOOKS_CONFIG, JSON.stringify(config, null, 2));
    
    const action = enable ? 'enabled' : 'disabled';
    console.log(`\n✅ Hook "${name}" ${action} successfully.\n`);
    
  } catch (error) {
    console.error('❌ Error updating hooks config:', error.message);
  }
}

function runTests() {
  console.log('\n🧪 Running integration tests...\n');
  const { execSync } = require('child_process');
  
  try {
    execSync('node .kiro/hooks/test-integration.js', { stdio: 'inherit' });
  } catch (error) {
    console.error('\n❌ Tests failed.');
    process.exit(1);
  }
}

// Main CLI logic
const command = process.argv[2];
const arg = process.argv[3];

switch (command) {
  case 'status':
    showStatus();
    break;
    
  case 'reset':
    resetState();
    break;
    
  case 'list':
    listHooks();
    break;
    
  case 'enable':
    if (!arg) {
      console.error('❌ Please specify a hook name.');
      console.log('Usage: node clippy-hooks.js enable "Hook Name"');
    } else {
      toggleHook(arg, true);
    }
    break;
    
  case 'disable':
    if (!arg) {
      console.error('❌ Please specify a hook name.');
      console.log('Usage: node clippy-hooks.js disable "Hook Name"');
    } else {
      toggleHook(arg, false);
    }
    break;
    
  case 'test':
    runTests();
    break;
    
  case 'help':
  case '--help':
  case '-h':
    showHelp();
    break;
    
  default:
    console.error(`❌ Unknown command: ${command || '(none)'}`);
    showHelp();
    process.exit(1);
}
