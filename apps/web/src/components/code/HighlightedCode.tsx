import { useMemo } from 'react';
import { useHighlighter } from '../../hooks/useHighlighter.js';

interface HighlightedCodeProps {
  code: string;
  lang?: 'json' | 'typescript' | 'text';
  className?: string;
  showLineNumbers?: boolean;
}

export function HighlightedCode({
  code,
  lang = 'text',
  className = '',
  showLineNumbers = true,
}: HighlightedCodeProps) {
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
          <pre className="text-[13px] font-mono text-inherit whitespace-pre-wrap leading-[1.3]">
            {code}
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div className={`code-editor ${className}`}>
      {showLineNumbers && (
        <div className="line-numbers" aria-hidden>
          {Array.from({ length: lineCount }, (_, i) => (
            <span key={i}>{i + 1}</span>
          ))}
        </div>
      )}
      <div className="code-lines" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
