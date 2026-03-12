import { docs } from '@/.source';
import { loader } from 'fumadocs-core/source';

// fumadocs-mdx v11 returns source.files as a lazy function,
// but fumadocs-core v15.8.5 expects a plain array.
// Unwrap it to fix the "a.map is not a function" build error.
const raw = docs.toFumadocsSource();
const files = typeof raw.files === 'function' ? (raw.files as () => typeof raw.files)() : raw.files;

export const source = loader({
  baseUrl: '/docs',
  source: { files },
});
