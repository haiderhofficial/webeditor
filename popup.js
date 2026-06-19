const textRulesEl            = document.getElementById("textRules");
const colorRulesEl           = document.getElementById("colorRules");
const hideRulesEl            = document.getElementById("hideRules");
const disableRulesEl         = document.getElementById("disableRules");
const swapRulesEl            = document.getElementById("swapRules");
const customCssRulesEl       = document.getElementById("customCssRules");
const classOpsRulesEl        = document.getElementById("classOpsRules");
const enabledEl              = document.getElementById("enabled");
const textRulesEnabledEl     = document.getElementById("textRulesEnabled");
const colorRulesEnabledEl    = document.getElementById("colorRulesEnabled");
const colorScopeEl           = document.getElementById("colorScopeReplaced");
const hideEnabledEl          = document.getElementById("hideEnabled");
const disableEnabledEl       = document.getElementById("disableEnabled");
const swapEnabledEl          = document.getElementById("swapEnabled");
const customCssEnabledEl     = document.getElementById("customCssEnabled");
const classOpsEnabledEl      = document.getElementById("classOpsEnabled");
const statusEl               = document.getElementById("status");

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

function generateRuleId() {
  return Math.random().toString(36).slice(2, 9);
}

function makeRuleSelectorRow(selector, onPick) {
  const row = document.createElement("div");
  row.className = "rule-row";
  row.style.marginTop = "4px";

  const inp = document.createElement("input");
  inp.type = "text";
  inp.value = selector || "";
  inp.placeholder = "#id / .class / tag / [data-attr]…";
  inp.addEventListener("input", () => {
    try {
      if (inp.value.trim()) document.querySelector(inp.value);
      inp.classList.remove("selector-invalid");
    } catch { inp.classList.add("selector-invalid"); }
  });

  const pickBtn = document.createElement("button");
  pickBtn.className = "btn-pick-small";
  pickBtn.title = "Pick element on page";
  pickBtn.textContent = "Pick";
  pickBtn.addEventListener("click", onPick);

  const del = document.createElement("button");
  del.className = "btn-remove";
  del.textContent = "×";
  del.addEventListener("click", () => row.remove());

  row.append(inp, pickBtn, del);
  return row;
}

function makeStyleColorReplaceRow(cr = { type: "text", from: "", to: "", toOpacity: 100, bold: false }) {
  // Wrapper carries .style-color-replace-row so collectTextRules can find it
  const wrap = document.createElement("div");
  wrap.className = "style-color-replace-row";
  wrap.style.marginTop = "4px";

  // Row 1: type + from → to + ×
  const row1 = document.createElement("div");
  row1.className = "rule-row";

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

  const del = document.createElement("button");
  del.className = "btn-remove";
  del.textContent = "×";
  del.addEventListener("click", () => wrap.remove());

  row1.append(typeSelect, fromIn, arrow, toIn, del);

  // Row 2: opacity + bold (indented under row1)
  const row2 = document.createElement("div");
  row2.style.cssText = "display:flex;align-items:center;gap:6px;padding-left:4px;margin-top:3px;";

  const opLbl0 = Object.assign(document.createElement("span"), { className: "opacity-label", textContent: "Opacity:" });
  opLbl0.style.color = "#45475a";

  const opIn = makeOpacityInput(cr.toOpacity);
  opIn.dataset.scOpacity = "1";
  opIn.style.cssText = "width:52px;flex-shrink:0;background:#313244;font-size:11px;padding:3px 5px;";

  const opLbl = Object.assign(document.createElement("span"), { className: "opacity-label", textContent: "%" });

  const boldLbl = document.createElement("label");
  boldLbl.className = "case-check";
  boldLbl.style.cssText = "font-weight:bold;margin-left:6px;";
  const boldCb = document.createElement("input");
  boldCb.type = "checkbox";
  boldCb.checked = cr.bold || false;
  boldCb.dataset.scBold = "1";
  boldLbl.append(boldCb, "B");

  row2.append(opLbl0, opIn, opLbl, boldLbl);
  wrap.append(row1, row2);
  return wrap;
}

function makeTextRuleRow(rule = { find: "", replace: "", caseSensitive: false, classOps: null }) {
  const wrapper = document.createElement("div");
  wrapper.className = "text-rule-wrapper";
  wrapper.dataset.ruleId = rule.id || generateRuleId();

  // ── main row ──
  const row = document.createElement("div");
  row.className = "rule-row";

  // Per-rule enable toggle
  const ruleToggleLabel = document.createElement("label");
  ruleToggleLabel.className = "mini-toggle";
  ruleToggleLabel.title = "Enable / disable this rule";
  const ruleToggleInp = document.createElement("input");
  ruleToggleInp.type = "checkbox";
  ruleToggleInp.dataset.ruleEnabled = "1";
  ruleToggleInp.checked = rule.enabled !== false;
  const ruleToggleSlider = document.createElement("span");
  ruleToggleSlider.className = "mslider";
  ruleToggleLabel.append(ruleToggleInp, ruleToggleSlider);
  function syncTextRuleOpacity() {
    row.classList.toggle("rule-row-disabled", !ruleToggleInp.checked);
    findInput.disabled = replaceInput.disabled = !ruleToggleInp.checked;
  }
  ruleToggleInp.addEventListener("change", syncTextRuleOpacity);

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
  caseCheck.dataset.caseSensitive = "1";
  caseCheck.checked = rule.caseSensitive || false;
  caseLabel.append(caseCheck, "Aa");

  const classToggle = document.createElement("button");
  classToggle.className = "btn-class-toggle";
  classToggle.title = "Class / style / scope operations";
  classToggle.textContent = "{}";

  const removeBtn = document.createElement("button");
  removeBtn.className = "btn-remove";
  removeBtn.title = "Remove rule";
  removeBtn.textContent = "×";
  removeBtn.addEventListener("click", () => wrapper.remove());

  row.append(ruleToggleLabel, findInput, arrow, replaceInput, caseLabel, classToggle, removeBtn);
  syncTextRuleOpacity();

  // ── class ops panel ──
  const ops = rule.classOps || {};
  const so  = rule.styleOps || {};
  const panel = document.createElement("div");
  panel.className = "class-ops-panel";
  const hasClassOps = ops.add?.length || ops.remove?.length || ops.replace?.length || ops.substringReplace?.length;
  const hasStyleOps = so.bold || so.color || so.bgColor || so.colorReplace?.length;
  const hasScopeOps = rule.targetSelectors?.length || rule.exceptSelectors?.length;
  panel.hidden = !(hasClassOps || hasStyleOps || hasScopeOps);

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

  // ── scope section ──
  const scopeDivider = document.createElement("div");
  scopeDivider.style.cssText = "border-top:1px solid #45475a;margin:4px 0 2px;";

  function makeScopeLabel(text, color) {
    const lbl = document.createElement("span");
    lbl.style.cssText = `font-size:11px;color:${color};font-weight:600;`;
    lbl.textContent = text;
    return lbl;
  }

  function makeScopePickHandler(listType) {
    return async () => {
      await saveAll();
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) return;
      const ok = await sendPickToTab(tab, {
        action: "startPick",
        context: { ruleId: wrapper.dataset.ruleId, listType },
      });
      if (ok) window.close();
    };
  }

  function makeScopeSubsection(labelText, labelColor, listClass, savedSelectors) {
    const lbl = makeScopeLabel(labelText, labelColor);

    const list = document.createElement("div");
    list.className = `scope-selector-list ${listClass}`;
    const listType = listClass.includes("target") ? "target" : "except";
    (savedSelectors || []).forEach(sel =>
      list.appendChild(makeRuleSelectorRow(sel, makeScopePickHandler(listType)))
    );

    const addBtn = document.createElement("button");
    addBtn.className = "btn-add";
    addBtn.style.cssText = "padding:3px 6px;font-size:11px;width:auto;";
    addBtn.textContent = "+ Add";
    addBtn.addEventListener("click", () =>
      list.appendChild(makeRuleSelectorRow("", makeScopePickHandler(listType)))
    );

    const pickBtn = document.createElement("button");
    pickBtn.className = "btn-pick-small";
    pickBtn.textContent = "Pick";
    pickBtn.addEventListener("click", makeScopePickHandler(listType));

    const btnRow = document.createElement("div");
    btnRow.style.cssText = "display:flex;gap:6px;margin-top:4px;";
    btnRow.append(addBtn, pickBtn);

    const wrap = document.createElement("div");
    wrap.style.cssText = "display:flex;flex-direction:column;gap:4px;";
    wrap.append(lbl, list, btnRow);
    return wrap;
  }

  const targetSection = makeScopeSubsection(
    "Target — apply only within:", "#a6e3a1", "scope-target-list", rule.targetSelectors
  );
  const exceptSection = makeScopeSubsection(
    "Except — skip these:", "#f38ba8", "scope-except-list", rule.exceptSelectors
  );

  panel.append(addField, removeField, replaceLabel, replaceList, addReplaceBtn, substrLabel, substrList, addSubstrBtn, styleDivider, boldRow, textColorRow, bgRow, colorReplaceLabel, colorReplaceList, addColorReplaceBtn, scopeDivider, targetSection, exceptSection);

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

function makeColorRuleRow(rule = { type: "text", from: "", to: "", toOpacity: 100, bold: false, enabled: true }) {
  const wrap = document.createElement("div");
  wrap.className = "color-rule-wrapper";

  // Row 1: toggle + type + from → to + ×
  const row1 = document.createElement("div");
  row1.className = "rule-row";

  const toggleLabel = document.createElement("label");
  toggleLabel.className = "mini-toggle";
  toggleLabel.title = "Enable / disable this rule";
  const toggleInp = document.createElement("input");
  toggleInp.type = "checkbox";
  toggleInp.dataset.ruleEnabled = "1";
  toggleInp.checked = rule.enabled !== false;
  const toggleSlider = document.createElement("span");
  toggleSlider.className = "mslider";
  toggleLabel.append(toggleInp, toggleSlider);
  function syncColorRuleOpacity() { wrap.classList.toggle("rule-row-disabled", !toggleInp.checked); }
  toggleInp.addEventListener("change", syncColorRuleOpacity);
  syncColorRuleOpacity();

  const typeSelect = makeTypeSelect(rule.type);
  const fromInput  = makeColorInput(rule.from, "find color…");
  fromInput.dataset.colorFrom = "1";
  const arrow      = Object.assign(document.createElement("span"), { className: "arrow", textContent: "→" });
  const toInput    = makeColorInput(rule.to, "replace with…");
  toInput.dataset.colorTo = "1";

  const removeBtn = document.createElement("button");
  removeBtn.className = "btn-remove";
  removeBtn.title = "Remove";
  removeBtn.textContent = "×";
  removeBtn.addEventListener("click", () => wrap.remove());

  row1.append(toggleLabel, typeSelect, fromInput, arrow, toInput, removeBtn);

  // Row 2: opacity + bold (indented)
  const row2 = document.createElement("div");
  row2.className = "color-rule-sub";

  const opLbl0 = Object.assign(document.createElement("span"), { className: "opacity-label", textContent: "Opacity:" });
  opLbl0.style.color = "#45475a";
  const opacityInp = makeOpacityInput(rule.toOpacity);
  opacityInp.dataset.colorOpacity = "1";
  const opLbl = Object.assign(document.createElement("span"), { className: "opacity-label", textContent: "%" });

  const boldLabel = document.createElement("label");
  boldLabel.className = "case-check";
  boldLabel.title = "Bold";
  boldLabel.style.cssText = "font-weight:bold;margin-left:6px;";
  const boldCheck = document.createElement("input");
  boldCheck.type = "checkbox";
  boldCheck.dataset.colorBold = "1";
  boldCheck.checked = rule.bold || false;
  boldLabel.append(boldCheck, "B");

  row2.append(opLbl0, opacityInp, opLbl, boldLabel);

  wrap.append(row1, row2);
  return wrap;
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
    const caseCheck = mainRow.querySelector("[data-case-sensitive]");
    const enabledToggle = mainRow.querySelector("[data-rule-enabled]");

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

    const targetSelectors = Array.from(wrapper.querySelectorAll(".scope-target-list .rule-row input[type=text]"))
      .map(i => i.value.trim()).filter(Boolean);
    const exceptSelectors = Array.from(wrapper.querySelectorAll(".scope-except-list .rule-row input[type=text]"))
      .map(i => i.value.trim()).filter(Boolean);

    return {
      id: wrapper.dataset.ruleId,
      enabled: enabledToggle?.checked !== false,
      find: inputs[0].value.trim(),
      replace: inputs[1].value.trim(),
      caseSensitive: caseCheck?.checked || false,
      classOps,
      styleOps,
      targetSelectors,
      exceptSelectors,
    };
  }).filter((r) => r.find);
}

function collectColorRules() {
  return Array.from(colorRulesEl.querySelectorAll(".color-rule-wrapper")).map((w) => ({
    enabled:   w.querySelector("[data-rule-enabled]")?.checked !== false,
    type:      w.querySelector("select")?.value || "text",
    from:      w.querySelector("[data-color-from]")?.value.trim() || "",
    to:        w.querySelector("[data-color-to]")?.value.trim() || "",
    toOpacity: parseInt(w.querySelector("[data-color-opacity]")?.value ?? "100"),
    bold:      !!(w.querySelector("[data-color-bold]")?.checked),
  })).filter((r) => r.from && r.to);
}

function makeHideRuleRow(rule = { selector: "", method: "display", blurAmount: 4, enabled: true, comment: "" }) {
  const wrapper = document.createElement("div");
  wrapper.className = "hide-rule-wrapper";

  // Comment / label field
  const commentInp = document.createElement("input");
  commentInp.type = "text";
  commentInp.className = "hide-comment-inp";
  commentInp.placeholder = "Comment (optional)…";
  commentInp.value = rule.comment || "";

  // Row 1: toggle + selector + ×
  const row1 = document.createElement("div");
  row1.className = "rule-row";

  const toggleLabel = document.createElement("label");
  toggleLabel.className = "mini-toggle";
  toggleLabel.title = "Enable / disable this rule";
  const toggleInp = document.createElement("input");
  toggleInp.type = "checkbox";
  toggleInp.checked = rule.enabled !== false;
  const toggleSlider = document.createElement("span");
  toggleSlider.className = "mslider";
  toggleLabel.append(toggleInp, toggleSlider);

  function syncRowOpacity() {
    wrapper.classList.toggle("hide-rule-disabled", !toggleInp.checked);
  }
  syncRowOpacity();
  toggleInp.addEventListener("change", syncRowOpacity);

  const selectorInp = document.createElement("input");
  selectorInp.type = "text";
  selectorInp.dataset.hideSelector = "1";
  selectorInp.placeholder = "#id / .class / div > span / [data-test]…";
  selectorInp.value = rule.selector || "";
  selectorInp.addEventListener("input", () => {
    try {
      if (selectorInp.value.trim()) document.querySelector(selectorInp.value);
      selectorInp.classList.remove("selector-invalid");
    } catch {
      selectorInp.classList.add("selector-invalid");
    }
  });

  const removeBtn = document.createElement("button");
  removeBtn.className = "btn-remove";
  removeBtn.title = "Remove";
  removeBtn.textContent = "×";
  removeBtn.addEventListener("click", () => wrapper.remove());

  row1.append(toggleLabel, selectorInp, removeBtn);

  // Row 2: method + blur (indented to align under selector)
  const row2 = document.createElement("div");
  row2.style.cssText = "display:flex;align-items:center;gap:6px;padding-left:36px;";

  const methodSel = document.createElement("select");
  methodSel.className = "hide-method";
  methodSel.style.flex = "1";
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
  blurInp.style.cssText = "width:56px;flex-shrink:0;";

  const blurLbl = Object.assign(document.createElement("span"), { className: "opacity-label", textContent: "px" });

  function syncBlurVisibility() {
    const isBlur = methodSel.value === "blur";
    blurInp.style.display = isBlur ? "" : "none";
    blurLbl.style.display = isBlur ? "" : "none";
  }
  syncBlurVisibility();
  methodSel.addEventListener("change", syncBlurVisibility);

  row2.append(methodSel, blurInp, blurLbl);
  wrapper.append(commentInp, row1, row2);
  return wrapper;
}

function collectHideRules() {
  return Array.from(hideRulesEl.querySelectorAll(".hide-rule-wrapper")).map((w) => {
    const commentInp  = w.querySelector(".hide-comment-inp");
    const toggleInp   = w.querySelector("input[type=checkbox]");
    const selectorInp = w.querySelector("[data-hide-selector]");
    const methodSel   = w.querySelector("select");
    const blurInp     = w.querySelector("input[type=number]");
    return {
      comment:    commentInp?.value.trim() || "",
      enabled:    toggleInp?.checked !== false,
      selector:   selectorInp?.value.trim() || "",
      method:     methodSel?.value || "display",
      blurAmount: parseInt(blurInp?.value ?? "4"),
    };
  }).filter((r) => r.selector);
}

function makeDisableRuleRow(rule = { selector: "", enabled: true, dimmed: true, comment: "" }) {
  const wrapper = document.createElement("div");
  wrapper.className = "disable-rule-wrapper";
  wrapper.dataset.disableRuleId = rule.id || generateRuleId();

  // Comment
  const commentInp = document.createElement("input");
  commentInp.type = "text";
  commentInp.className = "hide-comment-inp";
  commentInp.placeholder = "Comment (optional)…";
  commentInp.value = rule.comment || "";

  // Row 1: toggle + selector + Pick + ×
  const row1 = document.createElement("div");
  row1.className = "rule-row";

  const toggleLabel = document.createElement("label");
  toggleLabel.className = "mini-toggle";
  toggleLabel.title = "Enable / disable this rule";
  const toggleInp = document.createElement("input");
  toggleInp.type = "checkbox";
  toggleInp.checked = rule.enabled !== false;
  const toggleSlider = document.createElement("span");
  toggleSlider.className = "mslider";
  toggleLabel.append(toggleInp, toggleSlider);
  function syncOpacity() { wrapper.classList.toggle("hide-rule-disabled", !toggleInp.checked); }
  toggleInp.addEventListener("change", syncOpacity);
  syncOpacity();

  const selectorInp = document.createElement("input");
  selectorInp.type = "text";
  selectorInp.value = rule.selector || "";
  selectorInp.placeholder = "#id / .class / tag / [data-attr]…";
  selectorInp.dataset.disableSelector = "1";
  selectorInp.addEventListener("input", () => {
    try {
      if (selectorInp.value.trim()) document.querySelector(selectorInp.value);
      selectorInp.classList.remove("selector-invalid");
    } catch { selectorInp.classList.add("selector-invalid"); }
  });

  const pickBtn = document.createElement("button");
  pickBtn.className = "btn-pick-small";
  pickBtn.textContent = "Pick";
  pickBtn.addEventListener("click", async () => {
    await saveAll();
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;
    const ok = await sendPickToTab(tab, {
      action: "startPick",
      context: { disableRuleId: wrapper.dataset.disableRuleId },
    });
    if (ok) window.close();
  });

  const removeBtn = document.createElement("button");
  removeBtn.className = "btn-remove";
  removeBtn.textContent = "×";
  removeBtn.addEventListener("click", () => wrapper.remove());

  row1.append(toggleLabel, selectorInp, pickBtn, removeBtn);

  // Row 2: dim option
  const row2 = document.createElement("div");
  row2.className = "disable-dim-row";

  const dimId = "dim-" + wrapper.dataset.disableRuleId;
  const dimCb = document.createElement("input");
  dimCb.type = "checkbox";
  dimCb.id = dimId;
  dimCb.dataset.disableDimmed = "1";
  dimCb.checked = rule.dimmed !== false;

  const dimLbl = document.createElement("label");
  dimLbl.htmlFor = dimId;
  dimLbl.textContent = "Dim (50% opacity visual hint)";

  row2.append(dimCb, dimLbl);
  wrapper.append(commentInp, row1, row2);
  return wrapper;
}

function collectDisableRules(all = false) {
  const rows = Array.from(disableRulesEl.querySelectorAll(".disable-rule-wrapper")).map((w) => ({
    id:       w.dataset.disableRuleId,
    comment:  w.querySelector(".hide-comment-inp")?.value.trim() || "",
    enabled:  w.querySelector("input[type=checkbox]")?.checked !== false,
    selector: w.querySelector("[data-disable-selector]")?.value.trim() || "",
    dimmed:   !!(w.querySelector("[data-disable-dimmed]")?.checked),
  }));
  return all ? rows : rows.filter((r) => r.selector);
}

function makeSwapRuleRow(rule = { selectorA: "", selectorB: "", enabled: true, comment: "" }) {
  const wrapper = document.createElement("div");
  wrapper.className = "swap-rule-wrapper";
  wrapper.dataset.swapRuleId = rule.id || generateRuleId();

  // Comment
  const commentInp = document.createElement("input");
  commentInp.type = "text";
  commentInp.className = "hide-comment-inp";
  commentInp.placeholder = "Comment (optional)…";
  commentInp.value = rule.comment || "";

  // Header: toggle + label + ×
  const headerRow = document.createElement("div");
  headerRow.className = "rule-row";

  const toggleLabel = document.createElement("label");
  toggleLabel.className = "mini-toggle";
  toggleLabel.title = "Enable / disable this rule";
  const toggleInp = document.createElement("input");
  toggleInp.type = "checkbox";
  toggleInp.checked = rule.enabled !== false;
  const toggleSlider = document.createElement("span");
  toggleSlider.className = "mslider";
  toggleLabel.append(toggleInp, toggleSlider);
  function syncOpacity() { wrapper.classList.toggle("hide-rule-disabled", !toggleInp.checked); }
  toggleInp.addEventListener("change", syncOpacity);
  syncOpacity();

  const headerLbl = document.createElement("span");
  headerLbl.style.cssText = "font-size:11px;color:#6c7086;flex:1;";
  headerLbl.textContent = "Swap positions of:";

  const removeBtn = document.createElement("button");
  removeBtn.className = "btn-remove";
  removeBtn.textContent = "×";
  removeBtn.addEventListener("click", () => wrapper.remove());

  headerRow.append(toggleLabel, headerLbl, removeBtn);

  // Pick handler factory
  function makeSwapPickHandler(selectorIndex) {
    return async () => {
      await saveAll();
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) return;
      const ok = await sendPickToTab(tab, {
        action: "startPick",
        context: { swapRuleId: wrapper.dataset.swapRuleId, selectorIndex },
      });
      if (ok) window.close();
    };
  }

  // Selector row factory (A / B)
  function makeSwapSelRow(labelText, value, dataAttr, selectorIndex) {
    const row = document.createElement("div");
    row.className = "swap-sel-row";

    const lbl = document.createElement("span");
    lbl.className = "swap-sel-lbl";
    lbl.textContent = labelText;

    const inp = document.createElement("input");
    inp.type = "text";
    inp.value = value || "";
    inp.placeholder = "#id / .class / tag / [data-attr]…";
    inp.dataset[dataAttr] = "1";
    inp.style.cssText = "flex:1;min-width:0;background:#1e1e2e;border:1px solid #45475a;border-radius:6px;color:#cdd6f4;padding:5px 8px;font-size:12px;outline:none;transition:border-color .15s;";
    inp.addEventListener("focus",  () => inp.style.borderColor = "#cba6f7");
    inp.addEventListener("blur",   () => inp.style.borderColor = "#45475a");
    inp.addEventListener("input", () => {
      try {
        if (inp.value.trim()) document.querySelector(inp.value);
        inp.classList.remove("selector-invalid");
      } catch { inp.classList.add("selector-invalid"); }
    });

    const pickBtn = document.createElement("button");
    pickBtn.className = "btn-pick-small";
    pickBtn.textContent = "Pick";
    pickBtn.addEventListener("click", makeSwapPickHandler(selectorIndex));

    row.append(lbl, inp, pickBtn);
    return row;
  }

  const rowA = makeSwapSelRow("A", rule.selectorA, "swapA", 0);
  const rowB = makeSwapSelRow("B", rule.selectorB, "swapB", 1);

  // Mode row
  const modeRow = document.createElement("div");
  modeRow.style.cssText = "display:flex;align-items:center;gap:6px;padding-left:36px;margin-top:2px;";

  const modeLbl = document.createElement("span");
  modeLbl.style.cssText = "font-size:11px;color:#6c7086;flex-shrink:0;";
  modeLbl.textContent = "Mode:";

  const modeSel = document.createElement("select");
  modeSel.className = "hide-method";
  modeSel.style.flex = "1";
  modeSel.dataset.swapMode = "1";
  [
    ["dom", "DOM — full position swap"],
    ["css", "CSS — visual only (transform)"],
  ].forEach(([val, label]) => {
    const opt = document.createElement("option");
    opt.value = val;
    opt.textContent = label;
    if ((rule.mode || "dom") === val) opt.selected = true;
    modeSel.appendChild(opt);
  });
  modeRow.append(modeLbl, modeSel);

  wrapper.append(commentInp, headerRow, rowA, rowB, modeRow);
  return wrapper;
}

function collectSwapRules(all = false) {
  const rows = Array.from(swapRulesEl.querySelectorAll(".swap-rule-wrapper")).map((w) => ({
    id:        w.dataset.swapRuleId,
    comment:   w.querySelector(".hide-comment-inp")?.value.trim() || "",
    enabled:   w.querySelector("input[type=checkbox]")?.checked !== false,
    selectorA: w.querySelector("[data-swap-a]")?.value.trim() || "",
    selectorB: w.querySelector("[data-swap-b]")?.value.trim() || "",
    mode:      w.querySelector("[data-swap-mode]")?.value || "dom",
  }));
  return all ? rows : rows.filter((r) => r.selectorA && r.selectorB);
}

function makeCustomCssRuleRow(rule = { selector: "", css: "", enabled: true, comment: "" }) {
  const wrapper = document.createElement("div");
  wrapper.className = "custom-css-wrapper";
  wrapper.dataset.customCssRuleId = rule.id || generateRuleId();

  const commentInp = document.createElement("input");
  commentInp.type = "text";
  commentInp.className = "hide-comment-inp";
  commentInp.placeholder = "Comment (optional)…";
  commentInp.value = rule.comment || "";

  const row1 = document.createElement("div");
  row1.className = "rule-row";

  const toggleLabel = document.createElement("label");
  toggleLabel.className = "mini-toggle";
  toggleLabel.title = "Enable / disable this rule";
  const toggleInp = document.createElement("input");
  toggleInp.type = "checkbox";
  toggleInp.checked = rule.enabled !== false;
  const toggleSlider = document.createElement("span");
  toggleSlider.className = "mslider";
  toggleLabel.append(toggleInp, toggleSlider);
  function syncOpacity() { wrapper.classList.toggle("hide-rule-disabled", !toggleInp.checked); }
  toggleInp.addEventListener("change", syncOpacity);
  syncOpacity();

  const selectorInp = document.createElement("input");
  selectorInp.type = "text";
  selectorInp.value = rule.selector || "";
  selectorInp.placeholder = "#id / .class / tag / [data-attr]…";
  selectorInp.dataset.customCssSelector = "1";
  selectorInp.addEventListener("input", () => {
    try {
      if (selectorInp.value.trim()) document.querySelector(selectorInp.value);
      selectorInp.classList.remove("selector-invalid");
    } catch { selectorInp.classList.add("selector-invalid"); }
  });

  const pickBtn = document.createElement("button");
  pickBtn.className = "btn-pick-small";
  pickBtn.textContent = "Pick";
  pickBtn.addEventListener("click", async () => {
    await saveAll();
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;
    const ok = await sendPickToTab(tab, {
      action: "startPick",
      context: { customCssRuleId: wrapper.dataset.customCssRuleId },
    });
    if (ok) window.close();
  });

  const removeBtn = document.createElement("button");
  removeBtn.className = "btn-remove";
  removeBtn.textContent = "×";
  removeBtn.addEventListener("click", () => wrapper.remove());

  row1.append(toggleLabel, selectorInp, pickBtn, removeBtn);

  const cssTextarea = document.createElement("textarea");
  cssTextarea.className = "custom-css-textarea";
  cssTextarea.dataset.customCssProp = "1";
  cssTextarea.placeholder = "color: red;\nfont-size: 18px;\nbackground: #1a1a2e;";
  cssTextarea.value = rule.css || "";
  cssTextarea.rows = 3;
  cssTextarea.spellcheck = false;

  wrapper.append(commentInp, row1, cssTextarea);
  return wrapper;
}

function collectCustomCssRules(all = false) {
  const rows = Array.from(customCssRulesEl.querySelectorAll(".custom-css-wrapper")).map((w) => ({
    id:       w.dataset.customCssRuleId,
    comment:  w.querySelector(".hide-comment-inp")?.value.trim() || "",
    enabled:  w.querySelector("input[type=checkbox]")?.checked !== false,
    selector: w.querySelector("[data-custom-css-selector]")?.value.trim() || "",
    css:      w.querySelector("[data-custom-css-prop]")?.value.trim() || "",
  }));
  return all ? rows : rows.filter((r) => r.selector && r.css);
}

function makeClassOpsRuleRow(rule = { selector: "", enabled: true, comment: "", classOps: {} }) {
  const wrapper = document.createElement("div");
  wrapper.className = "class-ops-rule-wrapper";
  wrapper.dataset.classOpsRuleId = rule.id || generateRuleId();

  const commentInp = document.createElement("input");
  commentInp.type = "text";
  commentInp.className = "hide-comment-inp";
  commentInp.placeholder = "Comment (optional)…";
  commentInp.value = rule.comment || "";

  const row1 = document.createElement("div");
  row1.className = "rule-row";

  const toggleLabel = document.createElement("label");
  toggleLabel.className = "mini-toggle";
  toggleLabel.title = "Enable / disable this rule";
  const toggleInp = document.createElement("input");
  toggleInp.type = "checkbox";
  toggleInp.checked = rule.enabled !== false;
  const toggleSlider = document.createElement("span");
  toggleSlider.className = "mslider";
  toggleLabel.append(toggleInp, toggleSlider);
  function syncOpacity() { wrapper.classList.toggle("hide-rule-disabled", !toggleInp.checked); }
  toggleInp.addEventListener("change", syncOpacity);
  syncOpacity();

  const selectorInp = document.createElement("input");
  selectorInp.type = "text";
  selectorInp.value = rule.selector || "";
  selectorInp.placeholder = "#id / .class / tag / [data-attr]…";
  selectorInp.dataset.classOpsSelector = "1";
  selectorInp.addEventListener("input", () => {
    try {
      if (selectorInp.value.trim()) document.querySelector(selectorInp.value);
      selectorInp.classList.remove("selector-invalid");
    } catch { selectorInp.classList.add("selector-invalid"); }
  });

  const pickBtn = document.createElement("button");
  pickBtn.className = "btn-pick-small";
  pickBtn.textContent = "Pick";
  pickBtn.addEventListener("click", async () => {
    await saveAll();
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;
    const ok = await sendPickToTab(tab, {
      action: "startPick",
      context: { classOpsRuleId: wrapper.dataset.classOpsRuleId },
    });
    if (ok) window.close();
  });

  const removeBtn = document.createElement("button");
  removeBtn.className = "btn-remove";
  removeBtn.textContent = "×";
  removeBtn.addEventListener("click", () => wrapper.remove());

  row1.append(toggleLabel, selectorInp, pickBtn, removeBtn);

  // Class ops panel — always visible
  const ops = rule.classOps || {};
  const panel = document.createElement("div");
  panel.className = "class-ops-panel";
  panel.style.marginTop = "6px";

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

  const addField    = makeField("Add",    "class1 class2…", (ops.add    || []).join(" "), "classAdd");
  const removeField = makeField("Remove", "class1 class2…", (ops.remove || []).join(" "), "classRemove");

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

  const substrLabel = document.createElement("span");
  substrLabel.className = "class-field-label";
  substrLabel.style.cssText = "margin-top:6px;display:block;";
  substrLabel.title = "Replace a substring inside class names (e.g. Success → Primary)";
  substrLabel.textContent = "In class";

  const substrList = document.createElement("div");
  substrList.className = "class-substr-list";
  (ops.substringReplace || []).forEach((op) => substrList.appendChild(makeClassSubstringRow(op)));

  const addSubstrBtn = document.createElement("button");
  addSubstrBtn.className = "btn-add";
  addSubstrBtn.style.cssText = "margin-top:4px;padding:3px 6px;font-size:11px;width:auto;";
  addSubstrBtn.textContent = "+ Substring pair";
  addSubstrBtn.addEventListener("click", () => substrList.appendChild(makeClassSubstringRow()));

  panel.append(addField, removeField, replaceLabel, replaceList, addReplaceBtn, substrLabel, substrList, addSubstrBtn);
  wrapper.append(commentInp, row1, panel);
  return wrapper;
}

function collectClassOpsRules(all = false) {
  const rows = Array.from(classOpsRulesEl.querySelectorAll(".class-ops-rule-wrapper")).map((w) => {
    const addVal    = w.querySelector("[data-class-add]")?.value || "";
    const removeVal = w.querySelector("[data-class-remove]")?.value || "";
    const replacePairs = Array.from(w.querySelectorAll(".class-replace-list .rule-row")).map((r) => ({
      from: r.querySelector("[data-class-from]")?.value || "",
      to:   r.querySelector("[data-class-to]")?.value || "",
    })).filter((p) => p.from);
    const substringPairs = Array.from(w.querySelectorAll(".class-substr-list .rule-row")).map((r) => ({
      from: r.querySelector("[data-substr-from]")?.value || "",
      to:   r.querySelector("[data-substr-to]")?.value || "",
    })).filter((p) => p.from);
    return {
      id:       w.dataset.classOpsRuleId,
      comment:  w.querySelector(".hide-comment-inp")?.value.trim() || "",
      enabled:  w.querySelector("input[type=checkbox]")?.checked !== false,
      selector: w.querySelector("[data-class-ops-selector]")?.value.trim() || "",
      classOps: {
        add:              addVal.trim() ? addVal.trim().split(/\s+/) : [],
        remove:           removeVal.trim() ? removeVal.trim().split(/\s+/) : [],
        replace:          replacePairs,
        substringReplace: substringPairs,
      },
    };
  });
  return all ? rows : rows.filter((r) => r.selector);
}

// Save the current popup state before closing for a pick operation.
// Includes empty/partial rules (all = true) so IDs are preserved in storage.
function saveAll() {
  return new Promise((resolve) => {
    chrome.storage.sync.set({
      rules:              collectTextRules(),
      colorRules:         collectColorRules(),
      hideRules:          collectHideRules(),
      disableRules:       collectDisableRules(true),
      swapRules:          collectSwapRules(true),
      customCssRules:     collectCustomCssRules(true),
      classOpsRules:      collectClassOpsRules(true),
      enabled:            enabledEl.checked,
      textRulesEnabled:   textRulesEnabledEl.checked,
      colorRulesEnabled:  colorRulesEnabledEl.checked,
      colorScopeReplaced: colorScopeEl.checked,
      hideEnabled:        hideEnabledEl.checked,
      disableEnabled:     disableEnabledEl.checked,
      swapEnabled:        swapEnabledEl.checked,
      customCssEnabled:   customCssEnabledEl.checked,
      classOpsEnabled:    classOpsEnabledEl.checked,
    }, resolve);
  });
}

function loadFromStorage() {
  chrome.storage.sync.get(["rules", "colorRules", "hideRules", "disableRules", "swapRules", "customCssRules", "classOpsRules", "enabled", "textRulesEnabled", "colorRulesEnabled", "colorScopeReplaced", "hideEnabled", "disableEnabled", "swapEnabled", "customCssEnabled", "classOpsEnabled"], (data) => {
    enabledEl.checked            = data.enabled !== false;
    textRulesEnabledEl.checked   = data.textRulesEnabled !== false;
    colorRulesEnabledEl.checked  = data.colorRulesEnabled !== false;
    colorScopeEl.checked         = data.colorScopeReplaced === true;
    hideEnabledEl.checked        = data.hideEnabled !== false;
    disableEnabledEl.checked     = data.disableEnabled !== false;
    swapEnabledEl.checked        = data.swapEnabled !== false;
    customCssEnabledEl.checked   = data.customCssEnabled !== false;
    classOpsEnabledEl.checked    = data.classOpsEnabled !== false;

    textRulesEl.innerHTML = "";
    (data.rules || []).forEach((r) => textRulesEl.appendChild(makeTextRuleRow(r)));

    colorRulesEl.innerHTML = "";
    (data.colorRules || []).forEach((r) => {
      colorRulesEl.appendChild(makeColorRuleRow({
        enabled:   r.enabled !== false,
        type:      r.type,
        from:      r.from,
        to:        r.to,
        toOpacity: r.toOpacity ?? 100,
        bold:      r.bold || false,
      }));
    });

    hideRulesEl.innerHTML = "";
    (data.hideRules || []).forEach((r) => hideRulesEl.appendChild(makeHideRuleRow(r)));

    disableRulesEl.innerHTML = "";
    (data.disableRules || []).forEach((r) => disableRulesEl.appendChild(makeDisableRuleRow(r)));

    swapRulesEl.innerHTML = "";
    (data.swapRules || []).forEach((r) => swapRulesEl.appendChild(makeSwapRuleRow(r)));

    customCssRulesEl.innerHTML = "";
    (data.customCssRules || []).forEach((r) => customCssRulesEl.appendChild(makeCustomCssRuleRow(r)));

    classOpsRulesEl.innerHTML = "";
    (data.classOpsRules || []).forEach((r) => classOpsRulesEl.appendChild(makeClassOpsRuleRow(r)));
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

document.getElementById("addDisableRule").addEventListener("click", () => {
  disableRulesEl.appendChild(makeDisableRuleRow());
});

document.getElementById("addSwapRule").addEventListener("click", () => {
  swapRulesEl.appendChild(makeSwapRuleRow());
});

document.getElementById("addCustomCssRule").addEventListener("click", () => {
  customCssRulesEl.appendChild(makeCustomCssRuleRow());
});

document.getElementById("addClassOpsRule").addEventListener("click", () => {
  classOpsRulesEl.appendChild(makeClassOpsRuleRow());
});

// Sends a pick message to the active tab, injecting content.js first if needed.
// Returns true if the message was sent successfully.
async function sendPickToTab(tab, message) {
  if (!tab || !tab.url || /^(chrome|chrome-extension|edge|about|data):/.test(tab.url)) {
    statusEl.textContent = "Cannot use picker on this type of page.";
    setTimeout(() => (statusEl.textContent = ""), 3000);
    return false;
  }
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tab.id, message, () => {
      if (!chrome.runtime.lastError) { resolve(true); return; }
      // Content script not yet running — inject it first, then retry once
      chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["content.js"] }, () => {
        if (chrome.runtime.lastError) {
          statusEl.textContent = "Cannot use picker on this page.";
          setTimeout(() => (statusEl.textContent = ""), 3000);
          resolve(false);
          return;
        }
        chrome.tabs.sendMessage(tab.id, message, () => {
          void chrome.runtime.lastError; // suppress unchecked error
          resolve(!chrome.runtime.lastError);
        });
      });
    });
  });
}

document.getElementById("pickElement").addEventListener("click", async () => {
  await saveAll();
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;
  const ok = await sendPickToTab(tab, { action: "startPick" });
  if (ok) window.close();
});

function checkPendingSelector() {
  chrome.storage.local.get(["pendingHideSelector", "pendingRuleSelector", "pendingDisableSelector", "pendingSwapSelector", "pendingCustomCssSelector", "pendingClassOpsSelector"], (data) => {
    if (data.pendingHideSelector) {
      chrome.storage.local.remove("pendingHideSelector");
      hideRulesEl.appendChild(makeHideRuleRow(data.pendingHideSelector));
    }
    if (data.pendingRuleSelector) {
      const { ruleId, listType, selector } = data.pendingRuleSelector;
      chrome.storage.local.remove("pendingRuleSelector");
      if (!selector) return;
      const wrapper = textRulesEl.querySelector(`[data-rule-id="${ruleId}"]`);
      if (!wrapper) return;
      const list = wrapper.querySelector(listType === "target" ? ".scope-target-list" : ".scope-except-list");
      if (!list) return;
      const pickHandler = async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab) return;
        const ok = await sendPickToTab(tab, { action: "startPick", context: { ruleId, listType } });
        if (ok) window.close();
      };
      list.appendChild(makeRuleSelectorRow(selector, pickHandler));
      // Ensure the panel is visible
      const panel = wrapper.querySelector(".class-ops-panel");
      if (panel) { panel.hidden = false; wrapper.querySelector(".btn-class-toggle").style.color = "#cba6f7"; }
    }
    if (data.pendingDisableSelector) {
      const { ruleId, selector } = data.pendingDisableSelector;
      chrome.storage.local.remove("pendingDisableSelector");
      if (!selector) return;
      const wrapper = disableRulesEl.querySelector(`[data-disable-rule-id="${ruleId}"]`);
      const inp = wrapper?.querySelector("[data-disable-selector]");
      if (inp) inp.value = selector;
    }
    if (data.pendingCustomCssSelector) {
      const { ruleId, selector } = data.pendingCustomCssSelector;
      chrome.storage.local.remove("pendingCustomCssSelector");
      if (!selector) return;
      const wrapper = customCssRulesEl.querySelector(`[data-custom-css-rule-id="${ruleId}"]`);
      const inp = wrapper?.querySelector("[data-custom-css-selector]");
      if (inp) inp.value = selector;
    }
    if (data.pendingClassOpsSelector) {
      const { ruleId, selector } = data.pendingClassOpsSelector;
      chrome.storage.local.remove("pendingClassOpsSelector");
      if (!selector) return;
      const wrapper = classOpsRulesEl.querySelector(`[data-class-ops-rule-id="${ruleId}"]`);
      const inp = wrapper?.querySelector("[data-class-ops-selector]");
      if (inp) inp.value = selector;
    }
    if (data.pendingSwapSelector) {
      const { ruleId, selectorIndex, selector } = data.pendingSwapSelector;
      chrome.storage.local.remove("pendingSwapSelector");
      if (!selector) return;
      const wrapper = swapRulesEl.querySelector(`[data-swap-rule-id="${ruleId}"]`);
      if (!wrapper) return;
      const attr = selectorIndex === 0 ? "[data-swap-a]" : "[data-swap-b]";
      const inp = wrapper.querySelector(attr);
      if (inp) inp.value = selector;
    }
  });
}

document.getElementById("save").addEventListener("click", () => {
  const rules              = collectTextRules();
  const colorRules         = collectColorRules();
  const hideRules          = collectHideRules();
  const disableRules       = collectDisableRules();
  const swapRules          = collectSwapRules();
  const customCssRules     = collectCustomCssRules();
  const classOpsRules      = collectClassOpsRules();
  const enabled            = enabledEl.checked;
  const textRulesEnabled   = textRulesEnabledEl.checked;
  const colorRulesEnabled  = colorRulesEnabledEl.checked;
  const colorScopeReplaced = colorScopeEl.checked;
  const hideEnabled        = hideEnabledEl.checked;
  const disableEnabled     = disableEnabledEl.checked;
  const swapEnabled        = swapEnabledEl.checked;
  const customCssEnabled   = customCssEnabledEl.checked;
  const classOpsEnabled    = classOpsEnabledEl.checked;

  chrome.storage.sync.set({ rules, colorRules, hideRules, disableRules, swapRules, customCssRules, classOpsRules, enabled, textRulesEnabled, colorRulesEnabled, colorScopeReplaced, hideEnabled, disableEnabled, swapEnabled, customCssEnabled, classOpsEnabled }, () => {
    statusEl.textContent = "Saved! Reload the page to apply changes.";
    setTimeout(() => (statusEl.textContent = ""), 3000);
  });
});

const ALL_KEYS = ["rules", "colorRules", "hideRules", "disableRules", "swapRules", "customCssRules", "classOpsRules", "enabled", "textRulesEnabled", "colorRulesEnabled", "colorScopeReplaced", "hideEnabled", "disableEnabled", "swapEnabled", "customCssEnabled", "classOpsEnabled"];

document.getElementById("exportSettings").addEventListener("click", () => {
  chrome.storage.sync.get(ALL_KEYS, (data) => {
    const json = JSON.stringify({ _ext: "text-replacer-color-changer", _v: 1, ...data }, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const ts = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}-${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`;
    a.download = `Web Editor Chrome Extension Settings ${ts}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });
});

document.getElementById("importSettings").addEventListener("click", () => {
  document.getElementById("importFile").click();
});

document.getElementById("resetSettings").addEventListener("click", () => {
  if (!confirm("Reset all extension settings? This cannot be undone.")) return;
  chrome.storage.sync.remove(ALL_KEYS, () => {
    statusEl.textContent = "Settings cleared.";
    setTimeout(() => (statusEl.textContent = ""), 3000);
    loadFromStorage();
  });
});

document.getElementById("importFile").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const parsed = JSON.parse(ev.target.result);
      if (parsed._ext !== "text-replacer-color-changer") throw new Error("Unrecognised file");
      const { _ext, _v, ...settings } = parsed;
      chrome.storage.sync.set(settings, () => {
        statusEl.textContent = "Settings imported!";
        setTimeout(() => (statusEl.textContent = ""), 3000);
        loadFromStorage();
      });
    } catch {
      statusEl.textContent = "Import failed: invalid file.";
      setTimeout(() => (statusEl.textContent = ""), 3000);
    }
    e.target.value = "";
  };
  reader.readAsText(file);
});

loadFromStorage();
checkPendingSelector();
