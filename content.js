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
  
  // Find and disable ALL hover preview elements
  const previewContainer = el.querySelector('#hover-overlays');
  const mouseover = el.querySelector('#mouseover-overlay');
  const thumbnail = el.querySelector('#thumbnail');
  const thumbnailOverlay = el.querySelector('ytd-thumbnail-overlay-toggle-button-renderer');
  const reel = el.querySelector('.shortsLockupViewModelHostEndpoint');
  const hoverContainer = el.querySelector('ytd-video-preview');
  
  if (blurOn) {
    // Apply blur and prevent interactions
    el.style.filter = "blur(13px)";
    el.style.pointerEvents = "auto";
    el.style.background = "rgba(0,0,0,0.01)";
    el.dataset.studySightBlurred = "1";
    
    // Disable all preview-related elements
    if (previewContainer) {
      previewContainer.style.pointerEvents = 'none';
      previewContainer.style.display = 'none';
    }
    if (mouseover) {
      mouseover.style.display = 'none';
      mouseover.style.pointerEvents = 'none';
    }
    if (thumbnail) {
      thumbnail.style.pointerEvents = 'none';
    }
    if (thumbnailOverlay) {
      thumbnailOverlay.style.display = 'none';
    }
    if (reel) {
      reel.style.pointerEvents = 'none';
    }
    if (hoverContainer) {
      hoverContainer.style.display = 'none';
    }

    // Add hover listeners if not present
    if (!el.dataset.studySightHover) {
      el.addEventListener("mouseenter", handleUnblurHover);
      el.addEventListener("mouseleave", handleReblurHover);
      el.dataset.studySightHover = "1";
    }
  } else {
    // Remove blur and restore interactions
    el.style.filter = "none";
    el.style.pointerEvents = "";
    el.style.background = "";
    el.dataset.studySightBlurred = "0";
    
    // Remove hover listeners
    if (el.dataset.studySightHover) {
      el.removeEventListener("mouseenter", handleUnblurHover);
      el.removeEventListener("mouseleave", handleReblurHover);
      delete el.dataset.studySightHover;
    }
    
    // Re-enable all preview elements
    if (previewContainer) {
      previewContainer.style.pointerEvents = '';
      previewContainer.style.display = '';
    }
    if (mouseover) {
      mouseover.style.display = '';
      mouseover.style.pointerEvents = '';
    }
    if (thumbnail) {
      thumbnail.style.pointerEvents = '';
    }
    if (thumbnailOverlay) {
      thumbnailOverlay.style.display = '';
    }
    if (reel) {
      reel.style.pointerEvents = '';
    }
    if (hoverContainer) {
      hoverContainer.style.display = '';
    }
  }
}

function handleUnblurHover(e) {
  e.stopPropagation();
  const el = e.currentTarget;
  el.style.filter = "none";
  
  // Keep preview elements disabled while hovering
  const previewContainer = el.querySelector('#hover-overlays');
  const mouseover = el.querySelector('#mouseover-overlay');
  const hoverContainer = el.querySelector('ytd-video-preview');
  
  if (previewContainer) previewContainer.style.display = 'none';
  if (mouseover) mouseover.style.display = 'none';
  if (hoverContainer) hoverContainer.style.display = 'none';
}

function handleReblurHover(e) {
  e.stopPropagation();
  e.currentTarget.style.filter = "blur(13px)";
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
  if (msg.type === 'UPDATE_SETTINGS') {
    updateSettings();
    // Always send a response
    sendResponse({ success: true });
    return true; // Required for async response
  }
});