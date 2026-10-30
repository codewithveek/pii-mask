import { readFileSync, writeFileSync, existsSync, chmodSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Append-safe: loads existing map from disk, merges new tokens, writes back.
 * This allows token maps to accumulate across multiple runs.
 *
 * The file holds the original PII in plain text, so it is written readable by
 * the owner only (0600).
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
  writeFileSync(path, JSON.stringify(merged, null, 2), { encoding: 'utf-8', mode: 0o600 });
  // `mode` only applies when the file is created; tighten an existing file too
  chmodSync(path, 0o600);
}
