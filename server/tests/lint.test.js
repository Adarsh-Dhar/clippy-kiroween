const request = require('supertest');
const app = require('../index');

describe('POST /lint', () => {
  // Test with valid Python code containing errors
  test('should lint Python code and return errors', async () => {
    const response = await request(app)
      .post('/lint')
      .send({
        code: 'def hello():\n  print("Hello"\n',
        language: 'python'
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('results');
    expect(Array.isArray(response.body.results)).toBe(true);
  });

  // Test with valid Go code
  test('should lint Go code', async () => {
    const response = await request(app)
      .post('/lint')
      .send({
        code: 'package main\n\nfunc main() {\n}\n',
        language: 'go'
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('results');
    expect(Array.isArray(response.body.results)).toBe(true);
  });

  // Test with valid JavaScript code
  test('should lint JavaScript code', async () => {
    const response = await request(app)
      .post('/lint')
      .send({
        code: 'var x = 1;\nconsole.log(x);\n',
        language: 'javascript'
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('results');
    expect(Array.isArray(response.body.results)).toBe(true);
  });

  // Test missing code field
  test('should return 400 when code field is missing', async () => {
    const response = await request(app)
      .post('/lint')
      .send({
        language: 'python'
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('code');
  });

  // Test missing language field
  test('should return 400 when language field is missing', async () => {
    const response = await request(app)
      .post('/lint')
      .send({
        code: 'print("hello")'
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('language');
  });

  // Test unsupported language
  test('should return 400 for unsupported language', async () => {
    const response = await request(app)
      .post('/lint')
      .send({
        code: 'puts "hello"',
        language: 'ruby'
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('Unsupported language');
  });

  // Test code with no errors (valid code)
  test('should return empty array for valid code with no errors', async () => {
    const response = await request(app)
      .post('/lint')
      .send({
        code: '"""Module docstring."""\n\ndef hello():\n    """Function docstring."""\n    print("Hello")\n',
        language: 'python'
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('results');
    expect(Array.isArray(response.body.results)).toBe(true);
    // Note: May still have some warnings depending on pylint config
  });
});
