'use strict';

const radios = document.querySelectorAll('input[name="theme"]');

chrome.storage.sync.get({ theme: 'auto' }, ({ theme }) => {
  radios.forEach((r) => { r.checked = r.value === theme; });
});

radios.forEach((r) => {
  r.addEventListener('change', () => {
    if (r.checked) chrome.storage.sync.set({ theme: r.value });
  });
});

const status = document.getElementById('status');

chrome.extension.isAllowedFileSchemeAccess((allowed) => {
  if (allowed) {
    status.innerHTML = '<p>✓ Local files are enabled. Open any <code>.md</code> file in the browser to see it rendered.</p>';
    return;
  }
  status.classList.add('warn');
  status.innerHTML =
    '<p><strong>Local files are off.</strong> To render <code>.md</code> files from your computer, ' +
    'turn on <em>Allow access to file URLs</em> in this extension\'s details.</p>' +
    '<p><button type="button" id="open-settings">Open extension settings</button></p>';
  document.getElementById('open-settings').addEventListener('click', () => {
    chrome.tabs.create({ url: `chrome://extensions/?id=${chrome.runtime.id}` });
  });
});
