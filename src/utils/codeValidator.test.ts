import { describe, it, expect } from 'vitest';
import { validateCode } from './codeValidator';

describe('codeValidator', () => {
  it('should return errors for code missing semicolons', () => {
    const code = `
const x = 5
const y = 10
    `.trim();
    
    const errors = validateCode(code);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.reason.toLowerCase().includes('semicolon') || e.reason.includes('Missing semicolon'))).toBe(true);
  });

  it('should return errors for unused variables', () => {
    const code = `
const unusedVar = 42;
    `.trim();
    
    const errors = validateCode(code);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.reason.toLowerCase().includes('unused'))).toBe(true);
  });

  it('should return empty array for valid code', () => {
    const code = `
const x = 5;
console.log(x);
    `.trim();
    
    const errors = validateCode(code);
    expect(errors.length).toBe(0);
  });

  it('should return error objects with correct format', () => {
    const code = `const x = 5`;
    
    const errors = validateCode(code);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toHaveProperty('line');
    expect(errors[0]).toHaveProperty('reason');
    expect(typeof errors[0].line).toBe('number');
    expect(typeof errors[0].reason).toBe('string');
  });

  it('should handle invalid input gracefully', () => {
    const code = '';
    
    const errors = validateCode(code);
    expect(Array.isArray(errors)).toBe(true);
  });
});
