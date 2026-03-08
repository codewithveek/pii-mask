import React from 'react';

/**
 * React versions with critical CVEs affecting all usage contexts.
 * Updated within 48h of any new CVE disclosure per the security SLA.
 *
 * CVE-2025-55182 (CVSS 10.0, RCE): affects 19.0.0–19.0.3
 * CVE-2025-55184 / CVE-2026-23864 (DoS + code exposure): 19.0.0–19.2.3
 */
const BLOCKED_VERSIONS = new Set([
  '19.0.0', '19.0.1', '19.0.2', '19.0.3',
  '19.1.0', '19.1.1', '19.1.2', '19.1.3', '19.1.4',
  '19.2.0', '19.2.1', '19.2.2', '19.2.3',
]);

export function assertSafeReactVersion(): void {
  const version = React.version;

  if (BLOCKED_VERSIONS.has(version)) {
    throw new Error(
      `@pii-mask/react: React ${version} has critical security vulnerabilities ` +
      `and is not supported.\n\n` +
      `Affected CVEs: CVE-2025-55182, CVE-2025-55184, CVE-2026-23864\n\n` +
      `Please upgrade to one of:\n` +
      `  React 19.0.x  →  >= 19.0.4\n` +
      `  React 19.1.x  →  >= 19.1.5\n` +
      `  React 19.2.x  →  >= 19.2.4\n\n` +
      `See: https://react.dev/blog/security`
    );
  }
}
