//  name: javascript
//  version: 1.0
//  description: javascript code editor and runner for scratch
// By: katboizz <https://scratch.mit.edu/users/katboizz/>
//  License: MIT

(function (Scratch) {
  'use strict';

  if (!Scratch.extensions.unsandboxed) {
    throw new Error('unsandboxed required');
  }

  async function loadCodeMirror() {
    if (window.CodeMirror) return;
    await new Promise((resolve) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.css';
      document.head.appendChild(link);
      const themeLink = document.createElement('link');
      themeLink.rel = 'stylesheet';
      themeLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/theme/material-darker.min.css';
      document.head.appendChild(themeLink);
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.js';
      script.onload = () => {
        const jsMode = document.createElement('script');
        jsMode.src = 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/mode/javascript/javascript.min.js';
        jsMode.onload = resolve;
        document.head.appendChild(jsMode);
      };
      document.head.appendChild(script);
    });
  }

  
  function getStorageVariable(id) {
    const stage = Scratch.vm.runtime.getTargetForStage();
    const varName = '__jscode_' + id;
    
    return stage.lookupOrCreateVariable(varName, varName);
  }

  function readCode(id) {
    const v = getStorageVariable(id);
    return v ? String(v.value) : '';
  }

  function writeCode(id, code) {
    getStorageVariable(id).value = code;
  }

  async function openEditorModal(id) {
  await loadCodeMirror();
  const currentCode = readCode(id);

  const overlay = document.createElement('div');
  overlay.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;
    background:rgba(0,0,0,0.6);z-index:99999;display:flex;align-items:center;justify-content:center;`;

  const box = document.createElement('div');
  box.style.cssText = `position:relative;width:70%;height:70%;background:#1e1e1e;border-radius:8px;
    padding:10px;display:flex;flex-direction:column;`;

  const title = document.createElement('div');
  title.textContent = id +'.js';
  title.style.cssText = 'color:#fff;font-family:sans-serif;margin-bottom:6px;';
  box.appendChild(title);

  const textarea = document.createElement('textarea');
  textarea.value = currentCode;
  box.appendChild(textarea);

  const saveBtn = document.createElement('button');
  saveBtn.textContent = 'save code';
  saveBtn.style.cssText = 'margin-top:8px;padding:6px 16px;align-self:flex-end;cursor:pointer;';
  box.appendChild(saveBtn);

  
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '✕';
  closeBtn.style.cssText = `
    position:absolute; top:1%; right:8px;
    width:28px; height:28px;
    background:#ff5f56; color:white; border:none;
    border-radius:15%; cursor:pointer;
    font-weight:bold; font-size:14px; z-index:10;
  `;
  box.appendChild(closeBtn); 

  overlay.appendChild(box);
  document.body.appendChild(overlay);

  const cm = window.CodeMirror.fromTextArea(textarea, {
    mode: 'javascript',
    theme: 'material-darker',
    lineNumbers: true,
    matchBrackets: true,
    autoCloseBrackets: true,
    tabSize: 2,
    indentUnit: 2,
    styleActiveLine: true
  });
  cm.setSize('100%', '100%');

  return new Promise((resolve) => {
    
    closeBtn.onclick = () => {
      overlay.remove();
      resolve();
    };

    
    saveBtn.onclick = () => {
      writeCode(id, cm.getValue());
    };
    closeBtn.onclick = () => {
      overlay.remove();
      resolve();
    }
  });
}

  class JSCodeExtension {
    getInfo() {
      return {
        id: 'jscodeextension',
        name: 'JS Code',
        color1: '#e7e300',
        color2: '#a9ac00',
        blocks: [
          {
            opcode: 'openEditor',
            blockType: Scratch.BlockType.COMMAND,
            text: 'open JS editor for ID [ID]',
            arguments: {
              ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'main' }
            }
          },
          {
            opcode: 'getCode',
            blockType: Scratch.BlockType.REPORTER,
            text: 'javascript code at ID [ID]',
            arguments: {
              ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'main' }
            }
          },
          '---',
          {
            opcode: 'runJS',
            blockType: Scratch.BlockType.COMMAND,
            text: 'run JS [CODE]',
            arguments: {
              CODE: { type: Scratch.ArgumentType.STRING, defaultValue: '// code goes here' }
            }
          }
        ]
      };
    }
    async openEditor(args) {
      await openEditorModal(args.ID);
    }

    getCode(args) {
      return readCode(args.ID);
    }

    runJS(args) {
      try {
        new Function(args.CODE)();
      } catch (e) {
        console.error('error JS:', e);
      }
    }
  }

  Scratch.extensions.register(new JSCodeExtension());
})(Scratch);