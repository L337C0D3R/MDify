# Third-party notices

MDify bundles the following open-source software in `lib/`. Each component is
unmodified (minified builds as published), except where noted, and remains
under its own license.

| Component | Version | License | Copyright | Source |
| --- | --- | --- | --- | --- |
| marked | 12.0.2 | MIT | © 2018+ MarkedJS, © 2011–2018 Christopher Jeffrey | https://github.com/markedjs/marked |
| marked-footnote | 1.2.4 | MIT | © Beni Arisandi | https://github.com/bent10/marked-extensions |
| marked-katex-extension | 5.1.2 | MIT | © 2021 @markedjs | https://github.com/UziTech/marked-katex-extension |
| KaTeX (script, CSS, WOFF2 fonts) | 0.16.11 | MIT | © 2013–2020 Khan Academy and other contributors | https://github.com/KaTeX/KaTeX |
| Mermaid | 11.4.1 | MIT | © 2014–2022 Knut Sveidqvist | https://github.com/mermaid-js/mermaid |
| DOMPurify | 3.1.6 | Apache-2.0 OR MPL-2.0 | © Cure53 and other contributors | https://github.com/cure53/DOMPurify |
| highlight.js (core + 25 language packs) | 11.9.0 | BSD-3-Clause | © 2006 Ivan Sagalaev and other contributors | https://github.com/highlightjs/highlight.js |
| github-markdown-css | 5.5.1 | MIT | © Sindre Sorhus | https://github.com/sindresorhus/github-markdown-css |
| gemoji (emoji shortcode data) | master | MIT | © GitHub, Inc. | https://github.com/github/gemoji |
| Lucide (icon paths in `content.js`) | — | ISC | © Lucide Contributors; portions © Cole Bemis (Feather, MIT) | https://github.com/lucide-icons/lucide |

Notes:

- `lib/hljs-extra.js` concatenates the official highlight.js language packs for
  dockerfile, powershell, nginx, apache, scala, dart, elixir, erlang, haskell,
  clojure, groovy, julia, latex, matlab, ocaml, protobuf, fsharp, vim, x86asm,
  cmake, properties, dos, awk, tcl and fortran.
- `lib/emoji-map.js` is generated from gemoji's `db/emoji.json`: it maps every
  alias to its emoji and nothing else.
- Only the WOFF2 KaTeX fonts are shipped; every browser MDify supports uses them.

The full license texts are available at the source links above.
