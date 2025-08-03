// content.js

let settings = {
  enabled: true,
  extraKeywords: ''
};

function getKeywords() {
  const base = ["tutorial", "lecture", "how to", "study", "course", "education"];
  if (settings.extraKeywords) {
    return base.concat(settings.extraKeywords.split(',').map(k => k.trim()).filter(Boolean));
  }
  return base;
}

function isEducational(title) {
  const eduKeywords = getKeywords();
  const t = title.toLowerCase();
  return eduKeywords.some(k => t.includes(k));
}

function setBlur(el, blurOn) {
  el.style.transition = "filter 0.3s";
  el.style.filter = blurOn ? "blur(13px)" : "none";
}

// Recursively search for all elements matching selector in root and shadow DOMs
function deepQuerySelectorAll(root, selector) {
  let results = [];
  // If root is a Document or Element
  if (root.querySelectorAll) {
    results.push(...root.querySelectorAll(selector));
  }
  // Traverse shadow roots
  const traverse = (node) => {
    if (node.shadowRoot) {
      results.push(...node.shadowRoot.querySelectorAll(selector));
      node.shadowRoot.querySelectorAll("*").forEach(traverse);
    } else if (node.children) {
      Array.from(node.children).forEach(traverse);
    }
  };
  if (root.children) {
    Array.from(root.children).forEach(traverse);
  }
  return results;
}

function processThumbnails() {
  let processed = 0;
  // Process all ytd-rich-item-renderer elements globally (homepage)
  const items = document.querySelectorAll('ytd-rich-item-renderer');
  console.log(`[StudySight][DEBUG] Global ytd-rich-item-renderer count:`, items.length);
  items.forEach(item => {
    // Block Shorts: if this video card contains a Shorts lockup, always blur
    if (
      item.querySelector('ytm-shorts-lockup-view-model, ytm-shorts-lockup-view-model-v2') ||
      item.querySelector('a[href^="/shorts/"]')
    ) {
      setBlur(item, true);
      processed++;
      return;
    }
    // New homepage: find title via a.yt-lockup-metadata-view-model-wiz__title > span
    let titleEl = item.querySelector('a.yt-lockup-metadata-view-model-wiz__title > span');
    // Fallback for other layouts (e.g. search/results)
    if (!titleEl) titleEl = item.querySelector('#video-title');
    if (!titleEl) return;
    const title = titleEl.textContent.trim();
    const shouldKeep = settings.enabled && isEducational(title);
    setBlur(item, !shouldKeep);
    processed++;
  });
  console.log(`[StudySight] Processed video items: ${processed}`);
  // Fallback: deep shadow DOM search if nothing found
  if (processed === 0) {
    const videoTitleEls = deepQuerySelectorAll(document, 'a.yt-lockup-metadata-view-model-wiz__title > span, #video-title');
    let fallbackProcessed = 0;
    videoTitleEls.forEach(titleEl => {
      let container = titleEl.closest('ytd-rich-item-renderer, ytd-rich-grid-media, ytd-video-renderer, ytd-grid-video-renderer');
      if (!container) return;
      const title = titleEl.textContent.trim();
      const shouldKeep = settings.enabled && isEducational(title);
      setBlur(container, !shouldKeep);
      fallbackProcessed++;
    });
    console.log(`[StudySight] Fallback: Processed video items (deep): ${fallbackProcessed}`);
  }
}



function removeAllBlur() {
  document.querySelectorAll("ytd-rich-item-renderer, ytd-video-renderer")
    .forEach(item => setBlur(item, false));
}

function updateSettings() {
  chrome.storage.sync.get(['enabled', 'extraKeywords'], (data) => {
    settings.enabled = data.enabled !== false;
    settings.extraKeywords = data.extraKeywords || '';
    if (settings.enabled) {
      processThumbnails();
    } else {
      removeAllBlur();
    }
  });
}

updateSettings();

let processTimeout;
function debouncedProcessThumbnails() {
  clearTimeout(processTimeout);
  processTimeout = setTimeout(processThumbnails, 100);
}

// Attach MutationObserver to document.body for robust detection
function attachGlobalObserver() {
  new MutationObserver(() => {
    if (settings.enabled) {
      debouncedProcessThumbnails();
    }
  }).observe(document.body, { childList: true, subtree: true });
  // Initial run
  processThumbnails();
}
attachGlobalObserver();



chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'UPDATE_SETTINGS') {
    updateSettings();
  }
});
