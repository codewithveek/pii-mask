export function parseJSONL(text: string): Record<string, unknown>[] {
  return text
    .split('\n')
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line) as Record<string, unknown>);
}

export function jsonlToString(records: unknown[]): string {
  return records.map((r) => JSON.stringify(r)).join('\n');
}
