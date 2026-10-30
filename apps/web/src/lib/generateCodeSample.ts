import type { MaskMode } from '@pii-mask/core';

interface CodeSampleOptions {
  mode: MaskMode;
  format: 'string' | 'object' | 'array';
  disabledDetectors: string[];
}

export function generateCodeSample(opts: CodeSampleOptions): string {
  const maskerArgs: Record<string, unknown> = { mode: opts.mode };
  const isSubstitute = opts.mode === 'substitute';
  if (opts.disabledDetectors.length > 0) {
    maskerArgs.disable = opts.disabledDetectors;
  }

  let maskerCall = `createMasker(${JSON.stringify(maskerArgs, null, 2)})`;
  if (isSubstitute) {
    // substitute mode takes a faker instance
    maskerCall = maskerCall.replace(/\n}\)$/, ',\n  faker\n})');
  }

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

  const fakerImport = isSubstitute ? `\nimport { faker } from '@faker-js/faker';` : '';

  return `import { createMasker } from '@pii-mask/core';${fakerImport}

const masker = ${maskerCall};

const { result${opts.mode === 'tokenize' ? ', tokenMap' : ''} } = masker.${method}(
  ${inputComment}
);${restoreLine}`;
}
