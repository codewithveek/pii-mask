import Link from 'next/link';

const codeExample = `import { createMasker } from '@pii-mask/core';

const masker = createMasker({ mode: 'mask' });

masker.maskObject({
  email: 'lucky@example.com',
  phone: '+2348012345678',
  nin: '12345678901',
});
// → { email: 'lu***y@example.com',
//     phone: '***-***-5678',
//     nin: '***-***-8901' }`;

export default function LandingPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--color-bg)',
        color: 'var(--color-text-primary)',
      }}
    >
      {/* Header */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 32px',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <span style={{ fontSize: '18px', fontWeight: 600 }}>pii-mask</span>
        <nav style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <Link
            href="/docs"
            style={{
              fontSize: '14px',
              color: 'var(--color-text-secondary)',
              textDecoration: 'none',
            }}
          >
            Docs
          </Link>
          <a
            href="https://github.com/codewithveek/pii-mask"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: '14px',
              color: 'var(--color-text-secondary)',
              textDecoration: 'none',
            }}
          >
            GitHub
          </a>
        </nav>
      </header>

      {/* Hero */}
      <main style={{ maxWidth: '960px', margin: '0 auto', padding: '80px 32px 64px' }}>
        <h1
          style={{
            fontSize: '48px',
            fontWeight: 700,
            lineHeight: 1.1,
            marginBottom: '16px',
          }}
        >
          Mask, redact, and anonymize PII
          <br />
          in any JavaScript environment.
        </h1>
        <p
          style={{
            fontSize: '18px',
            color: 'var(--color-text-secondary)',
            marginBottom: '32px',
            maxWidth: '640px',
          }}
        >
          Strings, objects, files, React components — one API, zero server calls.
        </p>

        {/* Install command */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '12px',
            padding: '10px 16px',
            backgroundColor: 'var(--color-surface-2)',
            border: '1px solid var(--color-border)',
            borderRadius: '6px',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '14px',
            marginBottom: '32px',
          }}
        >
          <span style={{ color: 'var(--color-text-disabled)' }}>$</span>
          <span>npm install @pii-mask/core</span>
        </div>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '64px' }}>
          <Link
            href="/docs"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '10px 20px',
              backgroundColor: 'var(--color-accent)',
              color: 'white',
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: 500,
              textDecoration: 'none',
            }}
          >
            Read the docs
          </Link>
          <a
            href="https://app.pii-mask.dev"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '10px 20px',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-secondary)',
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: 500,
              textDecoration: 'none',
            }}
          >
            Try it in the browser →
          </a>
        </div>

        {/* Code example */}
        <div
          style={{
            backgroundColor: 'var(--color-surface-2)',
            border: '1px solid var(--color-border)',
            borderRadius: '6px',
            padding: '24px',
            marginBottom: '80px',
          }}
        >
          <pre
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '13px',
              lineHeight: 1.6,
              margin: 0,
              overflow: 'auto',
            }}
          >
            {codeExample}
          </pre>
        </div>

        {/* Use case cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '24px',
            marginBottom: '64px',
          }}
        >
          {[
            {
              title: 'Logs & APIs',
              text: 'Mask PII before it enters your logs, audit trails, or third-party APIs.',
            },
            {
              title: 'LLM Pipelines',
              text: 'Tokenize before sending to any AI model. Restore originals after response.',
            },
            {
              title: 'Compliance',
              text: "GDPR, HIPAA, NDPR, PCI-DSS — map detectors to each regulation's fields.",
            },
          ].map((card) => (
            <div
              key={card.title}
              style={{
                padding: '24px',
                border: '1px solid var(--color-border)',
                borderRadius: '6px',
                backgroundColor: 'var(--color-surface)',
              }}
            >
              <h3
                style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  marginBottom: '8px',
                }}
              >
                {card.title}
              </h3>
              <p
                style={{
                  fontSize: '14px',
                  color: 'var(--color-text-secondary)',
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                {card.text}
              </p>
            </div>
          ))}
        </div>

        {/* Package listing */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
          }}
        >
          {[
            { name: '@pii-mask/core', desc: 'Zero-dependency masking engine' },
            { name: '@pii-mask/cli', desc: 'File I/O adapter for CLI usage' },
            { name: '@pii-mask/react', desc: 'React components and hooks' },
            { name: '@pii-mask/nlp', desc: 'NLP-powered name/place detection' },
          ].map((pkg) => (
            <div
              key={pkg.name}
              style={{
                padding: '16px',
                border: '1px solid var(--color-border-muted)',
                borderRadius: '6px',
              }}
            >
              <code
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '13px',
                  color: 'var(--color-accent)',
                }}
              >
                {pkg.name}
              </code>
              <p
                style={{
                  fontSize: '13px',
                  color: 'var(--color-text-secondary)',
                  marginTop: '4px',
                  marginBottom: 0,
                }}
              >
                {pkg.desc}
              </p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
