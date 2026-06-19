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

    for (const rule of rules) {
      if (!rule.find || rule.replace == null) continue;
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
      const parent = textNode.parentElement;
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

function applyHideRules(hideRules) {
  if (!hideRules || hideRules.length === 0) return;
  for (const rule of hideRules) {
    if (!rule.selector) continue;
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
  chrome.storage.sync.get(["rules", "colorRules", "hideRules", "enabled", "colorScopeReplaced"], (data) => {
    if (data.enabled === false) return;
    const affectedElements = applyRules(data.rules || []);
    const targets = data.colorScopeReplaced ? affectedElements : undefined;
    applyColorRules(data.colorRules || [], targets);
    applyHideRules(data.hideRules || []);
  });
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

let pickMode = false;
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
  chrome.storage.local.set({ pendingHideSelector: { selector, method: "display" } });
  stopPickMode();
}

function onPickKey(e) {
  if (e.key === "Escape") stopPickMode();
}

function startPickMode() {
  if (pickMode) return;
  pickMode = true;
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
  if (msg.action === "startPick") startPickMode();
  if (msg.action === "stopPick")  stopPickMode();
});

// ── Run ───────────────────────────────────────────────────────────

// Run on page load
runAll();

// Re-run when storage changes (e.g. user updates popup settings)
chrome.storage.onChanged.addListener(() => {
  runAll();
});

// Observe DOM mutations for dynamically loaded content
const observer = new MutationObserver(() => {
  observer.disconnect();
  runAll();
  observer.observe(document.body, { childList: true, subtree: true });
});

if (document.body) {
  observer.observe(document.body, { childList: true, subtree: true });
}
