import { useMemo } from 'react';
import { useHighlighter } from '../../hooks/useHighlighter.js';

interface HighlightedCodeProps {
  code: string;
  lang?: 'json' | 'typescript' | 'text';
  className?: string;
}

export function HighlightedCode({ code, lang = 'text', className = '' }: HighlightedCodeProps) {
  const { ready, highlight } = useHighlighter();

  const html = useMemo(() => {
    if (!ready || !code) return '';
    return highlight(code, lang);
  }, [ready, code, lang, highlight]);

  const lineCount = code ? code.split('\n').length : 0;

  if (!ready || !code) {
    return (
      <div className={`code-editor ${className}`}>
        <div className="code-lines">
          <pre className="text-[13px] font-mono text-text-primary whitespace-pre-wrap">{code}</pre>
        </div>
      </div>
    );
  }

  return (
    <div className={`code-editor ${className}`}>
      <div className="line-numbers" aria-hidden>
        {Array.from({ length: lineCount }, (_, i) => (
          <span key={i}>{i + 1}</span>
        ))}
      </div>
      <div className="code-lines" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
