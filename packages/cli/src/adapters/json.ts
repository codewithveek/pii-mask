export function parseJSON(text: string): unknown {
  return JSON.parse(text);
}

export function jsonToString(data: unknown): string {
  return JSON.stringify(data, null, 2);
}
