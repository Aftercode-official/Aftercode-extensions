//  Name: ExtAxle
//  ID: extensioneditorjs
//  Description: Build and dynamically load JavaScript extensions into Scratch/TurboWarp visually.
//  By: katboizz <https://scratch.mit.edu/users/katboizz/>
//  License: MIT

(function (Scratch) {
  'use strict';

  if (!Scratch.extensions.unsandboxed) {
    throw new Error('requires unsandboxed mode to run!');
  }

  const SELF_ID = 'extensioneditorjs';
  const DEFAULT_COLOR = '#0099ff';

  function getStorageVariable(id) {
    const stage = Scratch.vm.runtime.getTargetForStage();
    const varName = '__extbuilder_' + id;
    return stage.lookupOrCreateVariable(varName, varName);
  }

  function readConfig(id) {
    const v = getStorageVariable(id);
    if (!v || typeof v.value !== 'string' || v.value === '') return null;
    try {
      const parsed = JSON.parse(v.value);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
    } catch (e) {
      return { blocksText: v.value };
    }
  }

  function writeConfig(id, config) {
    getStorageVariable(id).value = JSON.stringify(config);
  }

  function sanitizeId(s) {
    return String(s || '').replace(/[^a-z0-9]/gi, '').toLowerCase() || 'myext';
  }

  function shade(hex, amount) {
    const m = /^#([0-9a-f]{6})$/i.exec(String(hex));
    if (!m) return hex;
    const n = parseInt(m[1], 16);
    const f = 1 - amount;
    return (
      '#' +
      [(n >> 16) & 255, (n >> 8) & 255, n & 255]
        .map((c) => Math.round(c * f).toString(16).padStart(2, '0'))
        .join('')
    );
  }

  const q = (s) => JSON.stringify(String(s));

  function parseArgs(line) {
    const args = [];
    line.replace(/\[([A-Za-z_][A-Za-z0-9_]*)\]/g, (m, name) => {
      if (!args.includes(name)) args.push(name);
      return m;
    });
    return args;
  }
// example extension code
  function buildCode(cfg) {
    const name = String(cfg.name || '').trim() || 'My Custom Extension';
    const id = sanitizeId(cfg.id);
    const color = /^#[0-9a-f]{6}$/i.test(cfg.color) ? cfg.color : DEFAULT_COLOR;
    const lines = String(cfg.blocksText || '')
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    const blockDefs = lines
      .map((line, i) => {
        const args = parseArgs(line);
        const argsCode = args.length
          ? `,\n        arguments: {\n${args
              .map(
                (a) =>
                  `          [${q(a)}]: { type: Scratch.ArgumentType.STRING, defaultValue: ${q(a.toLowerCase())} }`
              )
              .join(',\n')}\n        }`
          : '';
        return `      {\n        opcode: 'action${i}',\n        blockType: Scratch.BlockType.COMMAND,\n        text: ${q(line)}${argsCode}\n      }`;
      })
      .join(',\n');

    const methods = lines
      .map(
        (line, i) =>
          `  action${i}(args) {\n    console.log(${q('Executed block: ' + line)}, args);\n  }`
      )
      .join('\n\n');

    return `class GeneratedExtension {
  getInfo() {
    return {
      id: ${q(id)},
      name: ${q(name)},
      color1: ${q(color)},
      color2: ${q(shade(color, 0.12))},
      color3: ${q(shade(color, 0.24))},
      blocks: [
${blockDefs}
      ]
    };
  }

${methods}
}`;
  }

  // builderKey -> { id, shell, current, delegated, serviceName, opcodes }
  const shells = new Map();

  function instantiateExtension(fullCode, isUnsandboxed) {
    let captured = null;
    const shimExtensions = {
      unsandboxed: !!isUnsandboxed,
      register(obj) {
        captured = obj;
      }
    };
    const shim = Object.create(Scratch, {
      extensions: { value: shimExtensions }
    });

    const factory = new Function(
      'Scratch',
      `"use strict";\n${fullCode}\n;return (typeof GeneratedExtension !== "undefined") ? GeneratedExtension : null;`
    );
    const Ext = factory(shim);

    const instance = captured || (typeof Ext === 'function' ? new Ext() : Ext);
    if (!instance) {
      throw new Error(
        'Không tìm thấy class GeneratedExtension (hoặc lệnh Scratch.extensions.register) trong mã nguồn!'
      );
    }
    if (typeof instance.getInfo !== 'function') {
      throw new Error('Extension phải có phương thức getInfo()');
    }

    const info = instance.getInfo();
    if (!info || typeof info.id !== 'string' || !/^[A-Za-z0-9]+$/.test(info.id)) {
      throw new Error('getInfo() phải trả về "id" hợp lệ (chỉ gồm chữ và số, không có _ hoặc -)');
    }
    instance._isUnsandboxed = !!isUnsandboxed;
    return { instance, id: info.id };
  }

  function collectMethodNames(obj) {
    const names = new Set();
    let o = obj;
    while (o && o !== Object.prototype) {
      for (const k of Object.getOwnPropertyNames(o)) {
        if (k === 'constructor' || k === 'getInfo') continue;
        try {
          if (typeof obj[k] === 'function') names.add(k);
        } catch (e) {}
      }
      o = Object.getPrototypeOf(o);
    }
    return names;
  }

  function createShell(entry) {
    return {
      getInfo() {
        const info = entry.current.getInfo();
        const out = Object.assign({}, info, { id: entry.id });
        if (typeof out.color1 === 'string' && out.color1) {
          if (typeof out.color2 !== 'string') out.color2 = shade(out.color1, 0.12);
          if (typeof out.color3 !== 'string') out.color3 = shade(out.color1, 0.24);
        }
        return out;
      }
    };
  }

  function syncShell(entry) {
    const shell = entry.shell;
    for (const name of entry.delegated) delete shell[name];
    entry.delegated = new Set();
    for (const name of collectMethodNames(entry.current)) {
      shell[name] = (...args) => entry.current[name](...args);
      entry.delegated.add(name);
    }
  }

  function categoryExists(runtime, id) {
    return Array.isArray(runtime._blockInfo) && runtime._blockInfo.some((c) => c && c.id === id);
  }

  async function getBlockly() {
    let SB = null;
    try {
      if (Scratch.gui && typeof Scratch.gui.getBlockly === 'function') {
        SB = await Scratch.gui.getBlockly();
      }
    } catch (e) {}
    return SB || window.ScratchBlocks || window.Blockly || null;
  }

  async function getMainWorkspace() {
    const SB = await getBlockly();
    return SB && typeof SB.getMainWorkspace === 'function' ? SB.getMainWorkspace() : null;
  }

  async function refreshFlyout() {
    try {
      const ws = await getMainWorkspace();
      const tb = ws && (ws.toolbox_ || (typeof ws.getToolbox === 'function' ? ws.getToolbox() : null));
      if (!tb || typeof tb.refreshSelection !== 'function') return;

      let categoryId;
      let offset = 0;
      try {
        categoryId = tb.getSelectedCategoryId();
        offset = tb.getCategoryScrollOffset();
      } catch (e) {}

      tb.refreshSelection();

      try {
        if (categoryId !== undefined) {
          const pos = tb.getCategoryPositionById(categoryId);
          const len = tb.getCategoryLengthById(categoryId);
          tb.setFlyoutScrollPos(offset < len ? pos + offset : pos);
        }
      } catch (e) {}
    } catch (e) {
      console.warn('[ExtensionEditor] flyout refresh failed', e);
    }
  }

  function sanitizeCategoryNames(runtime) {
    if (!Array.isArray(runtime._blockInfo)) return;
    for (const c of runtime._blockInfo) {
      if (!c) continue;
      if (typeof c.name !== 'string') c.name = String(c.id);
      if (typeof c.color1 === 'string' && c.color1) {
        if (typeof c.color2 !== 'string') c.color2 = shade(c.color1, 0.12);
        if (typeof c.color3 !== 'string') c.color3 = shade(c.color1, 0.24);
      }
    }
  }

  const delay = (ms) => new Promise((r) => setTimeout(r, ms));

  function getCategory(runtime, id) {
    return Array.isArray(runtime._blockInfo)
      ? runtime._blockInfo.find((c) => c && c.id === id) || null
      : null;
  }

  function runtimeTexts(runtime, id) {
    const cat = getCategory(runtime, id);
    if (!cat || !Array.isArray(cat.blocks)) return [];
    return cat.blocks
      .map((b) => (b && b.info && typeof b.info.text === 'string' ? b.info.text : null))
      .filter((t) => t !== null);
  }

  function expectedTexts(instance) {
    try {
      const info = instance.getInfo();
      return (info.blocks || [])
        .filter((b) => b && typeof b === 'object' && typeof b.text === 'string')
        .map((b) => b.text);
    } catch (e) {
      return [];
    }
  }


  async function unloadExtensionById(vm, id) {
    const runtime = vm.runtime;
    const em = vm.extensionManager;

    const cat = getCategory(runtime, id);
    const opcodes = cat && Array.isArray(cat.blocks)
      ? cat.blocks.map((b) => b && b.json && b.json.type).filter(Boolean)
      : [];

    // 1) runtime._blockInfo
    if (Array.isArray(runtime._blockInfo)) {
      for (let i = runtime._blockInfo.length - 1; i >= 0; i--) {
        const c = runtime._blockInfo[i];
        if (c && c.id === id) runtime._blockInfo.splice(i, 1);
      }
    }

    // 2) Blockly cache
    try {
      const SB = await getBlockly();
      if (SB && SB.Blocks) {
        for (const op of opcodes) {
          if (SB.Blocks[op]) delete SB.Blocks[op];
        }
      }
    } catch (e) {
      console.warn('[ExtensionEditor] Blockly purge failed', e);
    }

    // 3) extensionManager — quét mọi map có thể chứa ID
    if (em) {
      if (em._loadedExtensions) {
        if (typeof em._loadedExtensions.delete === 'function') {
          em._loadedExtensions.delete(id);
        }
        if (em._loadedExtensions instanceof Map) {
          for (const [k, v] of Array.from(em._loadedExtensions.entries())) {
            if (k === id || v === id) em._loadedExtensions.delete(k);
          }
        }
      }
      if (
        em._loadedExtensions &&
        typeof em._loadedExtensions === 'object' &&
        !(em._loadedExtensions instanceof Map)
      ) {
        delete em._loadedExtensions[id];
      }
      if (em.extensions && em.extensions[id]) {
        delete em.extensions[id];
      }
      if (Array.isArray(em._blockInfo)) {
        for (let i = em._blockInfo.length - 1; i >= 0; i--) {
          const c = em._blockInfo[i];
          if (c && c.id === id) em._blockInfo.splice(i, 1);
        }
      }
      for (const key of [
        '_sandboxedExtensions',
        '_unsandboxedExtensions',
        '_loadedUnsandboxed',
        '_loadedSandboxed'
      ]) {
        const m = em[key];
        if (!m) continue;
        if (m instanceof Map && m.has(id)) m.delete(id);
        else if (typeof m === 'object' && m[id]) delete m[id];
      }
      if (em._extensionPromises && em._extensionPromises[id]) {
        delete em._extensionPromises[id];
      }
    }

    await delay(80);
  }

  async function refreshEditor(vm, id) {
    await delay(50);
    try {
      sanitizeCategoryNames(vm.runtime);
      if (typeof vm.refreshWorkspace === 'function') vm.refreshWorkspace();
      else if (typeof vm.emitWorkspaceUpdate === 'function') vm.emitWorkspaceUpdate();
    } catch (e) {
      console.warn('[ExtensionEditor] editor refresh failed', e);
    }
    setTimeout(refreshFlyout, 50);
    setTimeout(refreshFlyout, 300);
  }

  async function loadExtensionIntoScratch(builderKey, fullCode) {
    const vm = Scratch.vm;
    const em = vm && vm.extensionManager;
    if (
      !em ||
      typeof em._registerInternalExtension !== 'function' ||
      typeof em.refreshBlocks !== 'function'
    ) {
      throw new Error(
        'Không tìm thấy extensionManager._registerInternalExtension / refreshBlocks (API nội bộ có thể đã đổi)'
      );
    }
    const runtime = vm.runtime;

    // 1) Dựng instance mới TRƯỚC
    const { instance, id } = instantiateExtension(fullCode, true);
    if (id === SELF_ID) {
      throw new Error(`ID "${SELF_ID}" là của chính Extension Editor, hãy chọn ID khác`);
    }
    const expected = expectedTexts(instance);

    // 2) Gỡ extension cũ nếu tồn tại
    if (categoryExists(runtime, id)) {
      console.log('[ExtensionEditor] unloading old extension:', id);
      await unloadExtensionById(vm, id);
    }

    // 2b) Xóa cache sandbox của VM cho ID này
    try {
      if (em._loadedExtensions && typeof em._loadedExtensions.delete === 'function') {
        em._loadedExtensions.delete(id);
      }
      if (em._sandboxedExtensions && typeof em._sandboxedExtensions.delete === 'function') {
        em._sandboxedExtensions.delete(id);
      }
      if (em._unsandboxedExtensions && typeof em._unsandboxedExtensions.delete === 'function') {
        em._unsandboxedExtensions.delete(id);
      }
    } catch (e) {}

    // 3) Đăng ký lại
    const entry = { id, shell: null, current: instance, delegated: new Set(), serviceName: null };
    entry.shell = createShell(entry);
    syncShell(entry);

    const opcodes = (instance.getInfo().blocks || [])
      .map((b) => b && b.opcode)
      .filter(Boolean);

    shells.set(builderKey, Object.assign(entry, { opcodes }));

    const serviceName = em._registerInternalExtension(entry.shell);
    entry.serviceName = serviceName;
    if (typeof serviceName === 'string' && em._loadedExtensions) {
      if (typeof em._loadedExtensions.set === 'function') {
        em._loadedExtensions.set(id, serviceName);
      } else {
        em._loadedExtensions[id] = serviceName;
      }
    }

    // 4) Chờ category xuất hiện
    const start = Date.now();
    while (!categoryExists(runtime, id)) {
      if (Date.now() - start > 3000) {
        throw new Error('Đã đăng ký nhưng không thấy category xuất hiện (xem Console)');
      }
      await delay(30);
    }

    // 5) Refresh editor + flyout
    await refreshEditor(vm, id);
    const texts = runtimeTexts(runtime, id);
    console.log('[ExtensionEditor] runtime texts:', texts, 'expected:', expected);
    return {
      id,
      registered: true,
      synced: JSON.stringify(texts) === JSON.stringify(expected),
      texts
    };
  }

  let globalZIndex = 492;
  function bringToFront(winElement) {
    globalZIndex++;
    winElement.style.zIndex = globalZIndex;
  }

  function el(tag, css, props) {
    const e = document.createElement(tag);
    if (css) e.style.cssText = css;
    if (props) Object.assign(e, props);
    return e;
  }

  const INPUT_CSS =
    'width:100%; box-sizing:border-box; margin-top:4px; padding:6px; background:#1e293b; border:1px solid #475569; color:#fff; border-radius:4px; outline:none; font-family:inherit; font-size:12px;';
  const LABEL_CSS = 'font-size:12px; color:#94a3b8; display:block;';

  function field(text, input) {
    const label = el('label', LABEL_CSS);
    label.appendChild(document.createTextNode(text));
    label.appendChild(input);
    return label;
  }

  function openBuilderWindow(extId) {
    const winId = 'extbuilder-' + extId;
    const existing = document.getElementById(winId);
    if (existing) {
      bringToFront(existing);
      return;
    }

    const defaults = {
      name: 'My Custom Extension',
      id: sanitizeId(extId),
      color: DEFAULT_COLOR,
      blocksText: 'hello [NAME]\nadd [NUM1] and [NUM2]'
    };
    const saved = readConfig(extId) || {};
    const config = Object.assign({}, defaults, saved);
    config.name = String(config.name);
    config.id = String(config.id);
    config.blocksText = String(config.blocksText);
    if (!/^#[0-9a-f]{6}$/i.test(config.color)) config.color = DEFAULT_COLOR;

    const win = el(
      'div',
      `position:fixed; left:150px; top:80px; width:800px; height:580px;
       background:#0f172a; border:1px solid #38bdf8; box-shadow:0 20px 50px rgba(0,0,0,0.8);
       display:flex; flex-direction:column; border-radius:10px; overflow:hidden;
       z-index:${++globalZIndex}; font-family:'Fira Code', monospace; color:#e2e8f0; resize:both;`,
      { id: winId }
    );
    win.addEventListener('mousedown', () => bringToFront(win));

    const titleBar = el(
      'div',
      `height:42px; background:#1e293b; display:flex; align-items:center; flex-shrink:0;
       justify-content:space-between; padding:0 16px; border-bottom:1px solid #334155;
       cursor:move; font-weight:bold; color:#38bdf8; user-select:none;`
    );
    titleBar.appendChild(
      el('span', '', { textContent: `Extension Builder & Runner Studio — [${extId}]` })
    );
    const closeBtn = el(
      'span',
      'cursor:pointer; color:#ef4444; font-size:16px; font-weight:bold; padding:4px;',
      { textContent: '✕' }
    );
    titleBar.appendChild(closeBtn);

    const nameInput = el('input', INPUT_CSS, { type: 'text', value: config.name });
    const idInput = el('input', INPUT_CSS, { type: 'text', value: config.id });
    const colorInput = el(
      'input',
      'width:100%; height:32px; margin-top:4px; background:#1e293b; border:1px solid #475569; border-radius:4px; cursor:pointer;',
      { type: 'color', value: config.color }
    );

    // Thông báo cố định về chế độ unsandboxed (không còn checkbox)
    const modeNote = el(
      'div',
      'font-size:11px; color:#fbbf24; background:#422006; border:1px solid #92400e; padding:8px 10px; border-radius:4px; line-height:1.4;',
      {
        textContent:
          '⚠ Chế độ: UNSANDBOXED (bắt buộc). Extension chạy trực tiếp trong VM — có thể dùng DOM, fetch, eval... Không thể chuyển sang sandbox qua API nội bộ.'
      }
    );

    const blocksInput = el('textarea', INPUT_CSS + ' color:#38bdf8; resize:vertical;', {
      rows: 6,
      value: config.blocksText
    });
    const hint = el('div', 'font-size:11px; color:#64748b; line-height:1.4;', {
      textContent: 'Viết [TÊN] trong dòng lệnh để tạo ô nhập tham số, ví dụ: say [TEXT] for [SECS]'
    });

    const leftPanel = el(
      'div',
      'width:40%; box-sizing:border-box; padding:16px; display:flex; flex-direction:column; gap:12px; border-right:1px solid #334155; overflow-y:auto; background:#090d16;'
    );
    leftPanel.appendChild(field('Extension Name:', nameInput));
    leftPanel.appendChild(field('Extension ID:', idInput));
    leftPanel.appendChild(field('Main Color:', colorInput));
    leftPanel.appendChild(modeNote);
    leftPanel.appendChild(field('Danh sách các dòng lệnh (Mỗi dòng 1 khối):', blocksInput));
    leftPanel.appendChild(hint);

    const codeHeader = el(
      'div',
      'padding:8px 16px; background:#111827; font-size:11px; color:#64748b; border-bottom:1px solid #1f2937;',
      {
        textContent:
          'Generated JavaScript Extension Code (sửa tay được — chỉnh panel trái sẽ tạo lại code)'
      }
    );
    const codeOutput = el(
      'textarea',
      `flex-grow:1; background:#030712; color:#34d399; font-family:inherit;
       font-size:12px; padding:12px; border:none; outline:none; resize:none;
       line-height:1.4; tab-size:2; white-space:pre;`,
      { spellcheck: false }
    );
    const rightPanel = el(
      'div',
      'width:60%; display:flex; flex-direction:column; background:#050b14;'
    );
    rightPanel.appendChild(codeHeader);
    rightPanel.appendChild(codeOutput);

    const bodyContainer = el('div', 'display:flex; flex-grow:1; overflow:hidden;');
    bodyContainer.appendChild(leftPanel);
    bodyContainer.appendChild(rightPanel);

    const status = el(
      'span',
      'flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:11px; color:#94a3b8;'
    );
    const saveBtn = el(
      'button',
      'background:#38bdf8; color:#0f172a; border:none; padding:8px 14px; border-radius:4px; font-weight:bold; cursor:pointer; font-family:inherit; font-size:12px;',
      { textContent: 'Save Config' }
    );
    const runNowBtn = el(
      'button',
      'background:#10b981; color:#ffffff; border:none; padding:8px 14px; border-radius:4px; font-weight:bold; cursor:pointer; font-family:inherit; font-size:12px;',
      { textContent: 'Run & Load Extension Now' }
    );
    const footer = el(
      'div',
      'height:50px; flex-shrink:0; background:#1e293b; display:flex; align-items:center; padding:0 16px; gap:10px; border-top:1px solid #334155;'
    );
    footer.appendChild(status);
    footer.appendChild(saveBtn);
    footer.appendChild(runNowBtn);

    win.appendChild(titleBar);
    win.appendChild(bodyContainer);
    win.appendChild(footer);
    document.body.appendChild(win);

    function setStatus(msg, ok) {
      status.textContent = msg;
      status.title = msg;
      status.style.color = ok ? '#34d399' : '#f87171';
    }

    let userEditedCode = false;

    function readForm() {
      return {
        name: nameInput.value,
        id: idInput.value,
        color: colorInput.value,
        blocksText: blocksInput.value
      };
    }

    function regenerate() {
      codeOutput.value = buildCode(readForm());
      userEditedCode = false;
    }

    if (config.codeEdited && typeof config.fullCode === 'string' && config.fullCode.trim()) {
      codeOutput.value = config.fullCode;
      userEditedCode = true;
    } else {
      regenerate();
    }

    leftPanel.addEventListener('input', regenerate);
    codeOutput.addEventListener('input', () => {
      userEditedCode = true;
    });
    codeOutput.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        codeOutput.setRangeText('  ', codeOutput.selectionStart, codeOutput.selectionEnd, 'end');
        userEditedCode = true;
      }
    });

    function collectConfig() {
      return {
        name: nameInput.value,
        id: sanitizeId(idInput.value),
        color: colorInput.value,
        unsandboxed: true, // luôn unsandboxed
        blocksText: blocksInput.value,
        fullCode: codeOutput.value,
        codeEdited: userEditedCode
      };
    }

    saveBtn.onclick = () => {
      const cfg = collectConfig();
      writeConfig(extId, cfg);
      setStatus(`Đã lưu cấu hình [${cfg.id}]`, true);
    };

    runNowBtn.onclick = async () => {
      const cfg = collectConfig();
      writeConfig(extId, cfg);
      runNowBtn.disabled = true;
      try {
        // Unload thủ công nếu đã đăng ký (cho rõ ràng log)
        const existing = shells.get(extId);
        if (existing) {
          await unloadExtensionById(Scratch.vm, existing.id);
          shells.delete(extId);
          if (typeof Scratch.vm.refreshWorkspace === 'function') {
            Scratch.vm.refreshWorkspace();
          }
          await new Promise((r) => setTimeout(r, 80));
        }
        // Load mới (bên trong vẫn check lại cho chắc)
        const r = await loadExtensionIntoScratch(extId, cfg.fullCode);
        const texts = (r.texts || []).map((t) => `"${t}"`).join(', ');
        setStatus(
          r.synced
            ? `Đã nạp lại extension [${r.id}] (unsandboxed) — runtime: ${texts}`
            : `⚠ Đã nạp [${r.id}] nhưng runtime CHƯA khớp — runtime: ${texts}`,
          r.synced
        );
      } catch (e) {
        console.error(e);
        setStatus('Lỗi: ' + e.message, false);
      } finally {
        runNowBtn.disabled = false;
      }
    };

    let dragging = false;
    let startX = 0;
    let startY = 0;

    titleBar.addEventListener('mousedown', (e) => {
      if (e.target === closeBtn) return;
      bringToFront(win);
      dragging = true;
      startX = e.clientX - win.offsetLeft;
      startY = e.clientY - win.offsetTop;
      e.preventDefault();
    });

    const onMouseMove = (e) => {
      if (!dragging) return;
      win.style.left = e.clientX - startX + 'px';
      win.style.top = Math.max(0, e.clientY - startY) + 'px';
    };
    const onMouseUp = () => {
      dragging = false;
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    closeBtn.onclick = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      win.remove();
    };
  }

  /* ------------------------------------------------------------------ */
  /*  Extension chính                                                    */
  /* ------------------------------------------------------------------ */

  class ExtensionEditorJS {
    getInfo() {
      return {
        id: SELF_ID,
        name: 'ExtAxle',
        color1: '#0284c7',
        color2: '#0369a1',
        blocks: [
          {
            opcode: 'openBuilderCommand',
            blockType: Scratch.BlockType.COMMAND,
            text: 'open extension builder [ID]',
            arguments: {
              ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'myext' }
            }
          },
          {
            opcode: 'runExtensionCommand',
            blockType: Scratch.BlockType.COMMAND,
            text: 'load built extension [ID] into project',
            arguments: {
              ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'myext' }
            }
          },
          {
            opcode: 'unloadExtensionCommand',
            blockType: Scratch.BlockType.COMMAND,
            text: 'unload built extension [ID]',
            arguments: {
              ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'myext' }
            }
          }
        ]
      };
    }

    openBuilderCommand(args) {
      const extId = args.ID ? String(args.ID).trim().toLowerCase() : 'myext';
      openBuilderWindow(extId || 'myext');
    }

    async runExtensionCommand(args) {
      const extId = (args.ID ? String(args.ID).trim().toLowerCase() : 'myext') || 'myext';
      const config = readConfig(extId);
      if (!config || typeof config.fullCode !== 'string' || !config.fullCode.trim()) {
        alert(
          `Không tìm thấy cấu hình cho ID: ${extId}. Hãy mở builder, bấm Save Config để tạo trước!`
        );
        return;
      }
      try {
        await loadExtensionIntoScratch(extId, config.fullCode);
      } catch (e) {
        console.error(e);
        alert('Lỗi khi load extension vào Scratch: ' + e.message);
      }
    }

    async unloadExtensionCommand(args) {
      const extId = (args.ID ? String(args.ID).trim().toLowerCase() : 'myext') || 'myext';
      const entry = shells.get(extId);
      if (!entry) {
        alert(`Không có extension nào đang load với builder key: ${extId}`);
        return;
      }
      await unloadExtensionById(Scratch.vm, entry.id);
      shells.delete(extId);
      if (typeof Scratch.vm.refreshWorkspace === 'function') Scratch.vm.refreshWorkspace();
      setTimeout(refreshFlyout, 100);
    }
  }

  Scratch.extensions.register(new ExtensionEditorJS());
})(Scratch);