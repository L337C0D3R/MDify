/* MDify service worker: injects Mermaid on demand, so pages without diagrams
   never pay for the ~2.5 MB library. It runs in the same isolated world as
   content.js, which is how content.js can then see the `mermaid` global. */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== 'mdify:load-mermaid' || !sender.tab) return false;
  chrome.scripting.executeScript({
    target: { tabId: sender.tab.id, frameIds: [sender.frameId] },
    files: ['lib/mermaid.min.js']
  }).then(
    () => sendResponse({ ok: true }),
    (err) => sendResponse({ ok: false, error: String(err?.message || err) })
  );
  return true;
});
