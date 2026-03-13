import { describe, it, expect } from 'vitest';

// This test simply checks that the wrapper can be imported without error.
describe('pii-mask-cli wrapper', () => {
  it('should import without error', async () => {
    let error: Error | null = null;
    try {
      await import('./index');
    } catch (e) {
      error = e as Error;
    }
    expect(error).toBeNull();
  });
});
