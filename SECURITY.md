# Security policy

MDify renders Markdown that may come from untrusted sources, so security
reports are welcome and taken seriously.

## How Markdown is made safe

- Rendered HTML is sanitised with DOMPurify before it is inserted into the page,
  so `<script>`, event-handler attributes and `javascript:` URLs are removed.
- Mermaid runs with `securityLevel: 'strict'`.
- No code is fetched from the network; all libraries ship inside the extension.

## Supported versions

Only the latest release receives security fixes.

## Reporting a vulnerability

Please do **not** open a public issue for security problems. Instead, use
GitHub's private vulnerability reporting:
**Security → Report a vulnerability** on
https://github.com/L337C0D3R/MDify/security/advisories/new.

Include the Markdown (or URL) that reproduces the problem, the browser and
version, and what you expected to happen. You should receive a response within
7 days.
