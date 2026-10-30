import React from 'react';

/**
 * React releases affected by the December 2025 React Server Components
 * advisories. The vulnerabilities are in the server-side RSC packages
 * (react-server-dom-*), so client-only apps are not exposed — this is a
 * one-time warning, not an error, and it never blocks rendering.
 *
 * CVE-2025-55182 (CVSS 10.0, RCE): 19.0.0–19.0.3, 19.1.0–19.1.4, 19.2.0–19.2.3
 * CVE-2025-55184 / CVE-2026-23864 (DoS + code exposure): 19.0.0–19.2.3
 */
const AFFECTED_VERSIONS = new Set([
  '19.0.0',
  '19.0.1',
  '19.0.2',
  '19.0.3',
  '19.1.0',
  '19.1.1',
  '19.1.2',
  '19.1.3',
  '19.1.4',
  '19.2.0',
  '19.2.1',
  '19.2.2',
  '19.2.3',
]);

let warned = false;

/** Returns true (and warns once) when the installed React is an affected release. */
export function warnIfVulnerableReact(): boolean {
  const version = React.version;
  if (!AFFECTED_VERSIONS.has(version)) return false;
  if (!warned) {
    warned = true;
    console.warn(
      `@pii-mask/react: React ${version} is affected by React Server Components advisories ` +
        `(CVE-2025-55182, CVE-2025-55184, CVE-2026-23864). If you use Server Components, ` +
        `upgrade to React 19.0.4, 19.1.5, 19.2.4 or later. ` +
        `See https://react.dev/blog/2025/12/11/denial-of-service-and-source-code-exposure-in-react-server-components`,
    );
  }
  return true;
}
