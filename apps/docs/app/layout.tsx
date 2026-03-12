import type { ReactNode } from 'react';
import { RootProvider } from 'fumadocs-ui/provider';
import { Analytics } from '@vercel/analytics/react';
import './global.css';

export const metadata = {
  title: {
    default: 'pii-mask',
    template: '%s — pii-mask',
  },
  description:
    'Mask, redact, and anonymize PII in any JavaScript environment. Strings, objects, files, React components — one API, zero server calls.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        style={{
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <RootProvider>{children}</RootProvider>
        <Analytics />
      </body>
    </html>
  );
}
