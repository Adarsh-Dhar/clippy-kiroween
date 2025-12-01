const request = require('supertest');
const app = require('../index');
const { lintAndRoast } = require('../services/roastingService');

describe('POST /roast', () => {
  // Test with valid code (should return compliment)
  test('should generate compliment when no errors exist', async () => {
    const response = await request(app)
      .post('/roast')
      .send({
        code: 'function hello() {\n  return "world";\n}\nconsole.log(hello());',
        language: 'javascript'
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'clean');
    expect(response.body).toHaveProperty('type', 'compliment');
    expect(response.body).toHaveProperty('message');
    expect(typeof response.body.message).toBe('string');
    expect(response.body.message.length).toBeGreaterThan(0);
  });

  // Test with code containing errors (should return roast)
  test('should generate roast when errors exist', async () => {
    const response = await request(app)
      .post('/roast')
      .send({
        code: 'const x = ;',
        language: 'javascript'
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'error');
    expect(response.body).toHaveProperty('type', 'roast');
    expect(response.body).toHaveProperty('roast');
    expect(response.body).toHaveProperty('errors');
    expect(Array.isArray(response.body.errors)).toBe(true);
    expect(response.body.errors.length).toBeGreaterThan(0);
  });

  // Test missing code field
  test('should return 400 when code field is missing', async () => {
    const response = await request(app)
      .post('/roast')
      .send({
        language: 'javascript'
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('code');
  });

  // Test missing language field
  test('should return 400 when language field is missing', async () => {
    const response = await request(app)
      .post('/roast')
      .send({
        code: 'const x = 5;'
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('language');
  });

  // Test unsupported language
  test('should return 400 for unsupported language', async () => {
    const response = await request(app)
      .post('/roast')
      .send({
        code: 'puts "hello"',
        language: 'ruby'
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('Unsupported language');
  });

  // Test response schema includes correct type field for errors
  test('should include type field in error response', async () => {
    const response = await request(app)
      .post('/roast')
      .send({
        code: 'var x = ',
        language: 'javascript'
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('type');
    expect(response.body.type).toBe('roast');
  });

  // Test response schema includes correct type field for clean code
  test('should include type field in compliment response', async () => {
    const response = await request(app)
      .post('/roast')
      .send({
        code: 'function hello() {\n  return "world";\n}\nconsole.log(hello());',
        language: 'javascript'
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('type');
    expect(response.body.type).toBe('compliment');
  });
});

describe('roastingService unit tests', () => {
  // Mock environment variable for tests
  const originalEnv = process.env.GEMINI_API_KEY;

  beforeAll(() => {
    // Set a dummy API key for tests (will use fallback if API fails)
    process.env.GEMINI_API_KEY = 'test-key';
  });

  afterAll(() => {
    // Restore original environment
    process.env.GEMINI_API_KEY = originalEnv;
  });

  // Test compliment generation for clean code
  test('should generate compliment when no errors exist', async () => {
    const code = 'function hello() {\n  return "world";\n}\nconsole.log(hello());';
    const result = await lintAndRoast(code, 'javascript');

    expect(result.status).toBe('clean');
    expect(result.type).toBe('compliment');
    expect(result.message).toBeDefined();
    expect(typeof result.message).toBe('string');
  });

  // Test roast generation for code with errors
  test('should generate roast when errors exist', async () => {
    const code = 'const x = ;';
    const result = await lintAndRoast(code, 'javascript');

    expect(result.status).toBe('error');
    expect(result.type).toBe('roast');
    expect(result.roast).toBeDefined();
    expect(result.errors).toBeDefined();
    expect(Array.isArray(result.errors)).toBe(true);
  });

  // Test fallback compliment when LLM fails (by using invalid API key)
  test('should use fallback compliment when Gemini API fails', async () => {
    // Temporarily set invalid API key
    const tempKey = process.env.GEMINI_API_KEY;
    process.env.GEMINI_API_KEY = '';

    const code = 'function hello() {\n  return "world";\n}\nconsole.log(hello());';
    const result = await lintAndRoast(code, 'javascript');

    expect(result.status).toBe('clean');
    expect(result.type).toBe('compliment');
    expect(result.message).toBeDefined();
    // Should match one of the fallback messages
    expect(result.message).toMatch(/actually runs|StackOverflow|Acceptable|clean|Miracles/);

    // Restore API key
    process.env.GEMINI_API_KEY = tempKey;
  });

  // Test that roast still works for errors (regression test)
  test('should maintain existing roast functionality', async () => {
    const code = 'var x = ';
    const result = await lintAndRoast(code, 'javascript');

    expect(result.status).toBe('error');
    expect(result.type).toBe('roast');
    expect(result.roast).toBeDefined();
    expect(typeof result.roast).toBe('string');
  });

  // Test response schema consistency
  test('should return consistent schema for both error and success cases', async () => {
    const cleanCode = 'function hello() {\n  return "world";\n}\nconsole.log(hello());';
    const errorCode = 'const x = ;';

    const cleanResult = await lintAndRoast(cleanCode, 'javascript');
    const errorResult = await lintAndRoast(errorCode, 'javascript');

    // Both should have status and type fields
    expect(cleanResult).toHaveProperty('status');
    expect(cleanResult).toHaveProperty('type');
    expect(errorResult).toHaveProperty('status');
    expect(errorResult).toHaveProperty('type');

    // Clean should have message, error should have roast and errors
    expect(cleanResult).toHaveProperty('message');
    expect(errorResult).toHaveProperty('roast');
    expect(errorResult).toHaveProperty('errors');
  });
});
