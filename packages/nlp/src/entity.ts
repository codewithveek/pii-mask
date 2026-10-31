import nlp from 'compromise';
import { getOrCreateToken, getOrCreateLabel } from '@pii-mask/core';
import type { PIIDetector } from '@pii-mask/core';
import { PIICategory, MaskMode } from '@pii-mask/core';

export type EntityKind = 'Person' | 'Place' | 'Organization';
export type Lexicon = Record<string, EntityKind>;

interface EntityConfig {
  id: string;
  label: string;
  /** Prefix for pseudonymize labels, e.g. PERSON → PERSON_1 */
  prefix: string;
  /** Placeholder when substitute mode has no faker */
  fallback: string;
  substitute: (faker: NonNullable<Parameters<PIIDetector['mask']>[2]['faker']>) => string;
}

const CONFIG: Record<EntityKind, EntityConfig> = {
  Person: {
    id: 'nlp-person',
    label: 'Person Name (NLP)',
    prefix: 'PERSON',
    fallback: '[NAME]',
    substitute: (f) => f.person.fullName() as string,
  },
  Place: {
    id: 'nlp-place',
    label: 'Place / Location (NLP)',
    prefix: 'PLACE',
    fallback: '[PLACE]',
    substitute: (f) => f.location.city() as string,
  },
  Organization: {
    id: 'nlp-organization',
    label: 'Organization (NLP)',
    prefix: 'ORG',
    fallback: '[ORG]',
    substitute: (f) => f.company.name() as string,
  },
};

type Doc = ReturnType<typeof nlp>;
type Span = { start: number; end: number };

// Parsing is the expensive part and the masker asks every NLP detector about
// the same string (detect, then find), so recent parses are reused.
const CACHE_SIZE = 16;
const cache = new Map<string, Doc>();

function parse(text: string): Doc {
  let doc = cache.get(text);
  if (!doc) {
    doc = nlp(text);
    if (cache.size >= CACHE_SIZE) cache.delete(cache.keys().next().value!);
    cache.set(text, doc);
  }
  return doc;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Custom lexicon entries of one kind as a whole-word, case-insensitive regex.
 * compromise's own lexicon option (`nlp(text, lexicon)`, `nlp.extend`) changes
 * its global state for every later call, so it is deliberately not used.
 */
function lexiconMatcher(kind: EntityKind, lexicon?: Lexicon): RegExp | undefined {
  const words = Object.entries(lexicon ?? {})
    .filter(([, tag]) => tag === kind)
    .map(([word]) => word.trim())
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);
  if (words.length === 0) return undefined;
  return new RegExp(
    `(?<![\\p{L}\\p{N}])(?:${words.map(escapeRegExp).join('|')})(?![\\p{L}\\p{N}])`,
    'giu',
  );
}

/**
 * Union of overlapping spans, sorted by start. Spans separated only by
 * whitespace are joined too, so lexicon entries "Emeka" + "Okafor" mask as one
 * name.
 */
function mergeSpans(text: string, spans: Span[]): Span[] {
  const sorted = [...spans].sort((a, b) => a.start - b.start);
  const out: Span[] = [];
  for (const s of sorted) {
    const last = out[out.length - 1];
    const touches = last && (s.start <= last.end || !text.slice(last.end, s.start).trim());
    if (last && touches) last.end = Math.max(last.end, s.end);
    else out.push({ ...s });
  }
  return out;
}

// compromise's view types differ per method; only `.json()` is used on them
type View = { json(options: { offset: boolean }): unknown };

function select(doc: Doc, kind: EntityKind): View {
  if (kind === 'Person') return doc.people();
  if (kind === 'Place') return doc.places();
  return doc.organizations();
}

/** Character spans of entities, with compromise's trailing punctuation trimmed. */
function findSpans(text: string, kind: EntityKind, lexiconRe?: RegExp): Span[] {
  const matches = select(parse(text), kind).json({ offset: true }) as Array<{
    offset: { start: number; length: number };
  }>;
  const spans: Span[] = [];
  for (const { offset } of matches) {
    let start = offset.start;
    let end = offset.start + offset.length;
    while (end > start && !/[\p{L}\p{N}]/u.test(text[end - 1]!)) end--;
    while (start < end && !/[\p{L}\p{N}]/u.test(text[start]!)) start++;
    if (end > start) spans.push({ start, end });
  }
  if (lexiconRe) {
    for (const m of text.matchAll(lexiconRe)) {
      spans.push({ start: m.index, end: m.index + m[0].length });
    }
  }
  return lexiconRe ? mergeSpans(text, spans) : spans;
}

/** Default mask: keep each word's first letter — "John Smith" → "J*** S****". */
function maskWords(value: string): string {
  return value.replace(/\p{L}+/gu, (w) => w[0] + '*'.repeat(w.length - 1));
}

export function buildEntityDetector(
  kind: EntityKind,
  options: { confidence?: number; lexicon?: Lexicon | undefined } = {},
): PIIDetector {
  const { confidence = 0.7, lexicon } = options;
  const config = CONFIG[kind];
  const lexiconRe = lexiconMatcher(kind, lexicon);

  return {
    id: config.id,
    label: config.label,
    category: PIICategory.IDENTITY,

    // Whole-value detection: the entity must make up most of the value, so a
    // sentence that merely mentions a city isn't replaced wholesale.
    detect(value) {
      const trimmed = value.trim();
      if (!trimmed || !/\p{L}/u.test(trimmed)) return false;
      const spans = findSpans(trimmed, kind, lexiconRe);
      if (spans.length === 0) return false;
      const covered = spans.reduce((n, s) => n + (s.end - s.start), 0);
      return covered / trimmed.replace(/\s+/g, ' ').length >= confidence;
    },

    // Freeform text: only the entity spans are masked.
    find(text) {
      // compromise relies on capitalisation; without a lexicon (whose entries
      // may be lower-case) all-lower-case text can be skipped cheaply
      if (!lexiconRe && !/\p{Lu}/u.test(text)) return [];
      return findSpans(text, kind, lexiconRe);
    },

    mask(value, mode, ctx) {
      if (mode === MaskMode.REDACT) return '[REDACTED]';
      if (mode === MaskMode.TOKENIZE) return getOrCreateToken(value, ctx);
      if (mode === MaskMode.PSEUDONYMIZE || mode === MaskMode.ANONYMIZE) {
        return getOrCreateLabel(config.prefix, value, ctx, PIICategory.IDENTITY);
      }
      if (mode === MaskMode.SUBSTITUTE) {
        return ctx.faker ? config.substitute(ctx.faker) : config.fallback;
      }
      return maskWords(value);
    },
  };
}
