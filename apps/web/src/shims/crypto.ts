export function randomBytes(size: number): { toString(encoding: string): string } {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  return {
    toString(encoding: string) {
      if (encoding === 'hex') {
        return Array.from(bytes)
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');
      }
      throw new Error(`Unsupported encoding: ${encoding}`);
    },
  };
}
