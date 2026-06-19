if (window.__webEditorLoaded) throw new Error("Web Editor: already loaded");
window.__webEditorLoaded = true;

// no-flash.css (injected via manifest at document_start) hides the page with:
//   html:not(.ext-ready) { visibility: hidden !important; }
// In addition, we synchronously inject a targeted pre-hide style from the
// localStorage cache built on the previous run, hiding specific elements even
// faster. _reveal() adds .ext-ready to <html> to show everything.
const _reveal = (() => {
  // Synchronous read — localStorage is available at document_start
  try {
    const css = localStorage.getItem("__ext_prehide__");
    if (css) {
      const ps = document.createElement("style");
      ps.id = "ext-pre-hide";
      ps.textContent = css;
      document.documentElement.appendChild(ps);
    }
  } catch (_) {}
  // Safety: always reveal within 3 s in case runAll() never fires
  const t = setTimeout(() => document.documentElement.classList.add("ext-ready"), 3000);
  return () => { clearTimeout(t); document.documentElement.classList.add("ext-ready"); };
})();

// Called at the end of every runAll() to refresh the localStorage cache.
// Collects every active selector from hide / disable / swap / custom-CSS rules
// so the next page load can inject them synchronously before first paint.
function _updatePreHideCache(data) {
  try {
    if (data.enabled === false) { localStorage.removeItem("__ext_prehide__"); return; }
    const sels = [];
    const collect = (rules, globalOn, fn) => {
      if (globalOn !== false) (rules || []).forEach(r => { if (r.enabled !== false) fn(r); });
    };
    collect(data.hideRules,       data.hideEnabled,      r => r.selector  && sels.push(r.selector));
    collect(data.disableRules,    data.disableEnabled,   r => r.selector  && sels.push(r.selector));
    collect(data.customCssRules,  data.customCssEnabled, r => r.selector  && sels.push(r.selector));
    collect(data.swapRules,       data.swapEnabled,      r => {
      if (r.selectorA) sels.push(r.selectorA);
      if (r.selectorB) sels.push(r.selectorB);
    });
    // Also pre-hide text-rule target scopes (if any)
    collect(data.rules, data.textRulesEnabled, r =>
      (r.targetSelectors || []).forEach(s => s && sels.push(s))
    );
    if (sels.length) {
      localStorage.setItem("__ext_prehide__", `${sels.join(",")}{visibility:hidden!important}`);
    } else {
      localStorage.removeItem("__ext_prehide__");
    }
  } catch (_) {}
}

// Normalize any CSS color to a canonical string for comparison.
// Preserves alpha: rgba(r,g,b,0.16) stays rgba; rgb/hex without alpha → rgb().
function normalizeColor(str) {
  str = (str || "").trim();
  const h6 = str.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (h6) return `rgb(${parseInt(h6[1],16)}, ${parseInt(h6[2],16)}, ${parseInt(h6[3],16)})`;
  const h3 = str.match(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/i);
  if (h3) return `rgb(${parseInt(h3[1]+h3[1],16)}, ${parseInt(h3[2]+h3[2],16)}, ${parseInt(h3[3]+h3[3],16)})`;
  const m = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (m) {
    const a = m[4] !== undefined ? parseFloat(m[4]) : 1;
    return a >= 1 ? `rgb(${m[1]}, ${m[2]}, ${m[3]})` : `rgba(${m[1]}, ${m[2]}, ${m[3]}, ${a})`;
  }
  return str;
}

// Convert color string + 0-100 opacity to rgba() (or rgb() when fully opaque)
function colorToRgba(str, opacity) {
  str = (str || "").trim();
  let r, g, b;
  const h6 = str.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (h6) { r = parseInt(h6[1],16); g = parseInt(h6[2],16); b = parseInt(h6[3],16); }
  else {
    const h3 = str.match(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/i);
    if (h3) { r = parseInt(h3[1]+h3[1],16); g = parseInt(h3[2]+h3[2],16); b = parseInt(h3[3]+h3[3],16); }
    else {
      const m = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (m) { r = parseInt(m[1]); g = parseInt(m[2]); b = parseInt(m[3]); }
    }
  }
  if (r == null) return str;
  const a = Math.max(0, Math.min(100, parseInt(opacity ?? 100))) / 100;
  return a >= 1 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${a})`;
}

function applyStyleOps(el, styleOps) {
  if (!styleOps) return;
  if (styleOps.bold)    el.style.fontWeight = "bold";
  if (styleOps.color)   el.style.color = colorToRgba(styleOps.color, 100);
  if (styleOps.bgColor) el.style.backgroundColor = colorToRgba(styleOps.bgColor, styleOps.bgOpacity ?? 100);
  if (styleOps.colorReplace?.length) applyColorRules(styleOps.colorReplace, new Set([el]));
}

function applyClassOps(el, classOps) {
  if (!classOps) return;
  if (classOps.add) {
    classOps.add.forEach((c) => c && el.classList.add(c));
  }
  if (classOps.remove) {
    classOps.remove.forEach((c) => c && el.classList.remove(c));
  }
  if (classOps.replace) {
    classOps.replace.forEach(({ from, to }) => {
      if (from && el.classList.contains(from)) {
        el.classList.remove(from);
        if (to) el.classList.add(to);
      }
    });
  }
  if (classOps.substringReplace) {
    classOps.substringReplace.forEach(({ from, to }) => {
      if (!from) return;
      // snapshot classList before mutating to avoid index shifting
      const classes = Array.from(el.classList);
      classes.forEach((cls) => {
        if (cls.includes(from)) {
          el.classList.remove(cls);
          el.classList.add(cls.replaceAll(from, to ?? ""));
        }
      });
    });
  }
}

// Returns true if el or any ancestor matches any selector in the array
function elementMatchesAny(el, selectors) {
  if (!selectors || selectors.length === 0) return false;
  return selectors.some(sel => {
    try { return !!el.closest(sel); } catch { return false; }
  });
}

// Applies text replacement rules and returns the set of parent elements that were changed.
function applyRules(rules) {
  const affectedElements = new Set();
  if (!rules || rules.length === 0) return affectedElements;

  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    null
  );

  const textNodes = [];
  let node;
  while ((node = walker.nextNode())) {
    textNodes.push(node);
  }

  for (const textNode of textNodes) {
    let value = textNode.nodeValue;
    const matchedRules = [];

    const parent = textNode.parentElement;

    for (const rule of rules) {
      if (!rule.find || rule.replace == null) continue;

      // Scope checks — run against the text node's parent element
      if (parent) {
        if (rule.targetSelectors?.length && !elementMatchesAny(parent, rule.targetSelectors)) continue;
        if (rule.exceptSelectors?.length &&  elementMatchesAny(parent, rule.exceptSelectors)) continue;
      }

      const flags = rule.caseSensitive ? "g" : "gi";
      const escaped = rule.find.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escaped, flags);
      if (regex.test(value)) {
        value = value.replace(regex, rule.replace);
        matchedRules.push(rule);
      }
    }

    if (matchedRules.length) {
      textNode.nodeValue = value;
      if (parent) {
        matchedRules.forEach((rule) => applyClassOps(parent, rule.classOps));
        matchedRules.forEach((rule) => applyStyleOps(parent, rule.styleOps));
        // Walk up to collect ancestors for color scoping
        let el = parent;
        while (el && el !== document.body) {
          affectedElements.add(el);
          el = el.parentElement;
        }
      }
    }
  }

  return affectedElements;
}

// Returns true if a color string is "default" (transparent, inherit, none, or black/near-black)
function isDefaultOrBlack(color) {
  if (!color || color === "transparent" || color === "" || color === "rgba(0, 0, 0, 0)") return true;

  // Parse rgb/rgba
  const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return false;

  const r = parseInt(match[1]);
  const g = parseInt(match[2]);
  const b = parseInt(match[3]);

  // Black or near-black (0,0,0)
  return r === 0 && g === 0 && b === 0;
}

// targetElements: if provided (Set), only apply to those elements; otherwise apply to all.
function applyColorRules(colorRules, targetElements) {
  if (!colorRules || colorRules.length === 0) return;

  const all = targetElements ? Array.from(targetElements) : Array.from(document.querySelectorAll("*"));

  for (const el of all) {
    const style = window.getComputedStyle(el);
    const bgColor = style.backgroundColor;
    const textColor = style.color;

    const normBg   = normalizeColor(bgColor);
    const normText = normalizeColor(textColor);

    for (const rule of colorRules) {
      if (!rule.from || !rule.to) continue;
      const normFrom = normalizeColor(rule.from);
      const toVal    = colorToRgba(rule.to, rule.toOpacity ?? 100);
      if (rule.type === "background") {
        if (normBg === normFrom && !isDefaultOrBlack(bgColor)) {
          el.style.backgroundColor = toVal;
          if (rule.bold) el.style.fontWeight = "bold";
        }
      }
      if (rule.type === "text") {
        if (normText === normFrom && !isDefaultOrBlack(textColor)) {
          el.style.color = toVal;
          if (rule.bold) el.style.fontWeight = "bold";
        }
      }
    }
  }
}

function applyClassOpsRules(classOpsRules, classOpsEnabled) {
  if (!classOpsEnabled || !classOpsRules?.length) return;
  for (const rule of classOpsRules) {
    if (rule.enabled === false || !rule.selector) continue;
    try {
      const els = document.querySelectorAll(rule.selector);
      for (const el of els) applyClassOps(el, rule.classOps);
    } catch {
      // invalid selector — skip silently
    }
  }
}

function applyCustomCssRules(rules, enabled) {
  document.getElementById("ext-custom-css")?.remove();
  if (!enabled || !rules?.length) return;
  const active = rules.filter(r => r.enabled !== false && r.selector && r.css);
  if (!active.length) return;
  const style = document.createElement("style");
  style.id = "ext-custom-css";
  style.textContent = active.map(r => `${r.selector} { ${r.css} }`).join("\n");
  (document.head || document.documentElement).appendChild(style);
}

function applyDisableRules(disableRules, disableEnabled) {
  if (!disableEnabled || !disableRules || disableRules.length === 0) return;
  for (const rule of disableRules) {
    if (rule.enabled === false || !rule.selector) continue;
    try {
      const els = document.querySelectorAll(rule.selector);
      for (const el of els) {
        // inert blocks all interaction: clicks, keyboard, focus, form submission
        el.inert = true;
        el.style.setProperty("cursor", "pointer", "important");
        if (rule.dimmed !== false) {
          el.style.setProperty("opacity", "0.5", "important");
        }
      }
    } catch {
      // invalid selector — skip silently
    }
  }
}

function applySwapRules(swapRules, swapEnabled) {
  if (!swapEnabled || !swapRules || swapRules.length === 0) return;
  for (const rule of swapRules) {
    if (rule.enabled === false || !rule.selectorA || !rule.selectorB) continue;
    try {
      const a = document.querySelector(rule.selectorA);
      const b = document.querySelector(rule.selectorB);
      if (!a || !b || a === b) continue;

      if (rule.mode === "css") {
        // Visual-only: translate each element to the other's screen position
        const ra = a.getBoundingClientRect();
        const rb = b.getBoundingClientRect();
        const dx = rb.left - ra.left;
        const dy = rb.top  - ra.top;
        a.style.setProperty("transform", `translate(${dx}px, ${dy}px)`,  "important");
        b.style.setProperty("transform", `translate(${-dx}px, ${-dy}px)`, "important");
      } else {
        // DOM swap: physically move elements in the tree
        const placeholder = document.createComment("ext-swap");
        a.replaceWith(placeholder);
        b.replaceWith(a);
        placeholder.replaceWith(b);
      }
    } catch {
      // invalid selector or detached node — skip silently
    }
  }
}

function applyHideRules(hideRules, hideEnabled) {
  if (!hideEnabled || !hideRules || hideRules.length === 0) return;
  for (const rule of hideRules) {
    if (!rule.selector || rule.enabled === false) continue;
    try {
      const els = document.querySelectorAll(rule.selector);
      for (const el of els) {
        if (rule.method === "visibility") {
          el.style.setProperty("visibility", "hidden", "important");
        } else if (rule.method === "blur") {
          el.style.setProperty("filter", `blur(${rule.blurAmount ?? 4}px)`, "important");
        } else {
          el.style.setProperty("display", "none", "important");
        }
      }
    } catch {
      // invalid selector — skip silently
    }
  }
}

function runAll() {
  // If the extension was reloaded/updated, the context is gone — stop gracefully
  if (!chrome?.runtime?.id) {
    observer?.disconnect();
    observer = null;
    return;
  }

  // Disconnect before any DOM mutations so our own changes don't re-trigger runAll
  observer?.disconnect();

  try { chrome.storage.sync.get(["rules", "colorRules", "hideRules", "disableRules", "swapRules", "customCssRules", "classOpsRules", "enabled", "textRulesEnabled", "colorRulesEnabled", "colorScopeReplaced", "hideEnabled", "disableEnabled", "swapEnabled", "customCssEnabled", "classOpsEnabled"], (data) => {
    if (data.enabled !== false) {
      let affectedElements = new Set();
      if (data.textRulesEnabled !== false) {
        const activeRules = (data.rules || []).filter(r => r.enabled !== false);
        affectedElements = applyRules(activeRules);
      }

      if (data.colorRulesEnabled !== false) {
        const activeColorRules = (data.colorRules || []).filter(r => r.enabled !== false);
        const targets = data.colorScopeReplaced ? affectedElements : undefined;
        applyColorRules(activeColorRules, targets);
      }

      applyHideRules(data.hideRules || [], data.hideEnabled !== false);
      applyDisableRules(data.disableRules || [], data.disableEnabled !== false);
      applySwapRules(data.swapRules || [], data.swapEnabled !== false);
      applyCustomCssRules(data.customCssRules || [], data.customCssEnabled !== false);
      applyClassOpsRules(data.classOpsRules || [], data.classOpsEnabled !== false);
    }

    // Update per-element pre-hide cache for the next page load, then reveal
    _updatePreHideCache(data);
    document.getElementById("ext-pre-hide")?.remove();
    _reveal();

    // Reconnect only after all mutations are done to avoid re-triggering
    if (document.body) {
      observer?.observe(document.body, { childList: true, subtree: true });
    }
  }); } catch { /* extension context invalidated — stop silently */ }
}

// ── Element Picker ────────────────────────────────────────────────

function generateSelector(el) {
  // 1. ID
  if (el.id) return `#${CSS.escape(el.id)}`;

  // 2. Common data attributes used as stable identifiers
  for (const attr of ["data-testid", "data-test", "data-cy", "data-qa", "data-id", "data-component"]) {
    if (el.hasAttribute(attr)) {
      return `[${attr}="${el.getAttribute(attr).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"]`;
    }
  }

  // 3. Tag + full class list — only if unique on the page
  const tag = el.tagName.toLowerCase();
  if (el.classList.length) {
    const classes = Array.from(el.classList).map(c => `.${CSS.escape(c)}`).join("");
    const sel = tag + classes;
    try { if (document.querySelectorAll(sel).length === 1) return sel; } catch {}
  }

  // 4. nth-of-type path, stopping at any ancestor with an ID
  const parts = [];
  let cur = el;
  while (cur && cur.tagName && cur !== document.documentElement) {
    if (cur.id) { parts.unshift(`#${CSS.escape(cur.id)}`); break; }
    let part = cur.tagName.toLowerCase();
    const parent = cur.parentElement;
    if (parent) {
      const sameTag = Array.from(parent.children).filter(c => c.tagName === cur.tagName);
      if (sameTag.length > 1) part += `:nth-of-type(${sameTag.indexOf(cur) + 1})`;
    }
    parts.unshift(part);
    cur = cur.parentElement;
  }
  return parts.join(" > ");
}

let pickMode    = false;
let pickContext = null;
let observer    = null; // declared early so runAll() can reference it safely
let pickOverlay = null;
let pickTooltip = null;
let pickBanner  = null;
let lastHovered = null;

function mountPickUI() {
  pickOverlay = document.createElement("div");
  pickOverlay.style.cssText = [
    "position:fixed", "pointer-events:none", "z-index:2147483645",
    "border:2px solid #cba6f7", "background:rgba(203,166,247,0.08)",
    "border-radius:3px", "box-sizing:border-box", "transition:top .07s,left .07s,width .07s,height .07s"
  ].join(";");

  pickTooltip = document.createElement("div");
  pickTooltip.style.cssText = [
    "position:fixed", "pointer-events:none", "z-index:2147483647",
    "background:#1e1e2e", "color:#cba6f7", "border:1px solid #45475a",
    "border-radius:6px", "padding:4px 10px", "font:12px/1.5 monospace",
    "max-width:320px", "overflow:hidden", "text-overflow:ellipsis", "white-space:nowrap",
    "box-shadow:0 4px 14px rgba(0,0,0,.5)"
  ].join(";");

  pickBanner = document.createElement("div");
  pickBanner.style.cssText = [
    "position:fixed", "top:0", "left:0", "right:0", "z-index:2147483646",
    "background:#1e1e2e", "color:#cba6f7", "text-align:center",
    "padding:6px 12px", "font:13px -apple-system,sans-serif",
    "border-bottom:2px solid #cba6f7", "pointer-events:none"
  ].join(";");
  pickBanner.textContent = "Click an element to hide it — Esc to cancel";

  document.body.append(pickOverlay, pickTooltip, pickBanner);
}

function unmountPickUI() {
  pickOverlay?.remove(); pickOverlay = null;
  pickTooltip?.remove(); pickTooltip = null;
  pickBanner?.remove();  pickBanner  = null;
}

function onPickMove(e) {
  const el = e.target;
  if (!el || el === pickOverlay || el === pickTooltip || el === pickBanner) return;
  lastHovered = el;

  const r = el.getBoundingClientRect();
  pickOverlay.style.cssText += `;left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px`;

  const sel = generateSelector(el);
  pickTooltip.textContent = sel;
  const tipY = r.top > 32 ? r.top - 28 : r.bottom + 6;
  const tipX = Math.max(4, Math.min(r.left, window.innerWidth - 330));
  pickTooltip.style.left = tipX + "px";
  pickTooltip.style.top  = tipY + "px";
}

function onPickClick(e) {
  e.preventDefault();
  e.stopImmediatePropagation();
  if (!lastHovered) return;
  const selector = generateSelector(lastHovered);
  if (pickContext?.swapRuleId !== undefined) {
    chrome.storage.local.set({ pendingSwapSelector: { ruleId: pickContext.swapRuleId, selectorIndex: pickContext.selectorIndex, selector } });
  } else if (pickContext?.customCssRuleId) {
    chrome.storage.local.set({ pendingCustomCssSelector: { ruleId: pickContext.customCssRuleId, selector } });
  } else if (pickContext?.classOpsRuleId) {
    chrome.storage.local.set({ pendingClassOpsSelector: { ruleId: pickContext.classOpsRuleId, selector } });
  } else if (pickContext?.disableRuleId) {
    chrome.storage.local.set({ pendingDisableSelector: { ruleId: pickContext.disableRuleId, selector } });
  } else if (pickContext?.ruleId) {
    chrome.storage.local.set({ pendingRuleSelector: { ...pickContext, selector } });
  } else {
    chrome.storage.local.set({ pendingHideSelector: { selector, method: "display" } });
  }
  stopPickMode();
}

function onPickKey(e) {
  if (e.key === "Escape") stopPickMode();
}

function startPickMode(context) {
  if (pickMode) return;
  pickMode    = true;
  pickContext = context || null;
  mountPickUI();
  document.body.style.cursor = "crosshair";
  document.addEventListener("mouseover", onPickMove, true);
  document.addEventListener("click",     onPickClick, true);
  document.addEventListener("keydown",   onPickKey,   true);
}

function stopPickMode() {
  if (!pickMode) return;
  pickMode = false;
  unmountPickUI();
  document.body.style.cursor = "";
  document.removeEventListener("mouseover", onPickMove,  true);
  document.removeEventListener("click",     onPickClick, true);
  document.removeEventListener("keydown",   onPickKey,   true);
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === "startPick") startPickMode(msg.context);
  if (msg.action === "stopPick")  stopPickMode();
});

// ── Run ───────────────────────────────────────────────────────────

// Re-run when storage changes (e.g. user saves new rules)
chrome.storage.onChanged.addListener(() => { if (chrome?.runtime?.id) runAll(); });

// runAll() manages observer disconnect/reconnect inside its async callback
observer = new MutationObserver(runAll);

// At document_start there is no body yet — wait for DOM to be ready before first run
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", runAll);
} else {
  runAll();
}
