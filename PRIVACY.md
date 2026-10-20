# Privacy policy

_Last updated: 21 October 2026_

MDify renders Markdown files in your browser. It is designed to work entirely
on your device.

## What MDify does not do

- It does not collect, transmit or sell any personal data.
- It does not use analytics, tracking, advertising or remote logging.
- It does not load code, fonts or styles from the internet. Every library is
  bundled inside the extension.
- It does not read pages other than Markdown documents you open.

## What MDify stores

| Data | Where | Why |
| --- | --- | --- |
| Reader settings: theme, text size, font, page width | `chrome.storage.sync` | So your preferences apply in every tab. If you are signed in to your browser with sync turned on, the browser syncs these between your devices. |
| Scroll position for the last 100 Markdown files you opened (the file URL and a number) | `chrome.storage.local`, on your device only | So a file reopens where you left off. |

You can delete this data at any time by removing the extension.

## Permissions

| Permission | Why it is needed |
| --- | --- |
| Access to all sites (`<all_urls>`) | To recognise and render Markdown files on any site, and to show `text/markdown` responses instead of downloading them. MDify only acts on URLs ending in a Markdown extension that the browser displays as plain text. |
| `declarativeNetRequest` | To change the `Content-Type` of Markdown responses to `text/plain` so the browser displays them. No request is blocked, redirected or read. |
| `scripting` | To load the bundled Mermaid library into a page only when that page contains a diagram. |
| `storage` | To save the settings and scroll positions described above. |
| File URL access (optional, enabled by you) | To render Markdown files from your computer. |

## Contact

Questions about this policy can be raised at
https://github.com/L337C0D3R/MDify/issues.
