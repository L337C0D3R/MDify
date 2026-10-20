# Changelog

All notable changes to MDify are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/).

## [1.0.0] - 2026-10-21

### Added

- Renders `.md`, `.markdown`, `.mdown`, `.mkd` and `.mkdn` files opened in
  Chrome or Edge, both local (`file://`) and online.
- GitHub Flavored Markdown: tables, task lists, strikethrough, autolinks and
  footnotes.
- GitHub alerts (`> [!NOTE]`, `[!TIP]`, `[!IMPORTANT]`, `[!WARNING]`,
  `[!CAUTION]`).
- LaTeX math with KaTeX: `$…$`, `$$…$$` and ` ```math ` blocks.
- Mermaid diagrams, loaded only on pages that contain one, themed for light
  and dark mode.
- Syntax highlighting for 61 languages, with a language label and Copy button
  on every code block.
- GitHub emoji shortcodes such as `:rocket:`.
- Reader interface: toolbar with reading time and progress bar, "On this page"
  sidebar (a drawer on small screens), back-to-top button, image lightbox,
  copy-link heading anchors and remembered scroll position.
- Reader settings: Auto / Light / Dark theme, text size, Sans / Serif / Mono
  font and page width, synced across tabs.
- Raw source view with highlighting and line numbers.
- Keyboard shortcuts (`T`, `R`, `D`, `+`, `-`, `G`, `?`).
- Print / save-as-PDF styles.
- Displays `text/markdown` responses instead of downloading them.
- Leaves HTML pages untouched even if their URL ends in `.md`.

[1.0.0]: https://github.com/L337C0D3R/MDify/releases/tag/v1.0.0
