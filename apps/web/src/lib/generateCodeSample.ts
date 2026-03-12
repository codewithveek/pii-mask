import type { MaskMode } from '@pii-mask/core';

interface CodeSampleOptions {
  mode: MaskMode;
  format: 'string' | 'object' | 'array';
  disabledDetectors: string[];
}

export function generateCodeSample(opts: CodeSampleOptions): string {
  const maskerArgs: Record<string, unknown> = { mode: opts.mode };
  if (opts.disabledDetectors.length > 0) {
    maskerArgs.disable = opts.disabledDetectors;
  }

  const maskerCall = `createMasker(${JSON.stringify(maskerArgs, null, 2)})`;

  const methodMap = {
    string: 'maskString',
    object: 'maskObject',
    array: 'maskArray',
  } as const;

  const method = methodMap[opts.format];
  const inputComment = {
    string: '// your string here',
    object: '// your object here',
    array: '// your array here',
  }[opts.format];

  const restoreLine =
    opts.mode === 'tokenize'
      ? `\n\n// Restore originals\nconst restored = masker.restore(result, tokenMap);`
      : '';

  return `import { createMasker } from '@pii-mask/core';

const masker = ${maskerCall};

const { result${opts.mode === 'tokenize' ? ', tokenMap' : ''} } = masker.${method}(
  ${inputComment}
);${restoreLine}`;
}
