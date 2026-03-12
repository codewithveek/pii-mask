export type InputFormat = 'string' | 'object' | 'array';

export function detectFormat(input: string): InputFormat {
  const trimmed = input.trim();
  if (!trimmed) return 'string';

  try {
    const parsed: unknown = JSON.parse(trimmed);
    if (Array.isArray(parsed)) return 'array';
    if (parsed !== null && typeof parsed === 'object') return 'object';
    return 'string';
  } catch {
    return 'string';
  }
}
