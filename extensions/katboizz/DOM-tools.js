// Name: DOM Tools
// ID: DOMTools
// Description: Tạo và quản lý các element DOM, modal, và sự kiện click
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
            text: 'Tạo [TAG] id [ID] nội dung [CONTENT] trong [PARENT]',
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
            text: 'Tạo HTML id [ID] nội dung [HTML] trong [PARENT]',
            arguments: {
              ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'myBox' },
              HTML: { type: Scratch.ArgumentType.STRING, defaultValue: '<b>Hi</b>' },
              PARENT: { type: Scratch.ArgumentType.STRING, defaultValue: 'body' }
            }
          },
          {
            opcode: 'removeElement',
            blockType: Scratch.BlockType.COMMAND,
            text: 'Xóa element id [ID]',
            arguments: {
              ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'myDiv' }
            }
          },
          {
            opcode: 'removeAllCreated',
            blockType: Scratch.BlockType.COMMAND,
            text: 'Xóa tất cả element đã tạo'
          },

          '---',
         
          {
            opcode: 'setHTML',
            blockType: Scratch.BlockType.COMMAND,
            text: 'Set HTML cho id [ID] thành [HTML]',
            arguments: {
              ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'myDiv' },
              HTML: { type: Scratch.ArgumentType.STRING, defaultValue: '<b>Nội dung mới</b>' }
            }
          },
          {
            opcode: 'appendHTML',
            blockType: Scratch.BlockType.COMMAND,
            text: 'Thêm HTML vào cuối id [ID]: [HTML]',
            arguments: {
              ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'myDiv' },
              HTML: { type: Scratch.ArgumentType.STRING, defaultValue: '<p>Thêm</p>' }
            }
          },
          {
            opcode: 'getHTML',
            blockType: Scratch.BlockType.REPORTER,
            text: 'Lấy HTML của id [ID]',
            arguments: {
              ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'myDiv' }
            }
          },
          {
            opcode: 'setText',
            blockType: Scratch.BlockType.COMMAND,
            text: 'Set text cho id [ID] thành [TEXT]',
            arguments: {
              ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'myDiv' },
              TEXT: { type: Scratch.ArgumentType.STRING, defaultValue: 'Hello' }
            }
          },

          '---',
          
          {
            opcode: 'setStyle',
            blockType: Scratch.BlockType.COMMAND,
            text: 'Set style id [ID] thuộc tính [PROP] = [VALUE]',
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
            text: 'Set nhiều style id [ID] từ JSON [JSON]',
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
            text: 'Set vị trí id [ID] x [X] y [Y] đơn vị [UNIT]',
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
            text: 'Set kích thước id [ID] rộng [W] cao [H] đơn vị [UNIT]',
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
            text: 'Lấy style id [ID] thuộc tính [PROP]',
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
            opcode: 'onClick',
            blockType: Scratch.BlockType.HAT,
            text: 'Khi click vào element id [ID]',
            isEdgeActivated: false,
            arguments: {
              ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'myDiv' }
            }
          },
          {
            opcode: 'registerClick',
            blockType: Scratch.BlockType.COMMAND,
            text: 'Bật bắt click cho id [ID]',
            arguments: {
              ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'myDiv' }
            }
          },
          {
            opcode: 'unregisterClick',
            blockType: Scratch.BlockType.COMMAND,
            text: 'Tắt bắt click cho id [ID]',
            arguments: {
              ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'myDiv' }
            }
          },

          '---',
          
          {
            opcode: 'createModal',
            blockType: Scratch.BlockType.COMMAND,
            text: 'Tạo modal id [ID] tiêu đề [TITLE] nội dung [BODY]',
            arguments: {
              ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'myModal' },
              TITLE: { type: Scratch.ArgumentType.STRING, defaultValue: 'Thông báo' },
              BODY: { type: Scratch.ArgumentType.STRING, defaultValue: 'Nội dung...' }
            }
          },
          {
            opcode: 'applyHTMLToModal',
            blockType: Scratch.BlockType.COMMAND,
            text: 'Áp dụng HTML code [HTML] lên modal id [ID]',
            arguments: {
              ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'myModal' },
              HTML: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: '<h2>Tiêu đề</h2><p>Nội dung modal</p>'
              }
            }
          },
          {
            opcode: 'applyHTMLToModalBody',
            blockType: Scratch.BlockType.COMMAND,
            text: 'Áp dụng HTML code [HTML] vào thân modal id [ID]',
            arguments: {
              ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'myModal' },
              HTML: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: '<p>Nội dung thân modal</p>'
              }
            }
          },
          {
            opcode: 'modalHasHTML',
            blockType: Scratch.BlockType.BOOLEAN,
            text: 'Modal id [ID] có chứa HTML?',
            arguments: {
              ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'myModal' }
            }
          },
          {
            opcode: 'showModal',
            blockType: Scratch.BlockType.COMMAND,
            text: 'Hiện modal id [ID]',
            arguments: {
              ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'myModal' }
            }
          },
          {
            opcode: 'hideModal',
            blockType: Scratch.BlockType.COMMAND,
            text: 'Ẩn modal id [ID]',
            arguments: {
              ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'myModal' }
            }
          },
          {
            opcode: 'toggleModal',
            blockType: Scratch.BlockType.COMMAND,
            text: 'Đảo trạng thái modal id [ID]',
            arguments: {
              ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'myModal' }
            }
          },
          {
            opcode: 'isModalVisible',
            blockType: Scratch.BlockType.BOOLEAN,
            text: 'Modal id [ID] đang hiện?',
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
      if (!el) console.warn(`[DOM Tools] Không tìm thấy element: #${id}`);
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
      this.modalBackups.delete(id);
    }

    
    createElement(args) {
      const tag = String(args.TAG).trim() || 'div';
      const id = String(args.ID).trim();
      const parent = this._resolveParent(args.PARENT);

      if (id && document.getElementById(id)) {
        console.warn(`[DOM Tools] id #${id} đã tồn tại, bỏ qua.`);
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
        console.warn(`[DOM Tools] id #${id} đã tồn tại, bỏ qua.`);
        return;
      }

      const wrapper = document.createElement('div');
      if (id) wrapper.id = id;
      wrapper.innerHTML = String(args.HTML);

      parent.appendChild(wrapper);
      if (id) this.createdElements.set(id, wrapper);
    }

    removeElement(args) {
      const id = String(args.ID);
      const el = this._getEl(id);
      if (!el) return;

      this._cleanupElement(id, el);
      el.remove();
      this.createdElements.delete(id);
    }

    removeAllCreated() {
      for (const [id, el] of this.createdElements.entries()) {
        this._cleanupElement(id, el);
        el.remove();
      }
      this.createdElements.clear();
    }

    
    setHTML(args) {
      const el = this._getEl(args.ID);
      if (!el) return;
      el.innerHTML = String(args.HTML);
    }

    appendHTML(args) {
      const el = this._getEl(args.ID);
      if (!el) return;
      el.insertAdjacentHTML('beforeend', String(args.HTML));
    }

    getHTML(args) {
      const el = this._getEl(args.ID);
      if (!el) return '';
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
      } catch (e) {
        console.warn('[DOM Tools] Set style lỗi:', e);
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
      } catch (e) {
        console.warn('[DOM Tools] JSON không hợp lệ:', e);
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
    }

    getStyle(args) {
      const el = this._getEl(args.ID);
      if (!el) return '';
      const prop = String(args.PROP);
      return el.style[prop] || getComputedStyle(el)[prop] || '';
    }

    
    registerClick(args) {
      const id = String(args.ID);
      const el = this._getEl(id);
      if (!el) return;

      if (this.clickListeners.has(id)) return;

      const handler = (e) => {
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
        console.warn(`[DOM Tools] modal #${id} đã tồn tại`);
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