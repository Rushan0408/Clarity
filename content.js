// content.js

// ─── 1) SETTINGS ────────────────────────────────────────────────────────────────
let settings = {
  enabled: true,
  extraKeywords: ''
};

function getKeywords() {
  const base = ["tutorial", "lecture", "how to", "study", "course", "education"];
  if (settings.extraKeywords) {
    return base.concat(
      settings.extraKeywords
        .split(',')
        .map(k => k.trim())
        .filter(Boolean)
    );
  }
  return base;
}

// old keyword-based checker (fallback)
function isEducationalKW(title) {
  const eduKeywords = getKeywords();
  const t = title.toLowerCase();
  return eduKeywords.some(k => t.includes(k));
}

// ─── 2) ML MODEL LOADING ─────────────────────────────────────────────────────────
let vocab = {};
let modelParams = {};
let modelReady = false;

(async function loadML() {
  try {
    const [vRes, pRes] = await Promise.all([
      fetch(chrome.runtime.getURL("json/vocab.json")),
      fetch(chrome.runtime.getURL("json/model_params.json"))
    ]);
    vocab = await vRes.json();
    modelParams = await pRes.json();
    modelReady = true;
    console.log("[StudySight] ML model loaded:", Object.keys(vocab).length, "tokens");
  } catch (err) {
    console.error("[StudySight] Failed to load ML model JSON", err);
  }
})();

// Sigmoid activation
function sigmoid(x) {
  return 1 / (1 + Math.exp(-x));
}

// ML-based checker
function isEducationalML(title) {
  if (!modelReady) {
    // Not ready yet: treat as non-educational so it gets blurred
    return false;
  }
  let score = modelParams.intercept;
  const tokens = title.toLowerCase().split(/\W+/);
  for (const w of tokens) {
    const idx = vocab[w];
    if (idx !== undefined) {
      score += modelParams.coef[idx];
    }
  }
  return sigmoid(score) > 0.5;
}

// Unified decision function
function shouldKeep(title) {
  if (!settings.enabled) return false;
  // If ML model is ready, use it; otherwise fallback to keywords
  return modelReady ? isEducationalML(title) : isEducationalKW(title);
}

// ─── 3) BLUR FUNCTION ─────────────────────────────────────────────────────────────
function setBlur(el, blurOn) {
  el.style.transition = "filter 0.3s";
  el.style.filter = blurOn ? "blur(13px)" : "none";
}

// ─── 4) QUERY HELPERS ────────────────────────────────────────────────────────────
function deepQuerySelectorAll(root, selector) {
  let results = [];
  if (root.querySelectorAll) {
    results.push(...root.querySelectorAll(selector));
  }
  const traverse = node => {
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

// ─── 5) PROCESS THUMBNAILS ────────────────────────────────────────────────────────
function processThumbnails() {
  let processed = 0;
  const items = document.querySelectorAll('ytd-rich-item-renderer');
  console.log(`[StudySight][DEBUG] Items:`, items.length);

  items.forEach(item => {
    // Always blur Shorts
    if (
      item.querySelector('ytm-shorts-lockup-view-model, ytm-shorts-lockup-view-model-v2') ||
      item.querySelector('a[href^="/shorts/"]')
    ) {
      setBlur(item, true);
      processed++;
      return;
    }

    // Find title element
    let titleEl = item.querySelector('a.yt-lockup-metadata-view-model-wiz__title > span');
    if (!titleEl) titleEl = item.querySelector('#video-title');
    if (!titleEl) return;

    const title = titleEl.textContent.trim();
    const keep = shouldKeep(title);
    setBlur(item, !keep);
    processed++;
  });

  console.log(`[StudySight] Processed: ${processed}`);

  // Fallback deep DOM if nothing processed
  if (processed === 0) {
    let fallback = 0;
    const els = deepQuerySelectorAll(document, 'a.yt-lockup-metadata-view-model-wiz__title > span, #video-title');
    els.forEach(titleEl => {
      const container = titleEl.closest(
        'ytd-rich-item-renderer, ytd-rich-grid-media, ytd-video-renderer, ytd-grid-video-renderer'
      );
      if (!container) return;
      const title = titleEl.textContent.trim();
      const keep = shouldKeep(title);
      setBlur(container, !keep);
      fallback++;
    });
    console.log(`[StudySight] Deep fallback processed: ${fallback}`);
  }
}

// ─── 6) SETTINGS HANDLERS & OBSERVERS ─────────────────────────────────────────────
function removeAllBlur() {
  document.querySelectorAll("ytd-rich-item-renderer, ytd-video-renderer")
    .forEach(item => setBlur(item, false));
}

function updateSettings() {
  chrome.storage.sync.get(['enabled', 'extraKeywords'], data => {
    settings.enabled = data.enabled !== false;
    settings.extraKeywords = data.extraKeywords || '';
    if (settings.enabled) processThumbnails();
    else removeAllBlur();
  });
}

// Initial load
updateSettings();

let processTimeout;
function debouncedProcessThumbnails() {
  clearTimeout(processTimeout);
  processTimeout = setTimeout(processThumbnails, 100);
}

new MutationObserver(() => {
  if (settings.enabled) {
    debouncedProcessThumbnails();
  }
}).observe(document.body, { childList: true, subtree: true });

// Listen for popup changes
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'UPDATE_SETTINGS') updateSettings();
});
