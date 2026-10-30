export interface ParsedCSV {
  headers: string[];
  rows: string[][];
  /** Line ending used by the input ('\r\n' or '\n'), reused for output. */
  eol: '\n' | '\r\n';
  /** Whether the input ended with a line break. */
  trailingNewline: boolean;
}

/**
 * RFC 4180 parser: quoted fields may contain commas, quotes ("") and line
 * breaks; CRLF and LF line endings and a UTF-8 BOM are handled. Blank lines
 * are skipped.
 */
export function parseCSV(text: string): ParsedCSV {
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const eol = text.includes('\r\n') ? '\r\n' : '\n';
  const trailingNewline = text.endsWith('\n');

  const records: string[][] = [];
  let record: string[] = [];
  let field = '';
  let inQuotes = false;
  let sawContent = false;

  const endRecord = () => {
    record.push(field);
    if (sawContent || record.length > 1) records.push(record);
    record = [];
    field = '';
    sawContent = false;
  };

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      sawContent = true;
    } else if (ch === ',') {
      record.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      endRecord();
    } else {
      field += ch;
      if (ch.trim()) sawContent = true;
    }
  }
  if (field || sawContent || record.length) endRecord();

  const [headers = [], ...rows] = records;
  return { headers, rows, eol, trailingNewline };
}

export function csvToString(rows: string[][], eol: '\n' | '\r\n' = '\n'): string {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          if (/[",\r\n]/.test(cell) || cell !== cell.trim()) {
            return `"${cell.replace(/"/g, '""')}"`;
          }
          return cell;
        })
        .join(','),
    )
    .join(eol);
}

/**
 * Spreadsheet apps execute cells starting with = + - @ (and tab/CR) as
 * formulas. Masked values (e.g. a substituted "+1 555…" phone) are prefixed
 * with a quote so they open as text.
 */
export function neutralizeFormula(cell: string): string {
  return /^[=+\-@\t\r]/.test(cell) ? `'${cell}` : cell;
}
