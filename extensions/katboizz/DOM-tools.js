// Name: DOM Tools
// ID: DOMTools
// Description: Create and manage DOM elements, modals, and click events
// By: katboizz <https://scratch.mit.edu/users/katboizz/>
// License: MIT
(function(Scratch) {
  'use strict';

  if (!Scratch.extensions.unsandboxed) {
    throw new Error('This extension must run unsandboxed');
  }

  class DOMTools {
    constructor() {
      this.createdElements = new Map();
      this.clickListeners = new Map();
      this.modalBackups = new Map();
      this.dragListeners = new Map();
      this.blobUrls = new Set(); // Quản lý bộ nhớ cho Blob URL
    }

    getInfo() {
      return {
        id: 'DOMTools',
        name: 'DOM Tools',
        color1: '#4C97FF',
        color2: '#3373CC',
        blocks: [
          {
            opcode: 'createElement',
            blockType: Scratch.BlockType.COMMAND,
            text: 'Create [TAG] id [ID] content [CONTENT] in [PARENT]',
            arguments: {
              TAG: { type: Scratch.ArgumentType.STRING, defaultValue: 'div' },
              ID:  { type: Scratch.ArgumentType.STRING, defaultValue: 'myDiv' },
              CONTENT: { type: Scratch.ArgumentType.STRING, defaultValue: 'Hello' },
              PARENT: { type: Scratch.ArgumentType.STRING, defaultValue: 'body' }
            }
          },
          {
            opcode: 'createElementHTML',
            blockType: Scratch.BlockType.COMMAND,
            text: 'Create HTML id [ID] content [HTML] in [PARENT]',
            arguments: {
              ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'myBox' },
              HTML: { type: Scratch.ArgumentType.STRING, defaultValue: '<b>Hi</b>' },
              PARENT: { type: Scratch.ArgumentType.STRING, defaultValue: 'body' }
            }
          },
          {
            opcode: 'createHTMLFrame',
            blockType: Scratch.BlockType.COMMAND,
            text: 'Create HTML frame id [ID] width [W] height [H] content [HTML] in [PARENT]',
            arguments: {
              ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'myFrame' },
              W: { type: Scratch.ArgumentType.NUMBER, defaultValue: 400 },
              H: { type: Scratch.ArgumentType.NUMBER, defaultValue: 300 },
              HTML: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: '<!DOCTYPE html><html><head><style>body{font-family:sans-serif;margin:0;padding:16px;background:#111;color:#fff;}</style></head><body><h1>Hello</h1></body></html>'
              },
              PARENT: { type: Scratch.ArgumentType.STRING, defaultValue: 'body' }
            }
          },
          {
            opcode: 'removeElement',
            blockType: Scratch.BlockType.COMMAND,
            text: 'Remove element id [ID]',
            arguments: {
              ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'myDiv' }
            }
          },
          {
            opcode: 'removeAllCreated',
            blockType: Scratch.BlockType.COMMAND,
            text: 'Remove all created elements'
          },

          '---',

          {
            opcode: 'setFrameHTML',
            blockType: Scratch.BlockType.COMMAND,
            text: 'Set HTML frame id [ID] content [HTML]',
            arguments: {
              ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'myFrame' },
              HTML: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: '<!DOCTYPE html><html><body><h1>Updated</h1></body></html>'
              }
            }
          },
          {
            opcode: 'appendHTML',
            blockType: Scratch.BlockType.COMMAND,
            text: 'Append HTML to id [ID]: [HTML]',
            arguments: {
              ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'myDiv' },
              HTML: { type: Scratch.ArgumentType.STRING, defaultValue: '<p>Append</p>' }
            }
          },
          {
            opcode: 'getHTML',
            blockType: Scratch.BlockType.REPORTER,
            text: 'Get HTML of id [ID]',
            arguments: {
              ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'myDiv' }
            }
          },
          {
            opcode: 'setText',
            blockType: Scratch.BlockType.COMMAND,
            text: 'Set text of id [ID] to [TEXT]',
            arguments: {
              ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'myDiv' },
              TEXT: { type: Scratch.ArgumentType.STRING, defaultValue: 'Hello' }
            }
          },

          '---',

          {
            opcode: 'setStyle',
            blockType: Scratch.BlockType.COMMAND,
            text: 'Set style of id [ID] property [PROP] = [VALUE]',
            arguments: {
              ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'myDiv' },
              PROP: {
                type: Scratch.ArgumentType.STRING,
                menu: 'styleProps',
                defaultValue: 'color'
              },
              VALUE: { type: Scratch.ArgumentType.STRING, defaultValue: 'red' }
            }
          },
          {
            opcode: 'setStylesJSON',
            blockType: Scratch.BlockType.COMMAND,
            text: 'Set multiple styles of id [ID] from JSON [JSON]',
            arguments: {
              ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'myDiv' },
              JSON: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: '{"background":"blue","padding":"10px"}'
              }
            }
          },
          {
            opcode: 'setPosition',
            blockType: Scratch.BlockType.COMMAND,
            text: 'Set position of id [ID] x [X] y [Y] unit [UNIT]',
            arguments: {
              ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'myDiv' },
              X: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 },
              Y: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 },
              UNIT: {
                type: Scratch.ArgumentType.STRING,
                menu: 'units',
                defaultValue: 'px'
              }
            }
          },
          {
            opcode: 'setSize',
            blockType: Scratch.BlockType.COMMAND,
            text: 'Set size of id [ID] width [W] height [H] unit [UNIT]',
            arguments: {
              ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'myDiv' },
              W: { type: Scratch.ArgumentType.NUMBER, defaultValue: 100 },
              H: { type: Scratch.ArgumentType.NUMBER, defaultValue: 100 },
              UNIT: {
                type: Scratch.ArgumentType.STRING,
                menu: 'units',
                defaultValue: 'px'
              }
            }
          },
          {
            opcode: 'getStyle',
            blockType: Scratch.BlockType.REPORTER,
            text: 'Get style of id [ID] property [PROP]',
            arguments: {
              ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'myDiv' },
              PROP: {
                type: Scratch.ArgumentType.STRING,
                menu: 'styleProps',
                defaultValue: 'color'
              }
            }
          },

          '---',

          {
            opcode: 'runJSOnElement',
            blockType: Scratch.BlockType.COMMAND,
            text: 'Run JavaScript [CODE] on id [ID]',
            arguments: {
              CODE: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'element.style.background = "red";'
              },
              ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'myDiv' }
            }
          },
          {
            opcode: 'runJSGlobal',
            blockType: Scratch.BlockType.COMMAND,
            text: 'Run JavaScript [CODE]',
            arguments: {
              CODE: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'console.log("Hello from DOM Tools");'
              }
            }
          },
          {
            opcode: 'setJSVariable',
            blockType: Scratch.BlockType.COMMAND,
            text: 'Set JavaScript variable [NAME] to [VALUE]',
            arguments: {
              NAME: { type: Scratch.ArgumentType.STRING, defaultValue: 'myVar' },
              VALUE: { type: Scratch.ArgumentType.STRING, defaultValue: 'hello' }
            }
          },
          {
            opcode: 'getJSVariable',
            blockType: Scratch.BlockType.REPORTER,
            text: 'Get JavaScript variable [NAME]',
            arguments: {
              NAME: { type: Scratch.ArgumentType.STRING, defaultValue: 'myVar' }
            }
          },

          '---',

          {
            opcode: 'onClick',
            blockType: Scratch.BlockType.HAT,
            text: 'When element id [ID] is clicked',
            isEdgeActivated: false,
            arguments: {
              ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'myDiv' }
            }
          },
          {
            opcode: 'registerClick',
            blockType: Scratch.BlockType.COMMAND,
            text: 'Enable click detection for id [ID]',
            arguments: {
              ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'myDiv' }
            }
          },
          {
            opcode: 'unregisterClick',
            blockType: Scratch.BlockType.COMMAND,
            text: 'Disable click detection for id [ID]',
            arguments: {
              ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'myDiv' }
            }
          },

          '---',

          {
            opcode: 'createModal',
            blockType: Scratch.BlockType.COMMAND,
            text: 'Create modal id [ID] title [TITLE] body [BODY]',
            arguments: {
              ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'myModal' },
              TITLE: { type: Scratch.ArgumentType.STRING, defaultValue: 'Notice' },
              BODY: { type: Scratch.ArgumentType.STRING, defaultValue: 'Content...' }
            }
          },
          {
            opcode: 'applyHTMLToModal',
            blockType: Scratch.BlockType.COMMAND,
            text: 'Apply HTML code [HTML] to modal id [ID]',
            arguments: {
              ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'myModal' },
              HTML: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: '<h2>Title</h2><p>Modal content</p>'
              }
            }
          },
          {
            opcode: 'applyHTMLToModalBody',
            blockType: Scratch.BlockType.COMMAND,
            text: 'Apply HTML code [HTML] to modal body id [ID]',
            arguments: {
              ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'myModal' },
              HTML: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: '<p>Modal body content</p>'
              }
            }
          },
          {
            opcode: 'modalHasHTML',
            blockType: Scratch.BlockType.BOOLEAN,
            text: 'Modal id [ID] has HTML?',
            arguments: {
              ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'myModal' }
            }
          },
          {
            opcode: 'showModal',
            blockType: Scratch.BlockType.COMMAND,
            text: 'Show modal id [ID]',
            arguments: {
              ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'myModal' }
            }
          },
          {
            opcode: 'hideModal',
            blockType: Scratch.BlockType.COMMAND,
            text: 'Hide modal id [ID]',
            arguments: {
              ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'myModal' }
            }
          },
          {
            opcode: 'toggleModal',
            blockType: Scratch.BlockType.COMMAND,
            text: 'Toggle modal id [ID]',
            arguments: {
              ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'myModal' }
            }
          },
          {
            opcode: 'isModalVisible',
            blockType: Scratch.BlockType.BOOLEAN,
            text: 'Modal id [ID] is visible?',
            arguments: {
              ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'myModal' }
            }
          }
        ],
        menus: {
          styleProps: {
            acceptReporters: true,
            items: [
              'color', 'background', 'backgroundColor', 'backgroundImage',
              'width', 'height', 'minWidth', 'maxWidth', 'minHeight', 'maxHeight',
              'margin', 'padding', 'border', 'borderRadius',
              'position', 'top', 'left', 'right', 'bottom', 'zIndex',
              'display', 'visibility', 'opacity',
              'fontSize', 'fontFamily', 'fontWeight', 'textAlign',
              'transform', 'transition', 'boxShadow', 'cursor', 'overflow'
            ]
          },
          units: {
            acceptReporters: true,
            items: ['px', '%', 'em', 'rem', 'vw', 'vh']
          }
        }
      };
    }

    _getEl(id) {
      const el = document.getElementById(String(id));
      if (!el) console.warn(`[DOM Tools] Element not found: #${id}`);
      return el;
    }

    _resolveParent(parent) {
      const p = String(parent).trim();
      if (p === 'body' || p === '') return document.body;
      if (p.startsWith('#')) return document.querySelector(p);
      return document.getElementById(p) || document.querySelector(p) || document.body;
    }

    _cleanupElement(id, el) {
      if (this.clickListeners.has(id)) {
        const handler = this.clickListeners.get(id);
        el.removeEventListener('click', handler);
        this.clickListeners.delete(id);
      }
      if (this.dragListeners.has(id)) {
        const data = this.dragListeners.get(id);
        data.handle.removeEventListener('mousedown', data.onDown);
        this.dragListeners.delete(id);
      }
      this.modalBackups.delete(id);
    }

    _fitChildren(el) {
      const hasFixedHeight = el.style.height && el.style.height !== 'auto';
      for (const child of el.children) {
        const tag = child.tagName.toLowerCase();
        if (['script', 'style', 'link', 'meta', 'br', 'hr'].includes(tag)) continue;

        child.style.boxSizing = 'border-box';
        child.style.maxWidth = '100%';

        if (hasFixedHeight) {
          child.style.maxHeight = '100%';
        }

        if (['img', 'video', 'iframe', 'canvas', 'svg', 'object', 'embed'].includes(tag)) {
          child.style.width = child.style.width || '100%';
          child.style.height = child.style.height || 'auto';
          child.style.objectFit = child.style.objectFit || 'contain';
          child.style.display = child.style.display || 'block';
        } else {
          if (!child.style.width) child.style.width = '100%';
          if (hasFixedHeight && !child.style.height) child.style.height = '100%';
        }
      }
    }

    createElement(args) {
      const tag = String(args.TAG).trim() || 'div';
      const id = String(args.ID).trim();
      const parent = this._resolveParent(args.PARENT);

      if (id && document.getElementById(id)) {
        console.warn(`[DOM Tools] id #${id} already exists, skipped.`);
        return;
      }

      const el = document.createElement(tag);
      if (id) el.id = id;
      el.textContent = String(args.CONTENT);

      parent.appendChild(el);
      if (id) this.createdElements.set(id, el);
    }

    createElementHTML(args) {
      const id = String(args.ID).trim();
      const parent = this._resolveParent(args.PARENT);

      if (id && document.getElementById(id)) {
        console.warn(`[DOM Tools] id #${id} already exists, skipped.`);
        return;
      }

      const wrapper = document.createElement('div');
      if (id) wrapper.id = id;

      wrapper.style.boxSizing = 'border-box';
      wrapper.style.display = 'block';
      wrapper.style.overflow = 'auto';

      wrapper.innerHTML = String(args.HTML);
      this._fitChildren(wrapper);

      parent.appendChild(wrapper);
      if (id) this.createdElements.set(id, wrapper);
    }

    createHTMLFrame(args) {
      const id = String(args.ID).trim();
      const htmlCode = String(args.HTML); // Đã đổi tên biến thành htmlCode
      const parent = this._resolveParent(args.PARENT);
      const w = Number(args.W) || 400;
      const h = Number(args.H) || 300;

      if (id && document.getElementById(id)) return;

      const iframe = document.createElement('iframe');
      if (id) iframe.id = id;
      iframe.style.border = '0';
      iframe.style.display = 'block';
      iframe.style.boxSizing = 'border-box';
      iframe.style.width = `${w}px`;
      iframe.style.height = `${h}px`;
      iframe.style.background = '#fff';

      // Sử dụng srcdoc với biến htmlCode
      iframe.srcdoc = htmlCode;

      parent.appendChild(iframe);
      if (id) this.createdElements.set(id, iframe);
    }

    setFrameHTML(args) {
      const el = this._getEl(args.ID);
      if (!el) return;
      if (el.tagName.toLowerCase() !== 'iframe') {
        console.warn(`[DOM Tools] #${args.ID} is not an iframe.`);
        return;
      }

      const html = String(args.HTML);
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      this.blobUrls.add(url);

      // Thu hồi URL cũ để tránh rò rỉ bộ nhớ
      if (el.src && el.src.startsWith('blob:')) {
        URL.revokeObjectURL(el.src);
        this.blobUrls.delete(el.src);
      }

      el.src = url;
    }

    removeElement(args) {
      const id = String(args.ID);
      const el = this._getEl(id);
      if (!el) return;

      // Thu hồi Blob URL nếu là iframe
      if (el.tagName.toLowerCase() === 'iframe' && el.src && el.src.startsWith('blob:')) {
        URL.revokeObjectURL(el.src);
        this.blobUrls.delete(el.src);
      }

      this._cleanupElement(id, el);
      el.remove();
      this.createdElements.delete(id);
    }

    removeAllCreated() {
      for (const [id, el] of this.createdElements.entries()) {
        if (el.tagName.toLowerCase() === 'iframe' && el.src && el.src.startsWith('blob:')) {
          URL.revokeObjectURL(el.src);
          this.blobUrls.delete(el.src);
        }
        this._cleanupElement(id, el);
        el.remove();
      }
      this.createdElements.clear();
    }

    appendHTML(args) {
      const el = this._getEl(args.ID);
      if (!el) return;
      el.insertAdjacentHTML('beforeend', String(args.HTML));
      this._fitChildren(el);
    }

    getHTML(args) {
      const el = this._getEl(args.ID);
      if (!el) return '';
      if (el.tagName.toLowerCase() === 'iframe') {
        try {
          const doc = el.contentDocument || el.contentWindow.document;
          return doc.documentElement.outerHTML;
        } catch (e) {
          return '';
        }
      }
      return el.innerHTML;
    }

    setText(args) {
      const el = this._getEl(args.ID);
      if (!el) return;
      el.textContent = String(args.TEXT);
    }

    setStyle(args) {
      const el = this._getEl(args.ID);
      if (!el) return;
      try {
        el.style[String(args.PROP)] = String(args.VALUE);
        const prop = String(args.PROP);
        if (prop === 'width' || prop === 'height' || prop === 'maxWidth' || prop === 'maxHeight') {
          this._fitChildren(el);
        }
      } catch (e) {
        console.warn('[DOM Tools] Failed to set style:', e);
      }
    }

    setStylesJSON(args) {
      const el = this._getEl(args.ID);
      if (!el) return;
      try {
        const obj = JSON.parse(String(args.JSON));
        for (const k in obj) {
          el.style[k] = obj[k];
        }
        this._fitChildren(el);
      } catch (e) {
        console.warn('[DOM Tools] Invalid JSON:', e);
      }
    }

    setPosition(args) {
      const el = this._getEl(args.ID);
      if (!el) return;
      const unit = String(args.UNIT);
      el.style.position = el.style.position || 'absolute';
      el.style.left = `${Number(args.X)}${unit}`;
      el.style.top = `${Number(args.Y)}${unit}`;
    }

    setSize(args) {
      const el = this._getEl(args.ID);
      if (!el) return;
      const unit = String(args.UNIT);
      el.style.width = `${Number(args.W)}${unit}`;
      el.style.height = `${Number(args.H)}${unit}`;

      this._fitChildren(el);
    }

    getStyle(args) {
      const el = this._getEl(args.ID);
      if (!el) return '';
      const prop = String(args.PROP);
      return el.style[prop] || getComputedStyle(el)[prop] || '';
    }

    runJSOnElement(args) {
      const el = this._getEl(args.ID);
      if (!el) return;
      const code = String(args.CODE);
      try {
        const fn = new Function('element', 'document', 'window', 'Scratch', code);
        fn(el, document, window, Scratch);
      } catch (e) {
        console.warn('[DOM Tools] JS error on element:', e);
      }
    }

    runJSGlobal(args) {
      const code = String(args.CODE);
      try {
        const fn = new Function('document', 'window', 'Scratch', code);
        fn(document, window, Scratch);
      } catch (e) {
        console.warn('[DOM Tools] JS error:', e);
      }
    }

    setJSVariable(args) {
      const name = String(args.NAME);
      const value = String(args.VALUE);
      if (!window.__domToolsVars) window.__domToolsVars = {};
      window.__domToolsVars[name] = value;
    }

    getJSVariable(args) {
      const name = String(args.NAME);
      if (!window.__domToolsVars) return '';
      return window.__domToolsVars[name] ?? '';
    }

    registerClick(args) {
      const id = String(args.ID);
      const el = this._getEl(id);
      if (!el) return;

      if (this.clickListeners.has(id)) return;

      const handler = () => {
        if (Scratch.vm && Scratch.vm.runtime) {
          Scratch.vm.runtime.startHats('DOMTools_onClick', { ID: id });
        }
      };

      el.addEventListener('click', handler);
      this.clickListeners.set(id, handler);
    }

    unregisterClick(args) {
      const id = String(args.ID);
      const el = document.getElementById(id);
      const handler = this.clickListeners.get(id);
      if (el && handler) {
        el.removeEventListener('click', handler);
      }
      this.clickListeners.delete(id);
    }

    onClick(args) {
      return true;
    }

    createModal(args) {
      const id = String(args.ID).trim();
      const title = String(args.TITLE);
      const body = String(args.BODY);

      if (document.getElementById(id)) {
        console.warn(`[DOM Tools] modal #${id} already exists`);
        return;
      }

      const modal = document.createElement('div');
      modal.id = id;
      modal.className = 'dom-tools-modal';
      modal.style.display = 'none';
      modal.innerHTML = `
        <div class="dom-tools-modal-content" style="
          background:#fff;border-radius:10px;padding:20px;
          min-width:280px;max-width:80vw;max-height:80vh;
          overflow:auto;box-shadow:0 8px 32px rgba(0,0,0,0.3);
          font-family:sans-serif;
        ">
          <div class="dom-tools-modal-header" style="
            display:flex;justify-content:space-between;align-items:center;
            margin-bottom:12px;
          ">
            <h3 class="dom-tools-modal-title" style="margin:0;font-size:18px;">${title}</h3>
            <button class="dom-tools-modal-close" style="
              border:none;background:transparent;font-size:22px;
              cursor:pointer;line-height:1;color:#666;
            ">×</button>
          </div>
          <div class="dom-tools-modal-body">${body}</div>
        </div>
      `;

      document.body.appendChild(modal);
      this.createdElements.set(id, modal);
      this.modalBackups.set(id, 'none');

      modal.querySelector('.dom-tools-modal-close').addEventListener('click', () => {
        this.hideModal({ ID: id });
      });

      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.hideModal({ ID: id });
      });

      this.showModal({ ID: id });
    }

    applyHTMLToModal(args) {
      const id = String(args.ID);
      const html = String(args.HTML);
      const el = this._getEl(id);
      if (!el) return;

      el.dataset.hasHtml = 'true';

      if (/dom-tools-modal-content/i.test(html)) {
        el.innerHTML = html;
      } else {
        el.innerHTML = `
          <div class="dom-tools-modal-content" style="
            background:#fff;border-radius:10px;padding:20px;
            min-width:280px;max-width:80vw;max-height:80vh;
            overflow:auto;box-shadow:0 8px 32px rgba(0,0,0,0.3);
            font-family:sans-serif;
          ">
            ${html}
          </div>
        `;
      }

      const closeBtn = el.querySelector('.dom-tools-modal-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => this.hideModal({ ID: id }));
      }

      el.addEventListener('click', (e) => {
        if (e.target === el) this.hideModal({ ID: id });
      });
    }

    applyHTMLToModalBody(args) {
      const id = String(args.ID);
      const html = String(args.HTML);
      const el = this._getEl(id);
      if (!el) return;

      let body = el.querySelector('.dom-tools-modal-body');
      if (!body) {
        const content = el.querySelector('.dom-tools-modal-content') || el;
        body = document.createElement('div');
        body.className = 'dom-tools-modal-body';
        content.appendChild(body);
      }
      body.innerHTML = html;
      el.dataset.hasHtml = 'true';
    }

    modalHasHTML(args) {
      const el = this._getEl(args.ID);
      if (!el) return false;
      const body = el.querySelector('.dom-tools-modal-body');
      const target = body || el;
      const html = target.innerHTML.trim();
      return html.length > 0;
    }

    showModal(args) {
      const id = String(args.ID);
      const el = this._getEl(id);
      if (!el) return;

      if (!this.modalBackups.has(id)) {
        this.modalBackups.set(id, el.style.display || '');
      }

      el.style.display = 'flex';
      el.style.position = el.style.position || 'fixed';
      el.style.top = '0';
      el.style.left = '0';
      el.style.width = '100vw';
      el.style.height = '100vh';
      el.style.zIndex = el.style.zIndex || '9999';
      el.style.justifyContent = el.style.justifyContent || 'center';
      el.style.alignItems = el.style.alignItems || 'center';
      el.style.background = el.style.background || 'rgba(0,0,0,0.5)';

      el.classList.add('dom-tools-modal-visible');
    }

    hideModal(args) {
      const id = String(args.ID);
      const el = this._getEl(id);
      if (!el) return;

      const backup = this.modalBackups.get(id);
      el.style.display = backup !== undefined ? backup : 'none';
      el.classList.remove('dom-tools-modal-visible');
    }

    toggleModal(args) {
      const id = String(args.ID);
      const el = this._getEl(id);
      if (!el) return;

      if (this.isModalVisible({ ID: id })) {
        this.hideModal({ ID: id });
      } else {
        this.showModal({ ID: id });
      }
    }

    isModalVisible(args) {
      const el = this._getEl(args.ID);
      if (!el) return false;
      const style = getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
    }
  }

  Scratch.extensions.register(new DOMTools());
})(Scratch);
