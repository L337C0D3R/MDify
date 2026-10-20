/* MDify - renders plain-text Markdown documents as a formatted preview. */
(() => {
  'use strict';

  // Only act when the browser is showing the document as raw text. HTML pages
  // whose URL happens to end in .md (e.g. GitHub's blob view) are left alone.
  const TEXT_TYPES = ['text/plain', 'text/markdown', 'text/x-markdown'];
  if (!TEXT_TYPES.includes(document.contentType)) return;

  const root = document.documentElement;
  root.classList.add('mdify-loading');

  const THEMES = ['auto', 'light', 'dark'];
  const THEME_NAMES = { auto: 'Auto', light: 'Light', dark: 'Dark' };
  const THEME_ICONS = { auto: 'monitor', light: 'sun', dark: 'moon' };
  const FONTS = ['sans', 'serif', 'mono'];
  const WIDTHS = ['narrow', 'medium', 'wide', 'full'];
  const FONT_SIZE = { min: 14, max: 22 };
  const DEFAULTS = { theme: 'auto', fontSize: 17, fontFamily: 'sans', width: 'medium' };
  const NARROW_QUERY = '(max-width: 1000px)';
  const SCROLL_KEY = 'scrollPositions';
  const SCROLL_ENTRIES = 100;

  // DOMPurify's default URI allow-list plus file: so local links/images survive.
  const URI_RE = /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|file):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i;

  // Windows-1252 code points above U+00FF, mapped back to their byte values.
  const CP1252 = {
    0x20ac: 0x80, 0x201a: 0x82, 0x0192: 0x83, 0x201e: 0x84, 0x2026: 0x85, 0x2020: 0x86,
    0x2021: 0x87, 0x02c6: 0x88, 0x2030: 0x89, 0x0160: 0x8a, 0x2039: 0x8b, 0x0152: 0x8c,
    0x017d: 0x8e, 0x2018: 0x91, 0x2019: 0x92, 0x201c: 0x93, 0x201d: 0x94, 0x2022: 0x95,
    0x2013: 0x96, 0x2014: 0x97, 0x02dc: 0x98, 0x2122: 0x99, 0x0161: 0x9a, 0x203a: 0x9b,
    0x0153: 0x9c, 0x017e: 0x9e, 0x0178: 0x9f
  };

  // GitHub alert blockquotes: > [!NOTE] etc.
  const ALERTS = {
    NOTE: { title: 'Note', icon: 'info' },
    TIP: { title: 'Tip', icon: 'lightbulb' },
    IMPORTANT: { title: 'Important', icon: 'important' },
    WARNING: { title: 'Warning', icon: 'warning' },
    CAUTION: { title: 'Caution', icon: 'caution' }
  };

  // 24px stroke icons (paths from Lucide, ISC licence).
  const ICONS = {
    sidebar: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/>',
    code: '<path d="m16 18 6-6-6-6"/><path d="m8 6-6 6 6 6"/>',
    eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
    moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
    monitor: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>',
    type: '<path d="M4 7V4h16v3M9 20h6M12 4v16"/>',
    printer: '<path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8" rx="1"/>',
    arrowUp: '<path d="m5 12 7-7 7 7M12 19V5"/>',
    copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    minus: '<path d="M5 12h14"/>',
    plus: '<path d="M5 12h14M12 5v14"/>',
    keyboard: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
    lightbulb: '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6M10 22h4"/>',
    important: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M12 7v3M12 13.5h.01"/>',
    warning: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4M12 17h.01"/>',
    caution: '<path d="M7.86 2h8.28L22 7.86v8.28L16.14 22H7.86L2 16.14V7.86z"/><path d="M12 8v4M12 16h.01"/>'
  };

  const LOGO = '<svg viewBox="0 0 96 96" aria-hidden="true"><defs><linearGradient id="mdify-logo-g" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0" stop-color="#4F46E5"/><stop offset="1" stop-color="#9333EA"/></linearGradient></defs>' +
    '<rect width="96" height="96" rx="22" fill="url(#mdify-logo-g)"/>' +
    '<path d="M42 24l-8 52M62 24l-8 52M24 40h46M20 60h46" stroke="#fff" stroke-width="10" stroke-linecap="round"/>' +
    '<path d="M76 10c1.2 6.8 3.2 8.8 10 10-6.8 1.2-8.8 3.2-10 10-1.2-6.8-3.2-8.8-10-10 6.8-1.2 8.8-3.2 10-10z" fill="#FCD34D"/></svg>';

  const SHORTCUTS = [
    ['T', 'Show or hide contents'],
    ['R', 'Switch between rendered and raw'],
    ['D', 'Cycle theme'],
    ['+ / −', 'Larger or smaller text'],
    ['G', 'Back to top'],
    ['?', 'Show this help'],
    ['Esc', 'Close panels']
  ];

  const ui = { diagrams: [] };
  const settings = { ...DEFAULTS };
  let themeLinks = null;
  let mermaidQueue = Promise.resolve();
  let mermaidTheme = null;
  let toastTimer = 0;
  let scrollSaveTimer = 0;
  let scrollFrame = 0;

  // GitHub-style :shortcode: emoji. Unknown codes are left as plain text.
  const emojiExtension = {
    name: 'emoji',
    level: 'inline',
    start(src) {
      return src.match(/:[a-z0-9_+-]+:/)?.index;
    },
    tokenizer(src) {
      const match = /^:([a-z0-9_+-]+):/.exec(src);
      if (match && Object.hasOwn(globalThis.MDIFY_EMOJI || {}, match[1])) {
        return { type: 'emoji', raw: match[0], name: match[1], emoji: MDIFY_EMOJI[match[1]] };
      }
    },
    renderer(token) {
      return `<span class="mdify-emoji" title=":${token.name}:">${token.emoji}</span>`;
    }
  };

  loadSettings();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }

  function init() {
    const pre = document.body && document.body.querySelector('pre');
    if (!pre) {
      root.classList.remove('mdify-loading');
      return;
    }
    try {
      render(fixEncoding(pre.textContent));
      if (location.hash) scrollToHash();
      else restoreScroll();
    } catch (err) {
      console.error('[MDify] Failed to render Markdown:', err);
    } finally {
      root.classList.remove('mdify-loading');
    }
  }

  // Local files without a BOM are sometimes decoded as Windows-1252. If the text
  // round-trips cleanly as UTF-8 bytes, use the UTF-8 reading instead.
  function fixEncoding(text) {
    text = text.replace(/^﻿/, '');
    if (/^utf-?8$/i.test(document.characterSet) || !/[^\x00-\x7f]/.test(text)) return text;
    const bytes = new Uint8Array(text.length);
    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      if (code < 0x100) bytes[i] = code;
      else if (code in CP1252) bytes[i] = CP1252[code];
      else return text;
    }
    try {
      return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    } catch {
      return text;
    }
  }

  function splitFrontMatter(text) {
    const match = /^---[ \t]*\r?\n([\s\S]*?)\r?\n(?:---|\.\.\.)[ \t]*(?:\r?\n|$)/.exec(text);
    if (!match) return { frontMatter: null, body: text };
    return { frontMatter: match[1], body: text.slice(match[0].length) };
  }

  // ---------------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------------

  function render(source) {
    const { frontMatter, body } = splitFrontMatter(source);
    marked.use(markedFootnote());
    marked.use(markedKatex({ throwOnError: false }));
    marked.use({ extensions: [emojiExtension] });
    const html = DOMPurify.sanitize(marked.parse(body, { gfm: true }), {
      ALLOWED_URI_REGEXP: URI_RE
    });

    const article = el('article', { className: 'markdown-body' });
    article.innerHTML = html;

    if (frontMatter !== null) {
      const details = el('details', { className: 'mdify-frontmatter' });
      details.append(el('summary', { textContent: 'Front matter' }), el('pre', { textContent: frontMatter }));
      article.prepend(details);
    }

    // ```math blocks (GitHub style) become display equations.
    article.querySelectorAll('pre > code.language-math').forEach((code) => {
      const block = el('div', { className: 'mdify-math-block' });
      katex.render(code.textContent, block, { displayMode: true, throwOnError: false });
      code.parentElement.replaceWith(block);
    });

    // ```mermaid blocks keep their source visible until the diagram is drawn.
    ui.diagrams = [...article.querySelectorAll('pre > code.language-mermaid')].map((code) => {
      const box = el('div', { className: 'mdify-mermaid' });
      code.parentElement.replaceWith(box);
      box.append(code.parentElement);
      return { box, source: code.textContent };
    });

    article.querySelectorAll('pre > code').forEach((code) => {
      if (code.closest('.mdify-mermaid, .mdify-frontmatter')) return;
      decorateCodeBlock(code);
    });

    article.querySelectorAll('table').forEach((table) => {
      const wrap = el('div', { className: 'mdify-table' });
      table.before(wrap);
      wrap.append(table);
    });

    decorateAlerts(article);
    if (article.querySelector('.katex')) stylesheet('lib/katex/katex.min.css');

    const headings = addHeadingIds(article);
    const toc = buildToc(headings);
    const words = (article.textContent.match(/\S+/g) || []).length;

    ui.source = source;
    ui.article = article;
    ui.toc = toc;
    ui.main = el('main', { className: 'mdify-main' }, [article]);

    const layout = el('div', { className: 'mdify-layout' }, toc ? [toc, ui.main] : [ui.main]);
    ui.backdrop = el('div', { className: 'mdify-backdrop' });
    ui.backdrop.addEventListener('click', () => setTocOpen(false));
    ui.backToTop = iconButton('arrowUp', 'Back to top (G)', scrollToTop);
    ui.backToTop.classList.add('mdify-back-to-top');
    ui.toast = el('div', { className: 'mdify-toast', role: 'status' });

    document.body.replaceChildren(buildToolbar(Boolean(toc), words), layout, ui.backdrop, ui.backToTop, ui.toast);
    document.body.classList.add('mdify-body');
    root.classList.add('mdify');
    syncSettingsUI();

    const firstH1 = article.querySelector('h1');
    document.title = firstH1 ? headingText(firstH1) : fileName();

    article.addEventListener('click', onArticleClick);
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('keydown', onKeydown);
    onScroll();

    if (toc) trackActiveHeading(toc);
    if (ui.diagrams.length) {
      renderDiagrams();
      matchMedia('(prefers-color-scheme: dark)').addEventListener('change', renderDiagrams);
    }
  }

  function decorateCodeBlock(code) {
    const pre = code.parentElement;
    const lang = [...code.classList].find((c) => c.startsWith('language-'))?.slice(9) || '';
    hljs.highlightElement(code);
    const label = (lang && hljs.getLanguage(lang)?.name) || lang || 'Text';

    const copyBtn = el('button', { type: 'button', className: 'mdify-code-copy', title: 'Copy code' }, [
      icon('copy'),
      el('span', { textContent: 'Copy' })
    ]);
    copyBtn.addEventListener('click', async () => {
      await copyText(code.textContent);
      copyBtn.replaceChildren(icon('check'), el('span', { textContent: 'Copied' }));
      copyBtn.classList.add('done');
      setTimeout(() => {
        copyBtn.replaceChildren(icon('copy'), el('span', { textContent: 'Copy' }));
        copyBtn.classList.remove('done');
      }, 1500);
    });

    const wrap = el('div', { className: 'mdify-code' });
    pre.replaceWith(wrap);
    wrap.append(
      el('div', { className: 'mdify-code-header' }, [el('span', { className: 'mdify-code-lang', textContent: label }), copyBtn]),
      pre
    );
  }

  function decorateAlerts(article) {
    article.querySelectorAll('blockquote').forEach((quote) => {
      const para = quote.firstElementChild;
      const first = para?.tagName === 'P' ? para.firstChild : null;
      if (!first || first.nodeType !== Node.TEXT_NODE) return;
      const match = /^\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\][ \t]*\n?/i.exec(first.textContent);
      if (!match) return;
      first.textContent = first.textContent.slice(match[0].length);
      if (para.firstChild?.nodeName === 'BR') para.firstChild.remove();
      if (!para.textContent.trim() && !para.querySelector('img')) para.remove();
      const type = match[1].toUpperCase();
      quote.className = `mdify-alert mdify-alert-${type.toLowerCase()}`;
      quote.prepend(el('p', { className: 'mdify-alert-title' }, [icon(ALERTS[type].icon), ALERTS[type].title]));
    });
  }

  function isDark() {
    const theme = root.dataset.mdifyTheme;
    return theme === 'dark' || (theme !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches);
  }

  // Draws (or redraws, after a theme change) every Mermaid diagram. Calls are
  // queued so a theme switch mid-render can't interleave with the first pass.
  function renderDiagrams() {
    if (!ui.diagrams.length) return;
    mermaidQueue = mermaidQueue.then(async () => {
      const theme = isDark() ? 'dark' : 'default';
      if (theme === mermaidTheme) return;
      if (!globalThis.mermaid) await loadMermaid();
      mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme });
      mermaidTheme = theme;
      for (const [i, diagram] of ui.diagrams.entries()) {
        try {
          const { svg } = await mermaid.render(`mdify-mermaid-${i}-${Date.now()}`, diagram.source);
          diagram.box.innerHTML = svg;
        } catch (err) {
          diagram.box.replaceChildren(
            el('pre', { textContent: diagram.source }),
            el('p', { className: 'mdify-mermaid-error', textContent: `Mermaid error: ${err?.message || err}` })
          );
        }
      }
    }).catch((err) => console.error('[MDify] Could not render Mermaid diagrams:', err));
  }

  function loadMermaid() {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type: 'mdify:load-mermaid' }, (response) => {
        if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
        else if (!response?.ok) reject(new Error(response?.error || 'Mermaid failed to load'));
        else resolve();
      });
    });
  }

  function addHeadingIds(article) {
    const seen = new Map();
    const headings = [];
    article.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((h) => {
      if (h.closest('.footnotes')) return;
      const text = h.textContent.trim();
      const base = slugify(text) || 'section';
      const count = seen.get(base) || 0;
      seen.set(base, count + 1);
      const id = count ? `${base}-${count}` : base;
      h.id = id;
      h.prepend(el('a', { className: 'mdify-anchor', href: `#${id}`, textContent: '#', title: 'Copy link to this section', ariaHidden: 'true' }));
      const level = Number(h.tagName[1]);
      if (level <= 3) headings.push({ id, text, level });
    });
    return headings;
  }

  function slugify(text) {
    return text.toLowerCase().trim().replace(/[^\p{L}\p{N}\s_-]/gu, '').replace(/\s/g, '-');
  }

  function headingText(h) {
    return h.textContent.replace(/^#/, '').trim();
  }

  function fileName() {
    const last = location.pathname.split('/').filter(Boolean).pop() || 'Markdown';
    try {
      return decodeURIComponent(last);
    } catch {
      return last;
    }
  }

  // ---------------------------------------------------------------------------
  // Table of contents
  // ---------------------------------------------------------------------------

  function buildToc(headings) {
    if (headings.length < 2) return null;
    const minLevel = Math.min(...headings.map((h) => h.level));
    const list = el('ul');
    for (const h of headings) {
      const link = el('a', { href: `#${h.id}`, textContent: h.text, title: h.text });
      link.dataset.target = h.id;
      list.append(el('li', { className: `mdify-toc-l${h.level - minLevel + 1}` }, [link]));
    }
    list.addEventListener('click', (e) => {
      if (e.target.closest('a') && matchMedia(NARROW_QUERY).matches) setTocOpen(false);
    });
    const top = el('button', { type: 'button', className: 'mdify-toc-top' }, [icon('arrowUp'), 'Back to top']);
    top.addEventListener('click', scrollToTop);
    return el('nav', { className: 'mdify-toc', ariaLabel: 'Table of contents' }, [
      el('div', { className: 'mdify-toc-title', textContent: 'On this page' }),
      list,
      top
    ]);
  }

  function trackActiveHeading(toc) {
    const links = new Map();
    toc.querySelectorAll('a[data-target]').forEach((a) => links.set(a.dataset.target, a));
    const visible = new Set();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) visible.add(entry.target);
        else visible.delete(entry.target);
      }
      const ordered = [...links.keys()].map((id) => document.getElementById(id)).filter((h) => visible.has(h));
      if (!ordered.length) return;
      links.forEach((a) => a.classList.remove('active'));
      const active = links.get(ordered[0].id);
      active.classList.add('active');
      // Keep the active entry visible inside the sidebar without scrolling the page.
      const top = active.offsetTop - toc.offsetTop;
      if (top < toc.scrollTop || top + active.offsetHeight > toc.scrollTop + toc.clientHeight) {
        toc.scrollTop = top - toc.clientHeight / 3;
      }
    }, { rootMargin: '-64px 0px -60% 0px' });
    links.forEach((_, id) => {
      const h = document.getElementById(id);
      if (h) observer.observe(h);
    });
  }

  // On wide screens the class hides the sidebar; on narrow screens it opens the drawer.
  function toggleToc() {
    if (!ui.toc) return;
    setTocOpen(!root.classList.contains('mdify-toc-toggled'));
  }

  function setTocOpen(toggled) {
    root.classList.toggle('mdify-toc-toggled', toggled);
    if (ui.tocBtn) {
      const shown = matchMedia(NARROW_QUERY).matches ? toggled : !toggled;
      ui.tocBtn.setAttribute('aria-pressed', String(shown));
    }
  }

  // ---------------------------------------------------------------------------
  // Toolbar and reader settings
  // ---------------------------------------------------------------------------

  function buildToolbar(hasToc, words) {
    ui.tocBtn = iconButton('sidebar', 'Contents (T)', toggleToc);
    ui.tocBtn.hidden = !hasToc;
    ui.tocBtn.setAttribute('aria-pressed', String(hasToc && !matchMedia(NARROW_QUERY).matches));

    const minutes = Math.max(1, Math.round(words / 230));
    const brand = el('div', { className: 'mdify-brand' }, [
      svgFrom(LOGO, 'mdify-logo'),
      el('div', { className: 'mdify-title' }, [
        el('span', { className: 'mdify-filename', textContent: fileName(), title: safeDecode(location.href) }),
        el('span', { className: 'mdify-meta', textContent: `${minutes} min read · ${words.toLocaleString()} words` })
      ])
    ]);

    ui.rawBtn = iconButton('code', 'View Markdown source (R)', toggleRaw);
    ui.rawBtn.setAttribute('aria-pressed', 'false');
    ui.themeBtn = iconButton(THEME_ICONS[settings.theme], '', cycleTheme);
    const printBtn = iconButton('printer', 'Print or save as PDF', () => window.print());
    printBtn.classList.add('mdify-hide-narrow');

    ui.settingsBtn = iconButton('type', 'Reader settings', () => setSettingsOpen(ui.settingsPanel.hidden));
    ui.settingsBtn.setAttribute('aria-haspopup', 'dialog');
    ui.settingsBtn.setAttribute('aria-expanded', 'false');
    ui.settingsPanel = buildSettings();
    const settingsWrap = el('div', { className: 'mdify-settings-wrap' }, [ui.settingsBtn, ui.settingsPanel]);
    document.addEventListener('pointerdown', (e) => {
      if (!ui.settingsPanel.hidden && !settingsWrap.contains(e.target)) setSettingsOpen(false);
    });

    ui.progress = el('div', { className: 'mdify-progress-bar' });

    return el('header', { className: 'mdify-toolbar' }, [
      ui.tocBtn,
      brand,
      el('span', { className: 'mdify-spacer' }),
      ui.rawBtn,
      ui.themeBtn,
      settingsWrap,
      printBtn,
      el('div', { className: 'mdify-progress' }, [ui.progress])
    ]);
  }

  function buildSettings() {
    const panel = el('div', { className: 'mdify-popover', role: 'dialog', ariaLabel: 'Reader settings', hidden: true });

    const sizeValue = el('span', { className: 'mdify-stepper-value' });
    ui.sizeValue = sizeValue;
    const smaller = iconButton('minus', 'Smaller text (−)', () => stepFontSize(-1));
    const larger = iconButton('plus', 'Larger text (+)', () => stepFontSize(1));
    ui.sizeButtons = { smaller, larger };

    const shortcuts = el('button', { type: 'button', className: 'mdify-popover-link' }, [icon('keyboard'), 'Keyboard shortcuts', el('kbd', { textContent: '?' })]);
    shortcuts.addEventListener('click', () => {
      setSettingsOpen(false);
      openShortcuts();
    });

    panel.append(
      settingsSection('Theme', segmented('theme', THEMES.map((t) => ({ value: t, label: THEME_NAMES[t], icon: THEME_ICONS[t] })))),
      settingsSection('Text size', el('div', { className: 'mdify-stepper' }, [smaller, sizeValue, larger])),
      settingsSection('Font', segmented('fontFamily', [
        { value: 'sans', label: 'Sans' },
        { value: 'serif', label: 'Serif' },
        { value: 'mono', label: 'Mono' }
      ])),
      settingsSection('Page width', segmented('width', [
        { value: 'narrow', label: 'Narrow' },
        { value: 'medium', label: 'Medium' },
        { value: 'wide', label: 'Wide' },
        { value: 'full', label: 'Full' }
      ])),
      shortcuts
    );
    return panel;
  }

  function settingsSection(label, control) {
    return el('div', { className: 'mdify-popover-section' }, [el('div', { className: 'mdify-popover-label', textContent: label }), control]);
  }

  function segmented(key, options) {
    const group = el('div', { className: 'mdify-segmented', role: 'group' });
    for (const option of options) {
      const btn = el('button', { type: 'button' }, option.icon ? [icon(option.icon), option.label] : [option.label]);
      btn.dataset.setting = key;
      btn.dataset.value = option.value;
      if (key === 'fontFamily') btn.dataset.font = option.value;
      btn.addEventListener('click', () => updateSetting(key, option.value));
      group.append(btn);
    }
    return group;
  }

  function setSettingsOpen(open) {
    ui.settingsPanel.hidden = !open;
    ui.settingsBtn.setAttribute('aria-expanded', String(open));
    if (open) ui.settingsPanel.querySelector('button[aria-pressed="true"], button')?.focus();
  }

  function syncSettingsUI() {
    if (ui.themeBtn) {
      ui.themeBtn.replaceChildren(icon(THEME_ICONS[settings.theme]));
      const label = `Theme: ${THEME_NAMES[settings.theme]} (D)`;
      ui.themeBtn.title = label;
      ui.themeBtn.setAttribute('aria-label', label);
    }
    if (!ui.settingsPanel) return;
    ui.settingsPanel.querySelectorAll('[data-setting]').forEach((btn) => {
      btn.setAttribute('aria-pressed', String(settings[btn.dataset.setting] === btn.dataset.value));
    });
    ui.sizeValue.textContent = `${settings.fontSize}px`;
    ui.sizeButtons.smaller.disabled = settings.fontSize <= FONT_SIZE.min;
    ui.sizeButtons.larger.disabled = settings.fontSize >= FONT_SIZE.max;
  }

  function loadSettings() {
    applySettings(DEFAULTS);
    try {
      chrome.storage.sync.get(DEFAULTS, (items) => applySettings(items));
      chrome.storage.onChanged.addListener((changes, area) => {
        if (area !== 'sync') return;
        const next = {};
        for (const key of Object.keys(DEFAULTS)) {
          if (changes[key]) next[key] = changes[key].newValue;
        }
        if (Object.keys(next).length) applySettings(next);
      });
    } catch (err) {
      console.warn('[MDify] Settings storage unavailable:', err);
    }
  }

  function updateSetting(key, value) {
    applySettings({ [key]: value });
    try {
      chrome.storage.sync.set({ [key]: settings[key] });
    } catch (err) {
      console.warn('[MDify] Could not save setting:', err);
    }
  }

  function applySettings(changes) {
    Object.assign(settings, changes);
    if (!THEMES.includes(settings.theme)) settings.theme = DEFAULTS.theme;
    if (!FONTS.includes(settings.fontFamily)) settings.fontFamily = DEFAULTS.fontFamily;
    if (!WIDTHS.includes(settings.width)) settings.width = DEFAULTS.width;
    const size = Math.round(Number(settings.fontSize));
    settings.fontSize = Number.isFinite(size) ? Math.min(FONT_SIZE.max, Math.max(FONT_SIZE.min, size)) : DEFAULTS.fontSize;

    applyTheme(settings.theme);
    root.style.setProperty('--mdify-font-size', `${settings.fontSize}px`);
    root.dataset.mdifyFont = settings.fontFamily;
    root.dataset.mdifyWidth = settings.width;
    syncSettingsUI();
  }

  function cycleTheme() {
    const next = THEMES[(THEMES.indexOf(settings.theme) + 1) % THEMES.length];
    updateSetting('theme', next);
    toast(`Theme: ${THEME_NAMES[next]}`);
  }

  function stepFontSize(delta) {
    const next = Math.min(FONT_SIZE.max, Math.max(FONT_SIZE.min, settings.fontSize + delta));
    if (next === settings.fontSize) return;
    updateSetting('fontSize', next);
    toast(`Text size: ${next}px`);
  }

  function applyTheme(theme) {
    if (!themeLinks) {
      themeLinks = {
        mdLight: stylesheet('lib/github-markdown-light.css'),
        mdDark: stylesheet('lib/github-markdown-dark.css'),
        hlLight: stylesheet('lib/hljs-github.css'),
        hlDark: stylesheet('lib/hljs-github-dark.css')
      };
    }
    const lightMedia = { auto: 'not all and (prefers-color-scheme: dark)', light: 'all', dark: 'not all' }[theme];
    const darkMedia = { auto: '(prefers-color-scheme: dark)', light: 'not all', dark: 'all' }[theme];
    themeLinks.mdLight.media = themeLinks.hlLight.media = lightMedia;
    themeLinks.mdDark.media = themeLinks.hlDark.media = darkMedia;
    root.dataset.mdifyTheme = theme;
    root.style.colorScheme = theme === 'auto' ? 'light dark' : theme;
    renderDiagrams();
  }

  // ---------------------------------------------------------------------------
  // Raw source view
  // ---------------------------------------------------------------------------

  function toggleRaw() {
    if (!ui.rawView) {
      ui.rawView = buildRawView(ui.source);
      ui.main.append(ui.rawView);
    }
    const showRaw = ui.rawView.hidden;
    ui.rawView.hidden = !showRaw;
    ui.article.hidden = showRaw;
    ui.rawBtn.replaceChildren(icon(showRaw ? 'eye' : 'code'));
    const label = showRaw ? 'View rendered page (R)' : 'View Markdown source (R)';
    ui.rawBtn.title = label;
    ui.rawBtn.setAttribute('aria-label', label);
    ui.rawBtn.setAttribute('aria-pressed', String(showRaw));
    root.classList.toggle('mdify-raw-mode', showRaw);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  function buildRawView(source) {
    const lines = source.split(/\r?\n/);
    const code = el('code', { className: 'hljs language-markdown' });
    code.innerHTML = hljs.highlight(source, { language: 'markdown', ignoreIllegals: true }).value;
    const copyBtn = el('button', { type: 'button', className: 'mdify-code-copy', title: 'Copy all' }, [icon('copy'), el('span', { textContent: 'Copy all' })]);
    copyBtn.addEventListener('click', async () => {
      await copyText(source);
      toast('Markdown copied');
    });
    return el('section', { className: 'mdify-raw', hidden: true, ariaLabel: 'Markdown source' }, [
      el('div', { className: 'mdify-code-header' }, [
        el('span', { className: 'mdify-code-lang', textContent: `Markdown · ${lines.length.toLocaleString()} lines` }),
        copyBtn
      ]),
      el('div', { className: 'mdify-raw-body' }, [
        el('div', { className: 'mdify-raw-gutter', ariaHidden: 'true', textContent: lines.map((_, i) => i + 1).join('\n') }),
        el('pre', {}, [code])
      ])
    ]);
  }

  // ---------------------------------------------------------------------------
  // Interactions: anchors, images, keyboard, scrolling
  // ---------------------------------------------------------------------------

  async function onArticleClick(e) {
    const anchor = e.target.closest('.mdify-anchor');
    if (anchor) {
      e.preventDefault();
      const id = anchor.getAttribute('href').slice(1);
      history.replaceState(null, '', `#${encodeURIComponent(id)}`);
      document.getElementById(id)?.scrollIntoView({ behavior: smoothBehavior() });
      await copyText(location.href);
      toast('Link copied');
      return;
    }
    const img = e.target.closest('img');
    if (img && !img.closest('a')) openLightbox(img);
  }

  function onKeydown(e) {
    if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target.closest?.('input, textarea, select, [contenteditable="true"]')) return;
    if (e.key === 'Escape') {
      if (ui.settingsPanel && !ui.settingsPanel.hidden) {
        setSettingsOpen(false);
        ui.settingsBtn.focus();
      } else if (root.classList.contains('mdify-toc-toggled') && matchMedia(NARROW_QUERY).matches) {
        setTocOpen(false);
      }
      return;
    }
    if (document.querySelector('dialog[open]')) return;
    const actions = {
      t: toggleToc,
      r: toggleRaw,
      d: cycleTheme,
      g: scrollToTop,
      '+': () => stepFontSize(1),
      '=': () => stepFontSize(1),
      '-': () => stepFontSize(-1),
      '?': openShortcuts
    };
    const action = actions[e.key.length === 1 ? e.key.toLowerCase() : e.key] || actions[e.key];
    if (!action) return;
    e.preventDefault();
    action();
  }

  function onScroll() {
    if (scrollFrame) return;
    scrollFrame = requestAnimationFrame(() => {
      scrollFrame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      ui.progress.style.transform = `scaleX(${progress})`;
      ui.backToTop.classList.toggle('visible', window.scrollY > 600);
    });
    clearTimeout(scrollSaveTimer);
    scrollSaveTimer = setTimeout(saveScroll, 400);
  }

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: smoothBehavior() });
  }

  function smoothBehavior() {
    return matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth';
  }

  function scrollToHash() {
    let id = location.hash.slice(1);
    try {
      id = decodeURIComponent(id);
    } catch {}
    document.getElementById(id)?.scrollIntoView({ behavior: 'instant' });
  }

  // Remembers where you were in each document, so reopening it resumes there.
  function pageKey() {
    return location.href.split('#')[0];
  }

  function restoreScroll() {
    try {
      chrome.storage.local.get({ [SCROLL_KEY]: {} }, (items) => {
        const y = items[SCROLL_KEY][pageKey()]?.y;
        if (y > 0 && !location.hash) window.scrollTo({ top: y, behavior: 'instant' });
      });
    } catch {}
  }

  function saveScroll() {
    try {
      chrome.storage.local.get({ [SCROLL_KEY]: {} }, (items) => {
        const positions = items[SCROLL_KEY];
        positions[pageKey()] = { y: Math.round(window.scrollY), t: Date.now() };
        const keys = Object.keys(positions);
        if (keys.length > SCROLL_ENTRIES) {
          keys.sort((a, b) => positions[a].t - positions[b].t)
            .slice(0, keys.length - SCROLL_ENTRIES)
            .forEach((k) => delete positions[k]);
        }
        chrome.storage.local.set({ [SCROLL_KEY]: positions });
      });
    } catch {}
  }

  // ---------------------------------------------------------------------------
  // Overlays: dialogs, lightbox, toast
  // ---------------------------------------------------------------------------

  function openShortcuts() {
    if (!ui.shortcutsDialog) {
      const list = el('dl', { className: 'mdify-shortcuts' });
      for (const [keys, label] of SHORTCUTS) {
        list.append(el('dt', {}, keys.split(' / ').flatMap((k, i) => (i ? [' ', el('kbd', { textContent: k })] : [el('kbd', { textContent: k })]))), el('dd', { textContent: label }));
      }
      ui.shortcutsDialog = dialog('Keyboard shortcuts', list);
    }
    ui.shortcutsDialog.showModal();
  }

  function dialog(title, content) {
    const close = iconButton('x', 'Close', () => box.close());
    const box = el('dialog', { className: 'mdify-dialog' }, [
      el('div', { className: 'mdify-dialog-header' }, [el('h2', { textContent: title }), close]),
      content
    ]);
    box.addEventListener('click', (e) => {
      if (e.target === box) box.close();
    });
    document.body.append(box);
    return box;
  }

  function openLightbox(img) {
    if (!ui.lightbox) {
      ui.lightboxImg = el('img', { alt: '' });
      ui.lightbox = el('dialog', { className: 'mdify-lightbox' }, [ui.lightboxImg]);
      ui.lightbox.addEventListener('click', () => ui.lightbox.close());
      document.body.append(ui.lightbox);
    }
    ui.lightboxImg.src = img.currentSrc || img.src;
    ui.lightboxImg.alt = img.alt;
    const width = img.naturalWidth || img.width;
    const height = img.naturalHeight || img.height;
    const scale = Math.min(2, (window.innerWidth * 0.9) / width, (window.innerHeight * 0.85) / height);
    ui.lightboxImg.style.width = scale > 1 ? `${Math.round(width * scale)}px` : '';
    ui.lightbox.showModal();
  }

  function toast(message) {
    if (!ui.toast) return;
    ui.toast.textContent = message;
    ui.toast.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => ui.toast.classList.remove('visible'), 1600);
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const area = el('textarea', { value: text });
      document.body.append(area);
      area.select();
      document.execCommand('copy');
      area.remove();
    }
  }

  function stylesheet(path) {
    const link = el('link', { rel: 'stylesheet', href: chrome.runtime.getURL(path) });
    (document.head || root).append(link);
    return link;
  }

  function safeDecode(text) {
    try {
      return decodeURI(text);
    } catch {
      return text;
    }
  }

  function svgFrom(markup, className) {
    const template = document.createElement('template');
    template.innerHTML = markup;
    const svg = template.content.firstElementChild;
    if (className) svg.classList.add(className);
    return svg;
  }

  function icon(name) {
    return svgFrom(
      `<svg class="mdify-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`
    );
  }

  function iconButton(name, label, onClick) {
    const btn = el('button', { type: 'button', className: 'mdify-icon-btn', title: label, ariaLabel: label }, [icon(name)]);
    btn.addEventListener('click', onClick);
    return btn;
  }

  function el(tag, props = {}, children = []) {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(props)) {
      if (key === 'ariaHidden') node.setAttribute('aria-hidden', value);
      else if (key === 'ariaLabel') node.setAttribute('aria-label', value);
      else if (key === 'role') node.setAttribute('role', value);
      else node[key] = value;
    }
    node.append(...children);
    return node;
  }
})();
