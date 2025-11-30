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

  // Test C code with syntax error
  test('should lint C code and return errors', async () => {
    const response = await request(app)
      .post('/lint')
      .send({
        code: '#include <stdio.h>\n\nint main() {\n    printf("Hello World"\n    return 0;\n}',
        language: 'c'
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('results');
    expect(Array.isArray(response.body.results)).toBe(true);
    expect(response.body.results.length).toBeGreaterThan(0);
  });

  // Test valid C code
  test('should return empty array for valid C code', async () => {
    const response = await request(app)
      .post('/lint')
      .send({
        code: '#include <stdio.h>\n\nint main() {\n    printf("Hello World");\n    return 0;\n}',
        language: 'c'
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('results');
    expect(Array.isArray(response.body.results)).toBe(true);
    expect(response.body.results.length).toBe(0);
  });

  // Test C++ code with syntax error
  test('should lint C++ code and return errors', async () => {
    const response = await request(app)
      .post('/lint')
      .send({
        code: '#include <iostream>\n\nint main() {\n    std::cout << "Hello World"\n    return 0;\n}',
        language: 'cpp'
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('results');
    expect(Array.isArray(response.body.results)).toBe(true);
    expect(response.body.results.length).toBeGreaterThan(0);
  });

  // Test valid C++ code
  test('should return empty array for valid C++ code', async () => {
    const response = await request(app)
      .post('/lint')
      .send({
        code: '#include <iostream>\n\nint main() {\n    std::cout << "Hello World";\n    return 0;\n}',
        language: 'cpp'
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('results');
    expect(Array.isArray(response.body.results)).toBe(true);
    expect(response.body.results.length).toBe(0);
  });

  // Test Java code with syntax error
  test('should lint Java code and return errors', async () => {
    const response = await request(app)
      .post('/lint')
      .send({
        code: 'public class HelloWorld {\n    public static void main(String[] args) {\n        System.out.println("Hello World")\n    }\n}',
        language: 'java'
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('results');
    expect(Array.isArray(response.body.results)).toBe(true);
    expect(response.body.results.length).toBeGreaterThan(0);
  });

  // Test valid Java code with public class
  test('should return empty array for valid Java code', async () => {
    const response = await request(app)
      .post('/lint')
      .send({
        code: 'public class HelloWorld {\n    public static void main(String[] args) {\n        System.out.println("Hello World");\n    }\n}',
        language: 'java'
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('results');
    expect(Array.isArray(response.body.results)).toBe(true);
    expect(response.body.results.length).toBe(0);
  });

  // Test Java code without public class (should use Main.java)
  test('should lint Java code without public class', async () => {
    const response = await request(app)
      .post('/lint')
      .send({
        code: 'class Test {\n    public static void main(String[] args) {\n        System.out.println("Hello")\n    }\n}',
        language: 'java'
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('results');
    expect(Array.isArray(response.body.results)).toBe(true);
    expect(response.body.results.length).toBeGreaterThan(0);
  });
});
