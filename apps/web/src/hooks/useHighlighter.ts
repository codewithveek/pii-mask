import { useState, useEffect, useCallback } from 'react';
import { createHighlighterCore, type HighlighterCore } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
import themeSrc from 'shiki/themes/github-dark-default.mjs';
import langJson from 'shiki/langs/json.mjs';
import langTs from 'shiki/langs/typescript.mjs';

const THEME = 'github-dark-default';

let highlighterPromise: Promise<HighlighterCore> | undefined;

function getHighlighter(): Promise<HighlighterCore> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighterCore({
      themes: [themeSrc],
      langs: [langJson, langTs],
      engine: createJavaScriptRegexEngine(),
    });
  }
  return highlighterPromise;
}

type Lang = 'json' | 'typescript' | 'text';

export function useHighlighter() {
  const [hl, setHl] = useState<HighlighterCore | null>(null);

  useEffect(() => {
    let cancelled = false;
    getHighlighter().then((h) => {
      if (!cancelled) setHl(h);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const highlight = useCallback(
    (code: string, lang: Lang = 'text'): string => {
      if (!hl || !code) return '';
      // 'text' has no grammar — render with consistent markup but no syntax colors
      if (lang === 'text') {
        const escaped = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const lines = escaped
          .split('\n')
          .map((l) => `<span class="line">${l}</span>`)
          .join('\n');
        return `<pre class="shiki" style="background-color:transparent"><code>${lines}</code></pre>`;
      }
      return hl.codeToHtml(code, { theme: THEME, lang });
    },
    [hl],
  );

  return { ready: hl !== null, highlight };
}
