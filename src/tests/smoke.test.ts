import { describe, test, expect } from 'vitest';

describe('Test Infrastructure', () => {
  test('vitest runs', () => {
    expect(true).toBe(true);
  });

  test('vitest globals work', () => {
    // If this test runs, globals are configured correctly
    expect(describe).toBeDefined();
    expect(test).toBeDefined();
    expect(expect).toBeDefined();
  });
});
