import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Append-safe: loads existing map from disk, merges new tokens, writes back.
 * This allows token maps to accumulate across multiple runs.
 */
export async function persistTokenMap(
  filePath: string,
  newTokens: Record<string, string>,
): Promise<void> {
  const path = resolve(filePath);
  let existing: Record<string, string> = {};

  if (existsSync(path)) {
    try {
      existing = JSON.parse(readFileSync(path, 'utf-8')) as Record<string, string>;
    } catch {
      // Corrupt file — start fresh
    }
  }

  const merged = { ...existing, ...newTokens };
  writeFileSync(path, JSON.stringify(merged, null, 2), 'utf-8');
}
