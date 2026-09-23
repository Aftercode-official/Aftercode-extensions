//  Name: javascript v2
//  ID: javascript
//  Description: javascript code editor and runner for scratch
//  By: katboizz <https://scratch.mit.edu/users/katboizz/>
//  License: MIT

/**
 * 
 * Terminal UI @author katboizz
 * 
*/

(function (Scratch) {
  'use strict';

  if (!Scratch.extensions.unsandboxed) {
    throw new Error('requires unsandboxed mode to run!');
  }

  
  function getStorageVariable(id) {
    const stage = Scratch.vm.runtime.getTargetForStage();
    const varName = '__afteros_' + id;
    return stage.lookupOrCreateVariable(varName, varName);
  }

  function readCode(id) {
    const v = getStorageVariable(id);
    return v ? String(v.value) : '';
  }

  function writeCode(id, code) {
    getStorageVariable(id).value = code;
  }

  
  let globalZIndex = 492;
  function bringToFront(winElement) {
    globalZIndex++;
    winElement.style.zIndex = globalZIndex;
  }

  let commandTEXT = '';
  let pendingLogColor = null;

  function logToTerminalGlobal(text, color = '#fef08a') {
    const historyDiv = document.getElementById('history');
    if (!historyDiv) {
      
      createTerminalWindow();
      return setTimeout(() => logToTerminalGlobal(text, color), 50);
    }
    const output = document.createElement('div');
    if (typeof text === 'string' && text.includes('\n')) {
      output.innerHTML = `<pre style="margin:0; font-family:inherit; white-space: pre-wrap; color: ${color};">${escapeHtml(text)}</pre>`;
    } else {
      output.textContent = String(text);
      output.style.color = color;
    }
    historyDiv.appendChild(output);
    historyDiv.scrollTop = historyDiv.scrollHeight;
  }

  
  function createTerminalWindow() {
    if (document.getElementById('afteros-os-container')) {
      const existing = document.getElementById('afteros-os-container');
      bringToFront(existing);
      return;
    }

    
    const osContainer = document.createElement('div');
    osContainer.id = 'afteros-os-container';
    osContainer.style.cssText = `
      position: fixed; bottom: 20px; right: 20px; width: 680px; height: 450px;
      background: #0c0c0c; border: 1px solid #ffd700; border-radius: 8px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.9), inset 0 0 20px rgba(255, 215, 0, 0.05);
      display: flex; flex-direction: column; font-family: 'Fira Code', 'Courier New', Courier, monospace;
      z-index: ${++globalZIndex}; overflow: hidden; resize: both; color: #facc15; padding: 14px; box-sizing: border-box;
    `;

    osContainer.addEventListener('mousedown', () => bringToFront(osContainer));

    
    const titleBar = document.createElement('div');
    titleBar.style.cssText = `
      height: 40px; min-height: 40px; max-height: 40px; background: #161616; 
      display: flex; align-items: center; justify-content: space-between; padding: 0 14px; 
      color: #ffd700; font-size: 14px; font-weight: bold; cursor: move; user-select: none;
      border: 1px solid #332f00; border-radius: 6px; margin-bottom: 12px;
      flex-shrink: 0; box-sizing: border-box;
    `;
    titleBar.innerHTML = '<span style="line-height: 40px;">AfterOS v1.0.0 — Terminal & Kernel</span>';

    const controls = document.createElement('div');
    const closeBtn = document.createElement('span');
    closeBtn.textContent = '✕';
    closeBtn.style.cssText = 'cursor: pointer; color: #ef4444; font-weight: bold; font-size: 16px; padding: 4px 8px;';
    closeBtn.onclick = (e) => {
      e.stopPropagation();
      osContainer.remove();
    };
    controls.appendChild(closeBtn);
    titleBar.appendChild(controls);

    
    const historyDiv = document.createElement('div');
    historyDiv.id = 'history';
    historyDiv.style.cssText = `
      flex-grow: 1; overflow-y: auto; margin-bottom: 10px; padding-right: 5px;
      word-break: break-all; display: flex; flex-direction: column; gap: 6px; font-size: 13px; color: #fef08a;
    `;

    
    const inputLine = document.createElement('div');
    inputLine.style.cssText = `
      display: flex; align-items: flex-start; margin-top: 5px;
      background: rgba(255, 215, 0, 0.03); border: 1px solid #332f00;
      border-radius: 6px; padding: 10px 12px; box-sizing: border-box; flex-shrink: 0;
    `;

    const prompt = document.createElement('span');
    prompt.className = 'prompt';
    prompt.textContent = 'user@afteros:~$';
    prompt.style.cssText = 'color: #ffd700; margin-right: 10px; white-space: nowrap; font-weight: bold; user-select: none;';

    const input = document.createElement('input');
    input.id = 'terminal-input';
    input.rows = 1;
    input.autofocus = true;
    input.style.cssText = `
      background: transparent; border: none; color: #fef08a;
      font-family: inherit; font-size: 13px; outline: none; flex-grow: 1;
      min-height: 1.5em; line-height: 1.5;
    `;

    inputLine.appendChild(prompt);
    inputLine.appendChild(input);

    osContainer.appendChild(titleBar);
    osContainer.appendChild(historyDiv);
    osContainer.appendChild(inputLine);
    document.body.appendChild(osContainer);

    
    function logCommand(cmd) {
      const line = document.createElement('div');
      line.innerHTML = `<span style="color: #ffd700; font-weight: bold;">user@afteros:~$</span> ${escapeHtml(cmd).replace(/\n/g, '<br>')}`;
      historyDiv.appendChild(line);
    }

    function logOutput(text) {
      const output = document.createElement('div');
      if (typeof text === 'string' && text.includes('\n')) {
        output.innerHTML = `<pre style="margin:0; font-family:inherit; white-space: pre-wrap; color: #fef08a;">${escapeHtml(text)}</pre>`;
      } else {
        output.textContent = String(text);
        output.style.color = '#fef08a';
      }
      historyDiv.appendChild(output);
      historyDiv.scrollTop = historyDiv.scrollHeight;
    }

    function escapeHtml(str) {
      return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    
    const commands = new Map();

    function registerCommand(name, handler, description = '') {
      commands.set(String(name).trim().toLowerCase(), { handler, description });
    }

    registerCommand('help', () => {
      logOutput('AfterOS Terminal Environment');
      logOutput('');
      logOutput(`Available commands: ${[...commands.keys()].join(', ')}`);
    }, 'Show available commands');

    registerCommand('about', () => {
      logOutput('Javascript Terminal v2.0.0');
      logOutput('A browser-based JavaScript OS integrated into Scratch/TurboWarp.');
    }, 'About AfterOS');

    registerCommand('date', () => logOutput(new Date().toString()), 'Show current date');
    registerCommand('clear', () => { historyDiv.innerHTML = ''; }, 'Clear terminal history');

    registerCommand('neofetch', () => {
      logOutput("Welcome to the Terminal. Type 'help' for commands. BASED ON JAVASCRIPT.");
      const art = [
        "       /\\        ",
        "      /  \\       user@afterOS",
        "     / /\\ \\      -----------------",
        "    / /__\\ \\     OS: AfterOS x86_64 Web",
        "   / /----\\ \\    Host: Browser Terminal",
        "  /_/      \\_\\   Kernel: JS Unsandboxed v1.0",
        "                 Uptime: Just booted",
        "                 Shell: AfterOS Shell",
        "                 Memory: Optimized"
      ];
      logOutput(art.join('\n'));
    }, 'Display system info');

    
    registerCommand('editor', (args) => {
      const mode = args[0] ? args[0].toLowerCase() : '';
      const targetId = args[1] ? args[1].toLowerCase() : '';

      if (mode === 'js' && targetId) {
        const winId = 'afteros-ide-' + targetId;
        if (document.getElementById(winId)) {
          const existingWin = document.getElementById(winId);
          bringToFront(existingWin);
          logOutput(`Editor window for ID '${targetId}' is already open.`);
          return;
        }

        
        const existingCode = readCode(targetId);
        if (existingCode && existingCode.trim().length > 0) {
          logOutput(`[IDE] Loading saved ID code: '${targetId}'`);
        } else {
          logOutput(`[IDE] Creating new JS code space. Saved ID: '${targetId}'`);
        }

        let win = document.createElement('div');
        win.id = winId;
        win.style.cssText = `position:fixed; left:180px; top:100px; width:680px; height:480px; background:#0c0c0c; border:1px solid #ffd700; box-shadow:0 15px 40px rgba(0,0,0,0.9); display:flex; flex-direction:column; border-radius:8px; overflow:hidden; z-index:${++globalZIndex}; padding:12px; box-sizing:border-box; resize: both;`;

        win.addEventListener('mousedown', () => bringToFront(win));

        let winTitleBar = document.createElement('div');
        winTitleBar.style.cssText = 'height:40px; min-height:40px; max-height:40px; background:#161616; cursor:move; display:flex; align-items:center; justify-content:space-between; padding:0 14px; color:#ffd700; font-size:14px; font-weight:bold; border:1px solid #332f00; border-radius:6px; margin-bottom:10px; flex-shrink:0; box-sizing:border-box;';
        winTitleBar.innerHTML = `<span style="line-height: 40px;">AfterOS IDE - [${targetId}]</span>`;

        let winClose = document.createElement('span');
        winClose.textContent = '✕';
        winClose.style.cssText = 'cursor: pointer; color: #ef4444; font-weight: bold; font-size: 16px;';
        winClose.onclick = (e) => {
          e.stopPropagation();
          win.remove();
        };
        winTitleBar.appendChild(winClose);

        let textArea = document.createElement('textarea');
        textArea.style.cssText = 'flex-grow:1; background:#050505; color:#fef08a; font-family:"Courier New", Courier, monospace; font-size:14px; padding:12px; border:1px solid #222; border-radius:6px; outline:none; resize:none; line-height:1.4; margin-bottom:10px;';
        textArea.value = existingCode;

        let toolBar = document.createElement('div');
        toolBar.style.cssText = 'height:45px; min-height:45px; background:#161616; display:flex; align-items:center; justify-content:space-between; padding:0 14px; border:1px solid #332f00; border-radius:6px; flex-shrink:0; box-sizing:border-box;';

        let infoText = document.createElement('span');
        infoText.textContent = `ID: ${targetId} | Status: Ready`;
        infoText.style.cssText = 'color:#a1a1aa; font-size:11px;';

        let saveRunBtn = document.createElement('button');
        saveRunBtn.textContent = 'Save & Run JS';
        saveRunBtn.style.cssText = 'background:#ffd700; color:#000000; border:none; padding:6px 14px; border-radius:4px; cursor:pointer; font-family:inherit; font-weight:bold; font-size:12px;';
        
        saveRunBtn.onclick = () => {
          const codeToRun = textArea.value;
          writeCode(targetId, codeToRun);
          logOutput(`[IDE] code for ID '${targetId}' has been saved and updated in Scratch storage.`);

          try {
            const result = new Function(codeToRun)();
            if (result !== undefined) {
              logOutput(`=> ${result}`);
            }
          } catch (error) {
            logOutput(`[ERROR] Uncaught ${error.name}: ${error.message}`);
          }
        };

        toolBar.appendChild(infoText);
        toolBar.appendChild(saveRunBtn);
        win.appendChild(winTitleBar);
        win.appendChild(textArea);
        win.appendChild(toolBar);
        document.body.appendChild(win);

        
        let isDrag = false, sX, sY;
        winTitleBar.onmousedown = (e) => {
          bringToFront(win);
          isDrag = true;
          sX = e.clientX - win.offsetLeft;
          sY = e.clientY - win.offsetTop;
        };
        document.addEventListener('mousemove', (e) => {
          if (!isDrag) return;
          win.style.left = (e.clientX - sX) + 'px';
          win.style.top = (e.clientY - sY) + 'px';
        });
        document.addEventListener('mouseup', () => { isDrag = false; });

      } else {
        logOutput('Usage: editor js <id> (Example: editor js main)');
      }
    }, 'Open graphical code editor with custom ID');

    async function processCommand(cmd) {
      const trimmed = cmd.trim();
      if (!trimmed) return;

      const firstSpace = trimmed.search(/\s/);
      const coreCmd = (firstSpace === -1 ? trimmed : trimmed.slice(0, firstSpace)).toLowerCase();

      const command = commands.get(coreCmd);
      if (command) {
        const args = trimmed.split(/\s+/).slice(1);
        try {
          await command.handler(args, { logOutput, registerCommand });
        } catch (err) {
          logOutput(`${coreCmd}: ${err.message}`);
        }
        return;
      }

      try {
        const result = (0, eval)(trimmed);
        if (result !== undefined) {
          logOutput(String(result));
        }
      } catch (error) {
        logOutput(`Uncaught ${error.name}: ${error.message}`);
      }
    }

    input.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        const val = input.value.trim();
        if (val) {
          commandTEXT = val;
          logCommand(val);
          processCommand(val);
        } else {
          logCommand('');
        }
        input.value = '';
        input.style.height = 'auto';
        historyDiv.scrollTop = historyDiv.scrollHeight;
      }
    });

    
    let isDragging = false, startX, startY;
    titleBar.onmousedown = (e) => {
      bringToFront(osContainer);
      isDragging = true;
      startX = e.clientX - osContainer.offsetLeft;
      startY = e.clientY - osContainer.offsetTop;
    };
    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      osContainer.style.left = (e.clientX - startX) + 'px';
      osContainer.style.top = (e.clientY - startY) + 'px';
    });
    document.addEventListener('mouseup', () => { isDragging = false; });

    processCommand('neofetch');
  }

  
  class AfterOSIDEExtension {
    getInfo() {
      return {
        id: 'javascript',
        name: 'javascript v2',
        color1: '#d1ce00',
        color2: '#a9ac00',
        blocks: [
          {
            opcode: 'openTerminal',
            blockType: Scratch.BlockType.COMMAND,
            text: 'open javascript terminal'
          },
          {
            opcode:'closeTerminal',
            blockType: Scratch.BlockType.COMMAND,
            text:'close javascript terminal'
          },
          {
            opcode: 'getCode',
            blockType: Scratch.BlockType.REPORTER,
            text: 'get code from [ID]',
            arguments: {
              ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'main' }
            }
          },
          '---',
          {
            opcode: 'runJSUnsandboxed',
            blockType: Scratch.BlockType.COMMAND,
            text: 'run JS code [ID]',
            arguments: {
              ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'main' }
            }
          },
          {
            opcode:'logterminal',
            blockType: Scratch.BlockType.COMMAND,
            text: 'log terminal [TEXT]',
            arguments:{
              TEXT:{type: Scratch.ArgumentType.STRING, defaultValue:'hello world'}
            }
          },
          {
            opcode:'logcolor',
            blockType: Scratch.BlockType.REPORTER,
            text: 'log [LOG] color [COLOR]',
            arguments:{
              LOG:{type: Scratch.ArgumentType.STRING, defaultValue:'Text'},
              COLOR:{type: Scratch.ArgumentType.COLOR, defaultValue:'#ff0000'}
            }
          },
          {
            opcode:'clearLog',
            blockType: Scratch.BlockType.COMMAND,
            text:'clear log',
          },
          {
            opcode:'command',
            blockType: Scratch.BlockType.REPORTER,
            text:'command',
          }
        ]
      };
    }

    openTerminal() {
      createTerminalWindow();
    }
    closeTerminal(){
      const container = document.getElementById('afteros-os-container');
      if (container) {
        container.remove();
      }
      const ideWindows = document.querySelectorAll("[id^='afteros-ide-']");
      if (ideWindows) {
        ideWindows.forEach(win => win.remove());
      }
    }

    getCode(args) {
      return readCode(args.ID);
    }

    runJSUnsandboxed(args) {
      const targetId = args.ID ? String(args.ID).trim() : 'main';
      const codeToRun = readCode(targetId);

      setTimeout(() => {
        const historyDiv = document.getElementById('history');
        const appendOut = (txt, col = '#e2e8f0') => {
          if (!historyDiv) return;
          const d = document.createElement('div');
          d.style.color = col;
          d.style.whiteSpace = 'pre-wrap';
          d.textContent = txt;
          historyDiv.appendChild(d);
          historyDiv.scrollTop = historyDiv.scrollHeight;
        };

        if (!codeToRun || codeToRun.trim() === '') {
          appendOut(`[ERROR] No code snippet found with the ID. '${targetId}'`, '#ff5f56');
          return;
        }

        appendOut(`[RUN] Excute code from ID: '${targetId}'`, '#ffd700');

        try {
          const origLog = console.log;
          const origErr = console.error;

          console.log = (...msgs) => {
            origLog(...msgs);
            appendOut(msgs.map(m => typeof m === 'object' ? JSON.stringify(m) : m).join(' '), '#e2e8f0');
          };

          console.error = (...errs) => {
            origErr(...errs);
            appendOut('[ERROR] ' + errs.map(e => typeof e === 'object' ? JSON.stringify(e) : e).join(' '), '#ff5f56');
          };

          const res = new Function(codeToRun)();
          if (res !== undefined) {
            appendOut(`=> ${res}`, '#00ff66');
          }

          console.log = origLog;
          console.error = origErr;
        } catch (err) {
          appendOut(`Uncaught ${err.name}: ${err.message}`, '#ff5f56');
        }
      }, 50);
    }

    logterminal(args) {
      const color = pendingLogColor || '#fef08a';
      pendingLogColor = null; // Reset lại sau khi dùng
      logToTerminalGlobal(args.TEXT, color);
    }

    logcolor(args) {
      const text = args.LOG !== undefined ? String(args.LOG) : '';
      pendingLogColor = args.COLOR || '#ff0000';
      return text;
    }
    clearLog(){
      const historyDiv = document.getElementById('history');
      if (historyDiv) {
        historyDiv.innerHTML = '';
      }
    }

    command(){
      return commandTEXT;
    }
  }

  Scratch.extensions.register(new AfterOSIDEExtension());
})(Scratch);