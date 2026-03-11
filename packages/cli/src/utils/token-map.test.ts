import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { writeFileSync, readFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { persistTokenMap } from './token-map';

const tmpDir = resolve(__dirname, '__test_tmp__');

describe('persistTokenMap', () => {
  beforeEach(() => {
    mkdirSync(tmpDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
  });

  it('creates a new token map file', async () => {
    const filePath = join(tmpDir, 'tokens.json');
    await persistTokenMap(filePath, { '<<PII_abc>>': 'test@example.com' });

    const content = JSON.parse(readFileSync(filePath, 'utf-8'));
    expect(content['<<PII_abc>>']).toBe('test@example.com');
  });

  it('merges with existing token map', async () => {
    const filePath = join(tmpDir, 'tokens.json');
    writeFileSync(filePath, JSON.stringify({ existing: 'value' }), 'utf-8');

    await persistTokenMap(filePath, { newKey: 'newValue' });

    const content = JSON.parse(readFileSync(filePath, 'utf-8'));
    expect(content.existing).toBe('value');
    expect(content.newKey).toBe('newValue');
  });

  it('handles corrupt existing file', async () => {
    const filePath = join(tmpDir, 'tokens.json');
    writeFileSync(filePath, 'not valid json', 'utf-8');

    await persistTokenMap(filePath, { key: 'value' });

    const content = JSON.parse(readFileSync(filePath, 'utf-8'));
    expect(content.key).toBe('value');
  });
});
