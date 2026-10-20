# Contributing to MDify

Thanks for helping improve MDify! Bug reports, ideas and pull requests are all
welcome.

## Reporting bugs

Open an issue at https://github.com/L337C0D3R/MDify/issues with:

- the browser and version (for example Chrome 141 or Edge 141),
- a small Markdown sample that shows the problem,
- what you expected and what happened instead (a screenshot helps).

For security problems, follow [SECURITY.md](SECURITY.md) instead.

## Development setup

MDify has no build step: the folder is the extension.

1. Clone the repository.
2. Open `chrome://extensions` (or `edge://extensions`), turn on
   **Developer mode**, click **Load unpacked** and pick the repository folder.
3. Turn on **Allow access to file URLs** in MDify's details.
4. Open `sample/features.md` and `sample/test.md` to see every feature.
5. After changing a file, click the reload icon on MDify's card and refresh the
   Markdown tab.

## Project layout

| Path | What it does |
| --- | --- |
| `content.js` | Detects plain-text Markdown pages, renders them and builds the reader interface |
| `viewer.css` | All reader styles (tokens, layout, typography, light and dark themes) |
| `background.js` | Service worker that injects Mermaid on demand |
| `rules.json` | Declarative Net Request rule that displays `text/markdown` responses |
| `popup.html`, `popup.js` | Toolbar popup: theme setting and file-access check |
| `lib/` | Bundled third-party libraries (see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)) |
| `scripts/` | Packaging and manifest checks |

## Guidelines

- Keep it dependency-free at runtime and never load code from the network
  (Manifest V3 forbids remote code).
- All CSS selectors must stay scoped to `mdify-` classes or `.markdown-body`,
  because `viewer.css` is injected into every page whose URL ends in `.md`.
- Anything rendered from Markdown must pass through DOMPurify.
- Check both light and dark themes and a narrow window before sending a PR.
- Run `node scripts/check-manifest.mjs` and `node --check content.js` before
  committing; CI runs the same checks.
- Add a line to [CHANGELOG.md](CHANGELOG.md) under an "Unreleased" heading.

## Releasing

1. Bump `version` in `manifest.json` and move the changelog entries under the
   new version.
2. Run `scripts/package.ps1` (Windows) or `scripts/package.sh` (macOS/Linux)
   to create `dist/mdify-<version>.zip`.
3. Tag the commit `v<version>` and attach the zip to a GitHub release.
