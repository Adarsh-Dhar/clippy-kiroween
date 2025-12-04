#!/usr/bin/env node

/**
 * Test script to verify Gemini integration with hooks
 * Run: node .kiro/hooks/test-integration.js
 */

const {
  generateFileSaveResponse,
  generateLargeFileRoast,
  generateCommitMessageRoast,
  generateTestFailureRoast,
  generateTodoRoast,
  generateComplexityRoast,
  generateAuditResponse,
} = require('./lib/geminiHookService');

console.log('🧪 Testing Gemini Hook Integration\n');
console.log('=' .repeat(60));

async function runTests() {
  const tests = [
    {
      name: 'File Save Response',
      fn: () => generateFileSaveResponse('test.js', 1024),
    },
    {
      name: 'Large File Roast',
      fn: () => generateLargeFileRoast('bigfile.js', 8192),
    },
    {
      name: 'Commit Message Roast',
      fn: () => generateCommitMessageRoast('fix bug', ['Too short', 'No capital letter']),
    },
    {
      name: 'Test Failure Roast',
      fn: () => generateTestFailureRoast(3, 'Expected true but got false'),
    },
    {
      name: 'TODO Roast',
      fn: () => generateTodoRoast(5, 'src/app.js:10: // TODO: fix this\nsrc/utils.js:42: // TODO: refactor'),
    },
    {
      name: 'Complexity Roast',
      fn: () => generateComplexityRoast('messyCode.js', 150),
    },
    {
      name: 'Audit Response (Clean)',
      fn: () => generateAuditResponse(false, false),
    },
    {
      name: 'Audit Response (Issues)',
      fn: () => generateAuditResponse(true, true),
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      console.log(`\n📎 Testing: ${test.name}`);
      const result = await test.fn();
      
      if (result) {
        console.log(`✅ Success`);
        console.log(`   Response: "${result}"`);
        passed++;
      } else {
        console.log(`⚠️  Fallback (API key not set or API unavailable)`);
        console.log(`   This is expected if GEMINI_API_KEY is not configured.`);
        passed++;
      }
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
      failed++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('\n✅ All tests passed! Clippy is ready to judge your code.');
  } else {
    console.log('\n❌ Some tests failed. Check the errors above.');
  }

  if (!process.env.GEMINI_API_KEY) {
    console.log('\n💡 Tip: Set GEMINI_API_KEY in server/.env for AI-generated responses.');
    console.log('   Without it, hooks will use fallback responses.');
  }
}

runTests().catch(err => {
  console.error('\n💥 Test suite failed:', err);
  process.exit(1);
});
