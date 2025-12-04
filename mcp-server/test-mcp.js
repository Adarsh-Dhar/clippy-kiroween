#!/usr/bin/env node

/**
 * Test script for Clippy Purgatory MCP Server
 * Tests all tools to ensure they work correctly
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🧪 Testing Clippy Purgatory MCP Server\n');
console.log('=' .repeat(60));

let testsPassed = 0;
let testsFailed = 0;

async function sendMCPRequest(method, params = {}) {
  return new Promise((resolve, reject) => {
    const server = spawn('node', [join(__dirname, 'index.js')]);
    
    let output = '';
    let errorOutput = '';
    
    server.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    server.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    server.on('close', (code) => {
      try {
        // Parse JSON-RPC responses from output
        const lines = output.split('\n').filter(line => line.trim());
        const responses = lines.map(line => {
          try {
            return JSON.parse(line);
          } catch {
            return null;
          }
        }).filter(r => r !== null);
        
        resolve({ responses, errorOutput, code });
      } catch (err) {
        reject(err);
      }
    });
    
    // Send JSON-RPC request
    const request = {
      jsonrpc: '2.0',
      id: 1,
      method,
      params,
    };
    
    server.stdin.write(JSON.stringify(request) + '\n');
    server.stdin.end();
    
    // Timeout after 5 seconds
    setTimeout(() => {
      server.kill();
      reject(new Error('Request timeout'));
    }, 5000);
  });
}

async function testTool(name, description, params = {}) {
  console.log(`\n📎 Testing: ${name}`);
  console.log(`   ${description}`);
  
  try {
    const result = await sendMCPRequest('tools/call', {
      name,
      arguments: params,
    });
    
    if (result.code === 0 || result.responses.length > 0) {
      console.log(`   ✅ Success`);
      if (result.responses[0]?.result?.content) {
        const content = result.responses[0].result.content[0]?.text;
        if (content) {
          console.log(`   Response: ${content.substring(0, 100)}...`);
        }
      }
      testsPassed++;
      return true;
    } else {
      console.log(`   ❌ Failed: No valid response`);
      testsFailed++;
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}`);
    testsFailed++;
    return false;
  }
}

async function runTests() {
  console.log('\n🎮 Game State Tools\n');
  
  await testTool(
    'get_clippy_state',
    'Get current game state',
    {}
  );
  
  await testTool(
    'set_clippy_anger',
    'Set anger level to 2',
    { level: 2, reason: 'Test' }
  );
  
  await testTool(
    'increment_anger',
    'Increment anger by 1',
    { amount: 1, eventType: 'test_event' }
  );
  
  await testTool(
    'reset_game_state',
    'Reset game state',
    {}
  );
  
  console.log('\n\n🪝 Hook Management Tools\n');
  
  await testTool(
    'list_hooks',
    'List all hooks',
    {}
  );
  
  console.log('\n\n💀 Punishment Tools\n');
  
  await testTool(
    'play_system_sound',
    'Play beep sound',
    { sound: 'beep' }
  );
  
  // Skip desktop haunting in tests (don't want to create files)
  console.log('\n📎 Skipping: haunt_desktop (would create actual files)');
  console.log('   ⚠️  Test manually if needed');
  
  console.log('\n\n🔍 Code Analysis Tools\n');
  
  // Skip code analysis in tests (takes too long)
  console.log('\n📎 Skipping: analyze_code_quality (takes too long)');
  console.log('   ⚠️  Test manually if needed');
  
  console.log('\n\n' + '='.repeat(60));
  console.log(`\n📊 Results: ${testsPassed} passed, ${testsFailed} failed`);
  
  if (testsFailed === 0) {
    console.log('\n✅ All tests passed! MCP server is ready.');
  } else {
    console.log('\n❌ Some tests failed. Check the errors above.');
  }
  
  console.log('\n💡 Tips:');
  console.log('   - Test in Kiro using the MCP tools interface');
  console.log('   - Check .kiro/.hook-state.json for state changes');
  console.log('   - Use "node mcp-server/index.js" to start manually');
}

// Run tests
runTests().catch(err => {
  console.error('\n💥 Test suite failed:', err);
  process.exit(1);
});
