document.addEventListener('DOMContentLoaded', () => {
  const enabledCheckbox = document.getElementById('enabled');
  const keywordsInput = document.getElementById('extraKeywords'); // Fixed ID to match updateSettings()
  const saveButton = document.getElementById('save');

  // Load settings
  chrome.storage.sync.get(['enabled', 'extraKeywords'], (data) => {
    enabledCheckbox.checked = data.enabled !== false;
    keywordsInput.value = data.extraKeywords || '';
  });

  // Add click handler for save button
  saveButton.addEventListener('click', updateSettings);
});

function updateSettings() {
  const enabled = document.getElementById('enabled').checked;
  const extraKeywords = document.getElementById('extraKeywords').value;
  
  // Save to storage and notify all tabs
  chrome.storage.sync.set({ enabled, extraKeywords }, () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {
        type: 'UPDATE_SETTINGS',
        data: { enabled, extraKeywords }
      }).catch(() => {
        // Ignore connection error for inactive tabs
      });
    });
  });
}