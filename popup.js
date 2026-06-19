const textRulesEl = document.getElementById("textRules");
const colorRulesEl = document.getElementById("colorRules");
const hideRulesEl  = document.getElementById("hideRules");
const enabledEl    = document.getElementById("enabled");
const colorScopeEl = document.getElementById("colorScopeReplaced");
const statusEl     = document.getElementById("status");

function makePairRow(fromPlaceholder, toPlaceholder, fromAttr, toAttr, op = { from: "", to: "" }) {
  const row = document.createElement("div");
  row.className = "rule-row";
  row.style.marginTop = "4px";

  const fromIn = document.createElement("input");
  fromIn.type = "text";
  fromIn.placeholder = fromPlaceholder;
  fromIn.value = op.from || "";
  fromIn.dataset[fromAttr] = "1";

  const arrow = document.createElement("span");
  arrow.className = "arrow";
  arrow.textContent = "→";

  const toIn = document.createElement("input");
  toIn.type = "text";
  toIn.placeholder = toPlaceholder;
  toIn.value = op.to || "";
  toIn.dataset[toAttr] = "1";

  const del = document.createElement("button");
  del.className = "btn-remove";
  del.textContent = "×";
  del.addEventListener("click", () => row.remove());

  row.append(fromIn, arrow, toIn, del);
  return row;
}

const makeClassReplaceRow    = (op) => makePairRow("exact class", "replace with",     "classFrom",   "classTo",   op);
const makeClassSubstringRow  = (op) => makePairRow("find in class…", "replace with",  "substrFrom",  "substrTo",  op);

function makeStyleColorReplaceRow(cr = { type: "text", from: "", to: "", toOpacity: 100, bold: false }) {
  const row = document.createElement("div");
  row.className = "rule-row style-color-replace-row";
  row.style.marginTop = "4px";

  const typeSelect = makeTypeSelect(cr.type);
  typeSelect.style.cssText = typeSelect.style.cssText.replace("font-size:12px", "font-size:11px").replace("padding:4px 6px", "padding:3px 5px");
  typeSelect.dataset.scType = "1";

  const fromIn = makeColorInput(cr.from, "find color…");
  fromIn.dataset.scFrom = "1";
  fromIn.style.fontSize = "11px";

  const arrow = Object.assign(document.createElement("span"), { className: "arrow", textContent: "→" });

  const toIn = makeColorInput(cr.to, "replace with…");
  toIn.dataset.scTo = "1";
  toIn.style.fontSize = "11px";

  const opIn = makeOpacityInput(cr.toOpacity);
  opIn.dataset.scOpacity = "1";
  opIn.style.width = "44px";

  const opLbl = Object.assign(document.createElement("span"), { className: "opacity-label", textContent: "%" });

  const boldLbl = document.createElement("label");
  boldLbl.className = "case-check";
  boldLbl.style.fontWeight = "bold";
  const boldCb = document.createElement("input");
  boldCb.type = "checkbox";
  boldCb.checked = cr.bold || false;
  boldCb.dataset.scBold = "1";
  boldLbl.append(boldCb, "B");

  const del = document.createElement("button");
  del.className = "btn-remove";
  del.textContent = "×";
  del.addEventListener("click", () => row.remove());

  row.append(typeSelect, fromIn, arrow, toIn, opIn, opLbl, boldLbl, del);
  return row;
}

function makeTextRuleRow(rule = { find: "", replace: "", caseSensitive: false, classOps: null }) {
  const wrapper = document.createElement("div");
  wrapper.className = "text-rule-wrapper";

  // ── main row ──
  const row = document.createElement("div");
  row.className = "rule-row";

  const findInput = document.createElement("input");
  findInput.type = "text";
  findInput.placeholder = "Find…";
  findInput.value = rule.find;

  const arrow = document.createElement("span");
  arrow.className = "arrow";
  arrow.textContent = "→";

  const replaceInput = document.createElement("input");
  replaceInput.type = "text";
  replaceInput.placeholder = "Replace with…";
  replaceInput.value = rule.replace;

  const caseLabel = document.createElement("label");
  caseLabel.className = "case-check";
  const caseCheck = document.createElement("input");
  caseCheck.type = "checkbox";
  caseCheck.checked = rule.caseSensitive || false;
  caseLabel.append(caseCheck, "Aa");

  const classToggle = document.createElement("button");
  classToggle.className = "btn-class-toggle";
  classToggle.title = "Class operations";
  classToggle.textContent = "{}";

  const removeBtn = document.createElement("button");
  removeBtn.className = "btn-remove";
  removeBtn.title = "Remove rule";
  removeBtn.textContent = "×";
  removeBtn.addEventListener("click", () => wrapper.remove());

  row.append(findInput, arrow, replaceInput, caseLabel, classToggle, removeBtn);

  // ── class ops panel ──
  const ops = rule.classOps || {};
  const so  = rule.styleOps || {};
  const panel = document.createElement("div");
  panel.className = "class-ops-panel";
  const hasClassOps = ops.add?.length || ops.remove?.length || ops.replace?.length || ops.substringReplace?.length;
  const hasStyleOps = so.bold || so.color || so.bgColor || so.colorReplace?.length;
  panel.hidden = !(hasClassOps || hasStyleOps);

  function makeField(label, placeholder, value, dataAttr) {
    const wrap = document.createElement("div");
    wrap.className = "class-field";
    const lbl = document.createElement("span");
    lbl.className = "class-field-label";
    lbl.textContent = label;
    const inp = document.createElement("input");
    inp.type = "text";
    inp.placeholder = placeholder;
    inp.value = value || "";
    inp.dataset[dataAttr] = "1";
    wrap.append(lbl, inp);
    return wrap;
  }

  const addField    = makeField("Add",    "class1 class2…",  (ops.add    || []).join(" "), "classAdd");
  const removeField = makeField("Remove", "class1 class2…",  (ops.remove || []).join(" "), "classRemove");

  const replaceLabel = document.createElement("span");
  replaceLabel.className = "class-field-label";
  replaceLabel.textContent = "Replace";

  const replaceList = document.createElement("div");
  replaceList.className = "class-replace-list";
  (ops.replace || []).forEach((op) => replaceList.appendChild(makeClassReplaceRow(op)));

  const addReplaceBtn = document.createElement("button");
  addReplaceBtn.className = "btn-add";
  addReplaceBtn.style.cssText = "margin-top:4px;padding:3px 6px;font-size:11px;width:auto;";
  addReplaceBtn.textContent = "+ Replace pair";
  addReplaceBtn.addEventListener("click", () => replaceList.appendChild(makeClassReplaceRow()));

  // ── substring-in-class replace ──
  const substrLabel = document.createElement("span");
  substrLabel.className = "class-field-label";
  substrLabel.style.cssText = "margin-top:6px;display:block;";
  substrLabel.textContent = "In class";
  substrLabel.title = "Replace a substring inside class names (e.g. Success → Primary changes MuiBadge-colorSuccess → MuiBadge-colorPrimary)";

  const substrList = document.createElement("div");
  substrList.className = "class-substr-list";
  (ops.substringReplace || []).forEach((op) => substrList.appendChild(makeClassSubstringRow(op)));

  const addSubstrBtn = document.createElement("button");
  addSubstrBtn.className = "btn-add";
  addSubstrBtn.style.cssText = "margin-top:4px;padding:3px 6px;font-size:11px;width:auto;";
  addSubstrBtn.textContent = "+ Substring pair";
  addSubstrBtn.addEventListener("click", () => substrList.appendChild(makeClassSubstringRow()));

  // ── style ops section ──
  const styleDivider = document.createElement("div");
  styleDivider.style.cssText = "border-top:1px solid #45475a;margin:4px 0 2px;";

  // Bold
  const boldRow = document.createElement("div");
  boldRow.style.cssText = "display:flex;align-items:center;gap:6px;";
  const boldCb = document.createElement("input");
  boldCb.type = "checkbox";
  boldCb.dataset.styleBold = "1";
  boldCb.checked = so.bold || false;
  boldCb.style.accentColor = "#cba6f7";
  const boldTxt = document.createElement("span");
  boldTxt.style.cssText = "font-size:11px;color:#6c7086;font-weight:bold;cursor:pointer;user-select:none;";
  boldTxt.textContent = "Bold";
  boldTxt.addEventListener("click", () => { boldCb.checked = !boldCb.checked; });
  boldRow.append(boldCb, boldTxt);

  // Text color
  const textColorRow = document.createElement("div");
  textColorRow.className = "class-field";
  const textLbl = Object.assign(document.createElement("span"), { className: "class-field-label", textContent: "Text" });
  const textOnCb = document.createElement("input");
  textOnCb.type = "checkbox";
  textOnCb.dataset.styleColorOn = "1";
  textOnCb.checked = !!so.color;
  textOnCb.style.cssText = "accent-color:#cba6f7;flex-shrink:0;cursor:pointer;";
  const textColorInp = makeColorInput(so.color, "#rrggbb or rgb(…)");
  textColorInp.dataset.styleColor = "1";
  textColorRow.append(textLbl, textOnCb, textColorInp);

  // BG color + opacity number
  const bgRow = document.createElement("div");
  bgRow.className = "class-field";
  const bgLbl = Object.assign(document.createElement("span"), { className: "class-field-label", textContent: "BG" });
  const bgOnCb = document.createElement("input");
  bgOnCb.type = "checkbox";
  bgOnCb.dataset.styleBgOn = "1";
  bgOnCb.checked = !!so.bgColor;
  bgOnCb.style.cssText = "accent-color:#cba6f7;flex-shrink:0;cursor:pointer;";
  const bgColorInp = makeColorInput(so.bgColor, "#rrggbb or rgb(…)");
  bgColorInp.dataset.styleBg = "1";
  const bgOpacityInp = makeOpacityInput(so.bgOpacity ?? 100);
  bgOpacityInp.dataset.styleBgOpacity = "1";
  const bgOpLbl = Object.assign(document.createElement("span"), { className: "opacity-label", textContent: "%" });
  bgRow.append(bgLbl, bgOnCb, bgColorInp, bgOpacityInp, bgOpLbl);

  // Color replace (scoped to this text replacement's element)
  const colorReplaceLabel = document.createElement("span");
  colorReplaceLabel.className = "class-field-label";
  colorReplaceLabel.style.cssText = "margin-top:6px;display:block;";
  colorReplaceLabel.textContent = "Replace";

  const colorReplaceList = document.createElement("div");
  colorReplaceList.className = "style-color-replace-list";
  (so.colorReplace || []).forEach((cr) => colorReplaceList.appendChild(makeStyleColorReplaceRow(cr)));

  const addColorReplaceBtn = document.createElement("button");
  addColorReplaceBtn.className = "btn-add";
  addColorReplaceBtn.style.cssText = "margin-top:4px;padding:3px 6px;font-size:11px;width:auto;";
  addColorReplaceBtn.textContent = "+ Color replace";
  addColorReplaceBtn.addEventListener("click", () => colorReplaceList.appendChild(makeStyleColorReplaceRow()));

  panel.append(addField, removeField, replaceLabel, replaceList, addReplaceBtn, substrLabel, substrList, addSubstrBtn, styleDivider, boldRow, textColorRow, bgRow, colorReplaceLabel, colorReplaceList, addColorReplaceBtn);

  classToggle.addEventListener("click", () => {
    panel.hidden = !panel.hidden;
    classToggle.style.color = panel.hidden ? "" : "#cba6f7";
  });
  if (!panel.hidden) classToggle.style.color = "#cba6f7";

  wrapper.append(row, panel);
  return wrapper;
}

function makeTypeSelect(selected) {
  const sel = document.createElement("select");
  sel.style.cssText = "background:#1e1e2e;border:1px solid #45475a;border-radius:6px;color:#cdd6f4;padding:4px 6px;font-size:12px;outline:none;flex-shrink:0;cursor:pointer;";
  ["text", "background"].forEach((t) => {
    const opt = document.createElement("option");
    opt.value = t;
    opt.textContent = t === "text" ? "Text" : "BG";
    if (selected === t) opt.selected = true;
    sel.appendChild(opt);
  });
  return sel;
}

function makeColorInput(value, placeholder) {
  const inp = document.createElement("input");
  inp.type = "text";
  inp.value = value || "";
  inp.placeholder = placeholder || "#rrggbb or rgb(…)";
  return inp;
}

function makeOpacityInput(value) {
  const inp = document.createElement("input");
  inp.type = "number";
  inp.min = "0";
  inp.max = "100";
  inp.value = value ?? 100;
  inp.title = "Opacity 0–100";
  inp.style.cssText = "width:52px;flex-shrink:0;";
  return inp;
}

function makeColorRuleRow(rule = { type: "text", from: "", to: "", toOpacity: 100, bold: false }) {
  const row = document.createElement("div");
  row.className = "rule-row color-rule-row";

  const typeSelect  = makeTypeSelect(rule.type);
  const fromInput   = makeColorInput(rule.from, "find color…");
  const arrow       = Object.assign(document.createElement("span"), { className: "arrow", textContent: "→" });
  const toInput     = makeColorInput(rule.to,   "replace with…");
  const opacityInp  = makeOpacityInput(rule.toOpacity);
  const opLbl       = Object.assign(document.createElement("span"), { className: "opacity-label", textContent: "%" });

  const boldLabel = document.createElement("label");
  boldLabel.className = "case-check";
  boldLabel.title = "Bold";
  boldLabel.style.fontWeight = "bold";
  const boldCheck = document.createElement("input");
  boldCheck.type = "checkbox";
  boldCheck.checked = rule.bold || false;
  boldLabel.append(boldCheck, "B");

  const removeBtn = document.createElement("button");
  removeBtn.className = "btn-remove";
  removeBtn.title = "Remove";
  removeBtn.textContent = "×";
  removeBtn.addEventListener("click", () => row.remove());

  row.append(typeSelect, fromInput, arrow, toInput, opacityInp, opLbl, boldLabel, removeBtn);
  return row;
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${r}, ${g}, ${b})`;
}

function rgbToHex(rgb) {
  const match = rgb.match(/\d+/g);
  if (!match || match.length < 3) return "#000000";
  return (
    "#" +
    match
      .slice(0, 3)
      .map((n) => parseInt(n).toString(16).padStart(2, "0"))
      .join("")
  );
}

function collectTextRules() {
  const wrappers = textRulesEl.querySelectorAll(".text-rule-wrapper");
  return Array.from(wrappers).map((wrapper) => {
    const mainRow = wrapper.querySelector(".rule-row");
    const inputs = mainRow.querySelectorAll("input[type=text]");
    const caseCheck = mainRow.querySelector("input[type=checkbox]");

    const addVal    = (wrapper.querySelector("[data-class-add]")    || {}).value || "";
    const removeVal = (wrapper.querySelector("[data-class-remove]") || {}).value || "";
    const replacePairs = Array.from(wrapper.querySelectorAll(".class-replace-list .rule-row")).map((r) => ({
      from: (r.querySelector("[data-class-from]") || {}).value || "",
      to:   (r.querySelector("[data-class-to]")   || {}).value || "",
    })).filter((p) => p.from);

    const substringPairs = Array.from(wrapper.querySelectorAll(".class-substr-list .rule-row")).map((r) => ({
      from: (r.querySelector("[data-substr-from]") || {}).value || "",
      to:   (r.querySelector("[data-substr-to]")   || {}).value || "",
    })).filter((p) => p.from);

    const classOps = {
      add:               addVal.trim()    ? addVal.trim().split(/\s+/)    : [],
      remove:            removeVal.trim() ? removeVal.trim().split(/\s+/) : [],
      replace:           replacePairs,
      substringReplace:  substringPairs,
    };

    const styleBold     = !!(wrapper.querySelector("[data-style-bold]")?.checked);
    const styleColorOn  = !!(wrapper.querySelector("[data-style-color-on]")?.checked);
    const styleColor    = styleColorOn ? (wrapper.querySelector("[data-style-color]")?.value.trim() || null) : null;
    const styleBgOn     = !!(wrapper.querySelector("[data-style-bg-on]")?.checked);
    const styleBgColor  = styleBgOn ? (wrapper.querySelector("[data-style-bg]")?.value.trim() || null) : null;
    const styleBgOpacity = parseInt(wrapper.querySelector("[data-style-bg-opacity]")?.value ?? "100");
    const colorReplace  = Array.from(wrapper.querySelectorAll(".style-color-replace-row")).map((r) => ({
      type:      (r.querySelector("[data-sc-type]")    || {}).value   || "text",
      from:      (r.querySelector("[data-sc-from]")    || {}).value?.trim() || "",
      to:        (r.querySelector("[data-sc-to]")      || {}).value?.trim() || "",
      toOpacity: parseInt(r.querySelector("[data-sc-opacity]")?.value ?? "100"),
      bold:      !!(r.querySelector("[data-sc-bold]")?.checked),
    })).filter((cr) => cr.from && cr.to);
    const styleOps = { bold: styleBold, color: styleColor, bgColor: styleBgColor, bgOpacity: styleBgOpacity, colorReplace };

    return {
      find: inputs[0].value.trim(),
      replace: inputs[1].value.trim(),
      caseSensitive: caseCheck.checked,
      classOps,
      styleOps,
    };
  }).filter((r) => r.find);
}

function collectColorRules() {
  const rows = colorRulesEl.querySelectorAll(".rule-row");
  return Array.from(rows).map((row) => {
    const typeSelect  = row.querySelector("select");
    const textInputs  = row.querySelectorAll("input[type=text]");
    const opacityInp  = row.querySelector("input[type=number]");
    const boldCheck   = row.querySelector("input[type=checkbox]");
    return {
      type:      typeSelect.value,
      from:      textInputs[0]?.value.trim() || "",
      to:        textInputs[1]?.value.trim() || "",
      toOpacity: parseInt(opacityInp?.value ?? "100"),
      bold:      boldCheck ? boldCheck.checked : false,
    };
  }).filter((r) => r.from && r.to);
}

function makeHideRuleRow(rule = { selector: "", method: "display", blurAmount: 4 }) {
  const row = document.createElement("div");
  row.className = "rule-row";

  const selectorInp = document.createElement("input");
  selectorInp.type = "text";
  selectorInp.placeholder = "#id  /  .class  /  div > span  /  [data-test]  …";
  selectorInp.value = rule.selector || "";

  selectorInp.addEventListener("input", () => {
    try {
      if (selectorInp.value.trim()) document.querySelector(selectorInp.value);
      selectorInp.classList.remove("selector-invalid");
    } catch {
      selectorInp.classList.add("selector-invalid");
    }
  });

  const methodSel = document.createElement("select");
  methodSel.className = "hide-method";
  [
    ["display",    "display:none"],
    ["visibility", "visibility:hidden"],
    ["blur",       "blur"],
  ].forEach(([val, label]) => {
    const opt = document.createElement("option");
    opt.value = val;
    opt.textContent = label;
    if (rule.method === val) opt.selected = true;
    methodSel.appendChild(opt);
  });

  const blurInp = document.createElement("input");
  blurInp.type = "number";
  blurInp.min = "1";
  blurInp.max = "50";
  blurInp.value = rule.blurAmount ?? 4;
  blurInp.title = "Blur amount in px";
  blurInp.style.cssText = "width:46px;flex-shrink:0;";

  const blurLbl = Object.assign(document.createElement("span"), { className: "opacity-label", textContent: "px" });

  function syncBlurVisibility() {
    const isBlur = methodSel.value === "blur";
    blurInp.style.display = isBlur ? "" : "none";
    blurLbl.style.display = isBlur ? "" : "none";
  }
  syncBlurVisibility();
  methodSel.addEventListener("change", syncBlurVisibility);

  const removeBtn = document.createElement("button");
  removeBtn.className = "btn-remove";
  removeBtn.title = "Remove";
  removeBtn.textContent = "×";
  removeBtn.addEventListener("click", () => row.remove());

  row.append(selectorInp, methodSel, blurInp, blurLbl, removeBtn);
  return row;
}

function collectHideRules() {
  return Array.from(hideRulesEl.querySelectorAll(".rule-row")).map((row) => {
    const selectorInp = row.querySelector("input[type=text]");
    const methodSel   = row.querySelector("select");
    const blurInp     = row.querySelector("input[type=number]");
    return {
      selector:   selectorInp?.value.trim() || "",
      method:     methodSel?.value || "display",
      blurAmount: parseInt(blurInp?.value ?? "4"),
    };
  }).filter((r) => r.selector);
}

function loadFromStorage() {
  chrome.storage.sync.get(["rules", "colorRules", "hideRules", "enabled", "colorScopeReplaced"], (data) => {
    enabledEl.checked = data.enabled !== false;
    colorScopeEl.checked = data.colorScopeReplaced === true;

    textRulesEl.innerHTML = "";
    const rules = data.rules && data.rules.length > 0
      ? data.rules
      : [{ find: "Demo", replace: "Real", caseSensitive: false }];
    rules.forEach((r) => textRulesEl.appendChild(makeTextRuleRow(r)));

    colorRulesEl.innerHTML = "";
    const colorRules = data.colorRules || [];
    colorRules.forEach((r) => {
      colorRulesEl.appendChild(makeColorRuleRow({
        type:      r.type,
        from:      r.from,
        to:        r.to,
        toOpacity: r.toOpacity ?? 100,
        bold:      r.bold || false,
      }));
    });

    hideRulesEl.innerHTML = "";
    (data.hideRules || []).forEach((r) => hideRulesEl.appendChild(makeHideRuleRow(r)));
  });
}

document.getElementById("addTextRule").addEventListener("click", () => {
  textRulesEl.appendChild(makeTextRuleRow());
});

document.getElementById("addColorRule").addEventListener("click", () => {
  colorRulesEl.appendChild(makeColorRuleRow());
});

document.getElementById("addHideRule").addEventListener("click", () => {
  hideRulesEl.appendChild(makeHideRuleRow());
});

document.getElementById("pickElement").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;
  chrome.tabs.sendMessage(tab.id, { action: "startPick" }, () => {
    window.close(); // close popup so user can click on the page
  });
});

// When popup opens, check if a selector was picked since last open
function checkPendingSelector() {
  chrome.storage.local.get("pendingHideSelector", (data) => {
    if (!data.pendingHideSelector) return;
    chrome.storage.local.remove("pendingHideSelector");
    hideRulesEl.appendChild(makeHideRuleRow(data.pendingHideSelector));
  });
}

document.getElementById("save").addEventListener("click", () => {
  const rules             = collectTextRules();
  const colorRules        = collectColorRules();
  const hideRules         = collectHideRules();
  const enabled           = enabledEl.checked;
  const colorScopeReplaced = colorScopeEl.checked;

  chrome.storage.sync.set({ rules, colorRules, hideRules, enabled, colorScopeReplaced }, () => {
    statusEl.textContent = "Saved! Reload the page to apply changes.";
    setTimeout(() => (statusEl.textContent = ""), 3000);
  });
});

loadFromStorage();
checkPendingSelector();
