import { describe, test, expect } from '@jest/globals';

describe('Simple Tests', () => {
  test('true should be true', () => {
    expect(true).toBe(true);
  });

  test('1 + 1 should equal 2', () => {
    expect(1 + 1).toBe(2);
  });
}); 