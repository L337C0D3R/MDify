---
title: MDify sample
tags: [markdown, test]
---

# MDify Sample Document

This file exercises the features MDify should render. Open it in Chrome or Edge with the extension installed.

## Text formatting

**Bold**, *italic*, ~~strikethrough~~, `inline code`, and a [link to the next section](#tables). Unicode check: café, naïve, 日本語, emoji 🎉, “smart quotes” — dashes.

> A blockquote with **formatting**.
>
> > And a nested one.

## Tables

| Feature        | Status | Notes                      |
| -------------- | :----: | -------------------------: |
| GFM tables     |   ✅   |          Alignment works   |
| Task lists     |   ✅   |               See below    |
| Syntax colours |   ✅   | highlight.js, GitHub theme |

## Task list

- [x] Render Markdown
- [x] Highlight code
- [ ] Take over the world

## Lists

1. First
2. Second
   - Nested bullet
   - Another
3. Third

## Code

```js
// JavaScript
function greet(name) {
  return `Hello, ${name}!`;
}
console.log(greet('MDify'));
```

```python
def fib(n: int) -> int:
    return n if n < 2 else fib(n - 1) + fib(n - 2)
```

```bash
echo "no language auto-detect needed"
```

## Images

![MDify icon](../icons/icon128.png)

### A third-level heading

Content under an h3, shown indented in the table of contents.

## Raw HTML is sanitised

<details>
<summary>Click to expand</summary>

Inner content is still Markdown: **bold**.

</details>

<script>alert('this should never run')</script>

---

Links to other Markdown files render too: [README](../README.md).
