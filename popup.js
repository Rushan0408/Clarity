// popup.js

document.addEventListener('DOMContentLoaded', () => {
  const enabledCheckbox = document.getElementById('enabled');
  const keywordsInput = document.getElementById('keywords');
  const saveButton = document.getElementById('save');

  // Load settings
  chrome.storage.sync.get(['enabled', 'extraKeywords'], (data) => {
    enabledCheckbox.checked = data.enabled !== false;
    keywordsInput.value = data.extraKeywords || '';
  });

  saveButton.addEventListener('click', () => {
    const enabled = enabledCheckbox.checked;
    const extraKeywords = keywordsInput.value;
    chrome.storage.sync.set({ enabled, extraKeywords }, () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'UPDATE_SETTINGS' });
      });
    });
  });
});
