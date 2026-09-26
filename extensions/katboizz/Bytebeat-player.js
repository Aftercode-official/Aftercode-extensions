// Name: Bytebeat player
// ID: advancedAudioWorklet
// Description: Play, edit, and read songs from any Bytebeat composer song
// By: katboizz <https://scratch.mit.edu/users/katboizz/>
// License: MIT

(function(Scratch) {
    'use strict';
    if (!Scratch.extensions.unsandboxed) {
        throw new Error("must be ran unsandboxed");
    }

    const VAR_PREFIX = '__bytebeat_';

    function getStorageVariable(id) {
        const stage = Scratch.vm.runtime.getTargetForStage();
        if (!stage) return null;
        const safeId = String(id || 'song1').trim() || 'song1';
        const varName = VAR_PREFIX + safeId;
        return stage.lookupOrCreateVariable(varName, varName);
    }

    function readPreset(id) {
        const v = getStorageVariable(id);
        if (!v) return null;
        if (typeof v.value !== 'string' || v.value === '') return null;
        try {
            const parsed = JSON.parse(v.value);
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                return {
                    mode: parsed.mode || 'Bytebeat',
                    code: typeof parsed.code === 'string' ? parsed.code : '0'
                };
            }
        } catch (e) {
            // Dữ liệu cũ dạng text thuần -> coi là code Bytebeat
            return { mode: 'Bytebeat', code: String(v.value) };
        }
        return null;
    }

    function writePreset(id, preset) {
        const v = getStorageVariable(id);
        if (!v) return;
        v.value = JSON.stringify({ mode: preset.mode, code: preset.code });
    }

    function deletePreset(id) {
        const stage = Scratch.vm.runtime.getTargetForStage();
        if (!stage) return false;
        const varName = VAR_PREFIX + String(id || '').trim();
        for (const varId in stage.variables) {
            const v = stage.variables[varId];
            if (v && v.name === varName) {
                try {
                    stage.deleteVariable(varId);
                } catch (e) {
                    try { v.value = ''; } catch (e2) { return false; }
                }
                return true;
            }
        }
        return false;
    }

    function listPresetIds() {
        const stage = Scratch.vm.runtime.getTargetForStage();
        if (!stage || !stage.variables) return [];
        const ids = [];
        for (const varId in stage.variables) {
            const v = stage.variables[varId];
            if (v && typeof v.name === 'string' && v.name.startsWith(VAR_PREFIX)) {
                ids.push(v.name.slice(VAR_PREFIX.length));
            }
        }
        return ids.sort();
    }

    /* ------------------------------------------------------------------ */
    /*  AudioWorklet processor code                                        */
    /* ------------------------------------------------------------------ */

    const processorCode = `
    class audioProcessor extends AudioWorkletProcessor {
        constructor(...args) {
            super(...args);
            this.audioSample = 0;
            this.byteSample = 0;
            this.drawMode = 'Points';
            this.errorDisplayed = true;
            this.func = null;
            this.getValues = null;
            this.isFuncbeat = false;
            this.isPlaying = false;
            this.lastByteValue = [null, null];
            this.lastFuncValue = [null, null];
            this.lastTime = -1;
            this.outValue = [0, 0];
            this.playbackSpeed = 1;
            this.sampleRate = 8000;
            this.sampleRatio = 1;
            this.srDivisor = 1;
            this.currentT = 0;
            Object.seal(this);
            audioProcessor.deleteGlobals();
            audioProcessor.freezeGlobals();
            this.port.addEventListener('message', e => this.receiveData(e.data));
            this.port.start();
        }
        static deleteGlobals() {
            for(let i = 0; i < 26; ++i) {
                delete globalThis[String.fromCharCode(65 + i)];
                delete globalThis[String.fromCharCode(97 + i)];
            }
            for(const name in globalThis) {
                if(Object.prototype.hasOwnProperty.call(globalThis, name)) {
                    delete globalThis[name];
                }
            }
        }
        static freezeGlobals() {
            Object.getOwnPropertyNames(globalThis).forEach(name => {
                const prop = globalThis[name];
                const type = typeof prop;
                if((type === 'object' || type === 'function') && name !== 'globalThis') {
                    Object.freeze(prop);
                }
                if(type === 'function' && Object.prototype.hasOwnProperty.call(prop, 'prototype')) {
                    Object.freeze(prop.prototype);
                }
                Object.defineProperty(globalThis, name, { writable: false, configurable: false });
            });
        }
        static getErrorMessage(err, time) {
            const when = time === null ? 'compilation' : 't=' + time;
            if(!(err instanceof Error)) {
                return \`\${ when } thrown: \${ typeof err === 'string' ? err : JSON.stringify(err) }\`;
            }
            const { message, lineNumber, columnNumber } = err;
            return \`\${ when } error: \${ typeof message === 'string' ? message : JSON.stringify(message) }\${
                typeof lineNumber === 'number' && typeof columnNumber === 'number' ?
                    \` (at line \${ lineNumber - 3 }, character \${ +columnNumber })\` : '' }\`;
        }
        process(inputs, outputs) {
            const chData = outputs[0];
            if (!chData || !chData[0]) {
                return true;
            }
            const chDataLen = chData[0].length;
            if(!chDataLen || !this.isPlaying) {
                return true;
            }
            let time = this.sampleRatio * this.audioSample;
            let { byteSample } = this;
            const drawBuffer = [];
            const isDiagram = this.drawMode === 'Combined' || this.drawMode === 'Diagram';
            let currentSample = 0;

            for(let i = 0; i < chDataLen; ++i) {
                time += this.sampleRatio;
                const currentTime = Math.floor(time / this.srDivisor) * this.srDivisor;
                currentSample = Math.floor(byteSample / this.srDivisor) * this.srDivisor;
                this.currentT = currentSample;

                if(this.lastTime !== currentTime) {
                    let funcValue;
                    try {
                        if(this.isFuncbeat) {
                            funcValue = this.func(currentSample / this.sampleRate, this.sampleRate);
                        } else {
                            funcValue = this.func(currentSample);
                        }
                    } catch(err) {
                        this.sendData({
                            error: {
                                message: audioProcessor.getErrorMessage(err, currentSample),
                                isRuntime: true
                            }
                        });
                        funcValue = NaN;
                    }
                    funcValue = Array.isArray(funcValue) ? [funcValue[0], funcValue[1]] : [funcValue, funcValue];
                    let hasValue = false;
                    let ch = 2;
                    while(ch--) {
                        try {
                            funcValue[ch] = +funcValue[ch];
                        } catch(err) {
                            funcValue[ch] = NaN;
                        }
                        if(isDiagram) {
                            if(!isNaN(funcValue[ch])) {
                                this.outValue[ch] = this.getValues(funcValue[ch], ch);
                            } else {
                                this.lastByteValue[ch] = NaN;
                            }
                            hasValue = true;
                            continue;
                        }
                        if(funcValue[ch] === this.lastFuncValue[ch]) {
                            continue;
                        } else if(!isNaN(funcValue[ch])) {
                            this.outValue[ch] = this.getValues(funcValue[ch], ch);
                            hasValue = true;
                        } else if(!isNaN(this.lastFuncValue[ch])) {
                            this.lastByteValue[ch] = NaN;
                            hasValue = true;
                        }
                    }
                    if(hasValue) {
                        drawBuffer.push({ t: currentSample, value: [...this.lastByteValue] });
                    }
                    byteSample += currentTime - this.lastTime;
                    this.lastFuncValue = funcValue;
                    this.lastTime = currentTime;
                }
                if (chData && chData[0]) {
                    chData[0][i] = this.outValue[0];
                    if (chData[1]) {
                        chData[1][i] = this.outValue[1];
                    }
                }
            }
            if(Math.abs(byteSample) > Number.MAX_SAFE_INTEGER) {
                this.resetTime();
                return true;
            }
            this.audioSample += chDataLen;
            
            this.sendData({
                byteSample: byteSample !== this.byteSample ? (this.byteSample = byteSample) : undefined,
                drawBuffer: drawBuffer.length ? drawBuffer : undefined,
                currentT: this.currentT
            });
            return true;
        }
        receiveData(data) {
            if(data.byteSample !== undefined) {
                this.byteSample = +data.byteSample || 0;
                this.resetValues();
            }
            if(data.errorDisplayed === true) {
                this.errorDisplayed = true;
            }
            if(data.isPlaying !== undefined) {
                this.isPlaying = data.isPlaying;
            }
            if(data.srDivisor !== undefined) {
                this.srDivisor = data.srDivisor;
            }
            if(data.playbackSpeed !== undefined) {
                const sampleRatio = this.sampleRatio / this.playbackSpeed;
                this.playbackSpeed = data.playbackSpeed;
                this.setSampleRatio(sampleRatio);
            }
            if(data.mode !== undefined) {
                this.isFuncbeat = data.mode === 'Funcbeat';
                switch(data.mode) {
                case 'Bytebeat':
                    this.getValues = (funcValue, ch) => (this.lastByteValue[ch] = funcValue & 255) / 127.5 - 1;
                    break;
                case 'Signed Bytebeat':
                    this.getValues = (funcValue, ch) =>
                        (this.lastByteValue[ch] = (funcValue + 128) & 255) / 127.5 - 1;
                    break;
                case 'Floatbeat':
                case 'Funcbeat':
                    this.getValues = (funcValue, ch) => {
                        const outValue = Math.max(Math.min(funcValue, 1), -1);
                        this.lastByteValue[ch] = Math.round((outValue + 1) * 127.5);
                        return outValue;
                    };
                    break;
                default: this.getValues = (funcValue, ch) => (this.lastByteValue[ch] = NaN);
                }
            }
            if(data.drawMode !== undefined) {
                this.drawMode = data.drawMode;
            }
            if(data.setFunction !== undefined) {
                this.setFunction(data.setFunction);
            }
            if(data.resetTime === true) {
                this.resetTime();
            }
            if(data.sampleRate !== undefined) {
                this.sampleRate = data.sampleRate;
            }
            if(data.sampleRatio !== undefined) {
                this.setSampleRatio(data.sampleRatio);
            }
        }
        sendData(data) {
            this.port.postMessage(data);
        }
        resetTime() {
            this.byteSample = 0;
            this.currentT = 0;
            this.resetValues();
            this.sendData({ byteSample: 0, currentT: 0 });
        }
        resetValues() {
            this.audioSample = 0;
            this.lastByteValue = this.lastFuncValue = [null, null];
            this.lastTime = -1;
            this.outValue = [0, 0];
        }
        setFunction(codeText) {
            const params = Object.getOwnPropertyNames(Math);
            const values = params.map(k => Math[k]);
            params.push('int', 'window');
            values.push(Math.floor, globalThis);
            audioProcessor.deleteGlobals();
            let isCompiled = false;
            const oldFunc = this.func;
            try {
                if(this.isFuncbeat) {
                    this.func = new Function(...params, codeText).bind(globalThis, ...values);
                } else {
                    codeText = codeText.trim().replace(
                        /^eval\\(unescape\\(escape(?:\`|\\('|\\("|\\(\`)(.*?)(?:\`|'\\)|"\\)|\`\\)).replace\\(\\/u\\(\\.\\.\\)\\/g,["'\`]\\$1%["'\`]\\)\\)\\)\\$/,
                        (match, m1) => unescape(escape(m1).replace(/u(..)/g, '$1%')));
                    this.func = new Function(...params, 't', \`return 0,\n\${ codeText || 0 };\`)
                        .bind(globalThis, ...values);
                }
                isCompiled = true;
                if(this.isFuncbeat) {
                    this.func = this.func();
                    this.func(0, this.sampleRate);
                } else {
                    this.func(0);
                }
            } catch(err) {
                if(!isCompiled) {
                    this.func = oldFunc;
                }
                this.errorDisplayed = false;
                this.sendData({
                    error: { message: audioProcessor.getErrorMessage(err, isCompiled ? 0 : null), isCompiled },
                    updateUrl: isCompiled
                });
                return;
            }
            this.errorDisplayed = false;
            this.sendData({ error: { message: '', isCompiled }, updateUrl: true });
        }
        setSampleRatio(sampleRatio) {
            const timeOffset = Math.floor(this.sampleRatio * this.audioSample) - this.lastTime;
            this.sampleRatio = sampleRatio * this.playbackSpeed;
            this.lastTime = Math.floor(this.sampleRatio * this.audioSample) - timeOffset;
        }
    }
    registerProcessor('audioProcessor', audioProcessor);
    `;

    const DEFAULT_PRESET_ID = 'song1';
    const DEFAULT_PRESET = {
        mode: 'Funcbeat',
        code: 'l=0;rm=0;return t=>{T=t*1.2;s=0;for(i=0;i<5;i++){s+=30**cbrt(sin(t*PI*(1.5**i)*(m=300-((T>>2&3)*50))))*(1-T%1)/200*(i&1?-1:1)}p=t/128*m*(T*2&1?128:64)&1;l+=rm+=(p-l-rm*2)/(170*sin(t)+200);b=(l+p)/10*(1-T%.5*2);k=sin(100*(z=(T+(T&1?-.25:0))%1)**.5)/2*(1-z)**20;h=(random()*(1-(1+T+(T*2&1?.25:-.25))%1)**200)/4;c=(random()*(1-(T+.5)%1)**500+sin(t*PI*5000)*(1-(T+.5)%1)**150)/2;return s+k+h+c+b}'
    };

    class AdvancedAudioWorkletExtension {
        constructor() {
            this.audioCtx = null;
            this.workletNode = null;
            this.isInitialized = false;

            this.currentId = DEFAULT_PRESET_ID;
            this.sampleRateVal = 48000;
            this.latestT = 0;

            this.uiWindow = null;
            this.isEditorOpen = false;
            this.editorCodeArea = null;
            this.errorDisplayEl = null;
            this.waveformCanvas = null;
            this.waveformCtx = null;
            this.waveDataHistory = [];

            
            if (!readPreset(DEFAULT_PRESET_ID)) {
                writePreset(DEFAULT_PRESET_ID, DEFAULT_PRESET);
            }
        }

        async initAudio(sampleRate = 8000) {
            if (!this.audioCtx) {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                this.audioCtx = new AudioContext({ sampleRate: sampleRate });
            }
            if (this.audioCtx.state === 'suspended') {
                await this.audioCtx.resume();
            }

            if (!this.isInitialized) {
                const blob = new Blob([processorCode], { type: 'application/javascript' });
                const blobUrl = URL.createObjectURL(blob);

                try {
                    await this.audioCtx.audioWorklet.addModule(blobUrl);
                    this.workletNode = new AudioWorkletNode(this.audioCtx, 'audioProcessor');

                    this.workletNode.port.onmessage = (e) => {
                        if (e.data.currentT !== undefined) {
                            this.latestT = e.data.currentT;
                        }
                        if (e.data.drawBuffer) {
                            for (const item of e.data.drawBuffer) {
                                if (item.value && item.value[0] !== null) {
                                    this.waveDataHistory.push(item.value[0]);
                                    if (this.waveDataHistory.length > 200) {
                                        this.waveDataHistory.shift();
                                    }
                                }
                            }
                            this.drawWaveform();
                        }
                        if (e.data.error && e.data.error.message) {
                            if (this.errorDisplayEl) {
                                this.errorDisplayEl.innerText = e.data.error.message;
                                this.errorDisplayEl.style.color = '#ef4444';
                            }
                        } else if (e.data.error && e.data.error.message === '') {
                            if (this.errorDisplayEl) {
                                this.errorDisplayEl.innerText = "Trạng thái: Biên dịch thành công!";
                                this.errorDisplayEl.style.color = '#22c55e';
                            }
                        }
                    };

                    this.workletNode.connect(this.audioCtx.destination);
                    this.isInitialized = true;
                } catch (err) {
                    console.error("Lỗi khởi tạo AudioWorklet:", err);
                }
            }
        }

        drawWaveform() {
            if (!this.waveformCanvas || !this.waveformCtx) return;
            const canvas = this.waveformCanvas;
            const ctx = this.waveformCtx;
            const width = canvas.width;
            const height = canvas.height;

            ctx.fillStyle = '#020617';
            ctx.fillRect(0, 0, width, height);

            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, height / 2);
            ctx.lineTo(width, height / 2);
            ctx.stroke();

            if (this.waveDataHistory.length < 2) return;

            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 2;
            ctx.beginPath();

            const sliceWidth = width / this.waveDataHistory.length;
            let x = 0;

            for (let i = 0; i < this.waveDataHistory.length; i++) {
                const val = this.waveDataHistory[i];
                const normalized = val > 1 ? (val / 255) : (val + 1) / 2;
                const y = height - (normalized * height);

                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
                x += sliceWidth;
            }
            ctx.stroke();
        }

        getInfo() {
            return {
                id: 'advancedAudioWorklet',
                name: 'Bytebeat player',
                color1: '#7c3aed',
                color2: '#6d28d9',
                color3: '#5b21b6',
                blocks: [
                    {
                        opcode: 'openEditor',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'Open Bytebeat editor'
                    },
                    {
                        opcode: 'closeEditor',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'Close Bytebeat editor'
                    },
                    {
                        opcode: 'playCodeById',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'Play ID code [ID]',
                        arguments: {
                            ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'song1' }
                        }
                    },
                    {
                        opcode: 'playInlineCode',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'Play code [CODE] mode [MODE]',
                        arguments: {
                            CODE: { type: Scratch.ArgumentType.STRING, defaultValue: 't*(t>>8|t>>13)&128' },
                            MODE: {
                                type: Scratch.ArgumentType.STRING,
                                menu: 'modeMenu',
                                defaultValue: 'Bytebeat'
                            }
                        }
                    },
                    {
                        opcode: 'savePreset',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'Save preset ID [ID] mode [MODE] code [CODE]',
                        arguments: {
                            ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'song1' },
                            MODE: {
                                type: Scratch.ArgumentType.STRING,
                                menu: 'modeMenu',
                                defaultValue: 'Bytebeat'
                            },
                            CODE: { type: Scratch.ArgumentType.STRING, defaultValue: 't*(t>>8|t>>13)&128' }
                        }
                    },
                    {
                        opcode: 'deletePresetBlock',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'Delete preset ID [ID]',
                        arguments: {
                            ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'song1' }
                        }
                    },
                    {
                        opcode: 'listPresetsBlock',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'All preset ID'
                    },
                    {
                        opcode: 'stopAudio',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'Stop all sound ID'
                    },
                    {
                        opcode: 'setSampleRate',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'Set sample rate to [RATE]',
                        arguments: {
                            RATE: { type: Scratch.ArgumentType.NUMBER, defaultValue: 48000 }
                        }
                    },
                    {
                        opcode: 'getCurrentT',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'Get value variable T'
                    },
                    {
                        opcode: 'hasPreset',
                        blockType: Scratch.BlockType.BOOLEAN,
                        text: 'Has preset ID? [ID]',
                        arguments: {
                            ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'song1' }
                        }
                    }
                ],
                menus: {
                    modeMenu: {
                        acceptReporters: true,
                        items: ['Bytebeat', 'Signed Bytebeat', 'Floatbeat', 'Funcbeat']
                    }
                }
            };
        }

        getCurrentT() {
            return this.latestT;
        }

        hasPreset(args) {
            const id = (args.ID || '').trim();
            return !!readPreset(id);
        }

        savePreset(args) {
            const id = (args.ID || 'song1').trim() || 'song1';
            const mode = args.MODE || 'Bytebeat';
            const code = args.CODE || '0';
            writePreset(id, { mode, code });
            this.updatePresetDropdownUI();
        }

        deletePresetBlock(args) {
            const id = (args.ID || '').trim();
            if (!id) return;
            deletePreset(id);
            this.updatePresetDropdownUI();
        }

        listPresetsBlock() {
            return listPresetIds().join(', ');
        }

        async playInlineCode(args) {
            const mode = args.MODE || 'Bytebeat';
            const code = String(args.CODE || '0');
            await this.initAudio(this.sampleRateVal);
            if (this.workletNode) {
                this.workletNode.port.postMessage({ mode });
                this.workletNode.port.postMessage({ sampleRate: this.sampleRateVal });
                this.workletNode.port.postMessage({ setFunction: code });
                this.workletNode.port.postMessage({ isPlaying: true });
                this.workletNode.port.postMessage({ resetTime: true });
            }
        }

        saveCodeWithId(id, mode, code) {
            writePreset(id, { mode, code });
            this.updatePresetDropdownUI();
        }

        async playCodeById(args) {
            const id = (args.ID || 'song1').trim();
            const preset = readPreset(id);

            if (!preset) {
                console.warn(`Cant find ID code: "${id}"`);
                if (this.errorDisplayEl) {
                    this.errorDisplayEl.innerText = `Lỗi: Không tìm thấy ID "${id}"!`;
                    this.errorDisplayEl.style.color = '#ef4444';
                }
                return;
            }

            this.currentId = id;
            this.waveDataHistory = [];

            await this.initAudio(this.sampleRateVal);

            if (this.workletNode) {
                this.workletNode.port.postMessage({ mode: preset.mode });
                this.workletNode.port.postMessage({ sampleRate: this.sampleRateVal });
                this.workletNode.port.postMessage({ setFunction: preset.code });
                this.workletNode.port.postMessage({ isPlaying: true });
                this.workletNode.port.postMessage({ resetTime: true });
            }

            if (this.isEditorOpen && this.uiWindow) {
                const idInput = this.uiWindow.querySelector('#aw-id-input');
                const modeSelect = this.uiWindow.querySelector('#aw-mode-select');
                const dropdown = this.uiWindow.querySelector('#aw-preset-dropdown');

                if (idInput) idInput.value = id;
                if (modeSelect) modeSelect.value = preset.mode;
                if (dropdown) dropdown.value = id;
                if (this.editorCodeArea) this.editorCodeArea.value = preset.code;
            }
        }

        async stopAudio() {
            if (this.workletNode) {
                this.workletNode.port.postMessage({ isPlaying: false });
            }
        }

        async setSampleRate(args) {
            this.sampleRateVal = Math.max(1000, Number(args.RATE) || 8000);
            if (this.audioCtx) {
                await this.audioCtx.close();
                this.audioCtx = null;
                this.isInitialized = false;
                await this.initAudio(this.sampleRateVal);
            }
        }

        updatePresetDropdownUI() {
            if (!this.uiWindow) return;
            const dropdown = this.uiWindow.querySelector('#aw-preset-dropdown');
            if (!dropdown) return;

            const ids = listPresetIds();
            dropdown.innerHTML = '';
            for (const id of ids) {
                const opt = document.createElement('option');
                opt.value = id;
                opt.innerText = id;
                if (id === this.currentId) opt.selected = true;
                dropdown.appendChild(opt);
            }
        }

        openEditor() {
            if (this.isEditorOpen && this.uiWindow) return;

            this.isEditorOpen = true;
            this.uiWindow = document.createElement('div');
            this.uiWindow.style.cssText = `
                position: fixed;
                top: 50px;
                right: 20px;
                width: 540px;
                height: 520px;
                background: #0f172a;
                color: #f8fafc;
                border: 2px solid #7c3aed;
                border-radius: 10px;
                box-shadow: 0 15px 35px rgba(0,0,0,0.6);
                z-index: 492;
                font-family: monospace;
                padding: 12px;
                display: flex;
                flex-direction: column;
                resize: both;
                overflow: hidden;
            `;

            const currentPreset = readPreset(this.currentId) || { mode: 'Bytebeat', code: 't * (t >> 8 | t >> 13) & 128' };

            this.uiWindow.innerHTML = `
                <div id="aw-header" style="display: flex; justify-content: space-between; align-items: center; cursor: move; margin-bottom: 12px; border-bottom: 1px solid #1e293b; padding-bottom: 8px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="width: 10px; height: 10px; background: #8b5cf6; border-radius: 50%; display: inline-block;"></span>
                        <span style="font-weight: 600; color: #f1f5f9; font-size: 13px; letter-spacing: 0.5px;">BYTEBEAT editor</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span id="aw-t-display" style="font-size: 11px; color: #64748b; background: #111827; padding: 2px 6px; border-radius: 4px; border: 1px solid #1f2937;">t = 0</span>
                        <button id="aw-close" style="background: transparent; border: none; color: #94a3b8; cursor: pointer; font-weight: bold; font-size: 14px; padding: 0 4px;">✕</button>
                    </div>
                </div>
                
                <div style="margin-bottom: 10px; background: #111827; padding: 8px; border-radius: 6px; display: flex; gap: 8px; align-items: center; border: 1px solid #1f2937; flex-wrap: wrap;">
                    <div style="display: flex; align-items: center; gap: 4px;">
                        <label style="font-size: 10px; color: #94a3b8; text-transform: uppercase;">Preset:</label>
                        <select id="aw-preset-dropdown" style="background: #030712; color: #38bdf8; border: 1px solid #374151; padding: 4px 6px; border-radius: 4px; font-family: inherit; font-size: 11px;"></select>
                    </div>
                    
                    <div style="display: flex; align-items: center; gap: 4px;">
                        <label style="font-size: 10px; color: #94a3b8; text-transform: uppercase;">ID:</label>
                        <input id="aw-id-input" type="text" value="${this.currentId}" style="width: 75px; background: #030712; color: #f8fafc; border: 1px solid #374151; padding: 3px 6px; border-radius: 4px; font-family: inherit; font-size: 11px;" />
                    </div>

                    <div style="display: flex; align-items: center; gap: 4px;">
                        <label style="font-size: 10px; color: #94a3b8; text-transform: uppercase;">Mode:</label>
                        <select id="aw-mode-select" style="background: #030712; color: #38bdf8; border: 1px solid #374151; padding: 4px 6px; border-radius: 4px; font-family: inherit; font-size: 11px;">
                            <option value="Bytebeat" ${currentPreset.mode==='Bytebeat'?'selected':''}>Bytebeat</option>
                            <option value="Signed Bytebeat" ${currentPreset.mode==='Signed Bytebeat'?'selected':''}>Signed Bytebeat</option>
                            <option value="Floatbeat" ${currentPreset.mode==='Floatbeat'?'selected':''}>Floatbeat</option>
                            <option value="Funcbeat" ${currentPreset.mode==='Funcbeat'?'selected':''}>Funcbeat</option>
                        </select>
                    </div>
                </div>

                <div style="margin-bottom: 10px; flex: 1; display: flex; flex-direction: column;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                        <label style="font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Expression / Function Code</label>
                    </div>
                    <textarea id="aw-code" spellcheck="false" style="flex: 1; width: 100%; background: #030712; color: #a5b4fc; border: 1px solid #1f2937; font-family: inherit; font-size: 12px; line-height: 1.5; padding: 10px; box-sizing: border-box; resize: none; border-radius: 6px; outline: none; tab-size: 4;">${currentPreset.code}</textarea>
                </div>

                <div style="margin-bottom: 10px; height: 75px; display: flex; flex-direction: column;">
                    <canvas id="aw-waveform" width="590" height="75" style="width: 100%; height: 75px; background: #030712; border: 1px solid #1f2937; border-radius: 6px; box-sizing: border-box;"></canvas>
                </div>

                <div id="aw-error" style="font-size: 11px; color: #4ade80; margin-bottom: 10px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; background: #030712; padding: 6px 10px; border-radius: 4px; border: 1px solid #1f2937;">status: ready</div>

                <div style="display: flex; gap: 8px;">
                    <button id="aw-btn-play" style="flex: 2; background: #7c3aed; color: white; border: none; padding: 8px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 11px; letter-spacing: 0.5px; transition: background 0.2s;">COMPILE & PLAY</button>
                    <button id="aw-btn-save" style="flex: 1; background: #1f2937; color: #f8fafc; border: 1px solid #374151; padding: 8px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 11px;">Save code</button>
                    <button id="aw-btn-stop" style="flex: 1; background: #dc2626; color: white; border: none; padding: 8px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 11px;">Stop</button>
                    <button id="aw-btn-delete" style="background: #111827; color: #ef4444; border: 1px solid #374151; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 11px;" title="Delete current ID">Delete</button>
                </div>
            `;

            document.body.appendChild(this.uiWindow);
            this.editorCodeArea = this.uiWindow.querySelector('#aw-code');
            this.errorDisplayEl = this.uiWindow.querySelector('#aw-error');
            this.waveformCanvas = this.uiWindow.querySelector('#aw-waveform');
            this.waveformCtx = this.waveformCanvas.getContext('2d');

            this.updatePresetDropdownUI();

            this.uiWindow.querySelector('#aw-close').onclick = () => this.closeEditor();

            this.uiWindow.querySelector('#aw-preset-dropdown').onchange = (e) => {
                const selectedId = e.target.value;
                const p = readPreset(selectedId);
                if (p) {
                    this.currentId = selectedId;
                    this.uiWindow.querySelector('#aw-id-input').value = selectedId;
                    this.uiWindow.querySelector('#aw-mode-select').value = p.mode;
                    this.editorCodeArea.value = p.code;
                }
            };

            this.uiWindow.querySelector('#aw-btn-save').onclick = () => {
                const id = this.uiWindow.querySelector('#aw-id-input').value.trim() || 'song1';
                const mode = this.uiWindow.querySelector('#aw-mode-select').value;
                const code = this.editorCodeArea.value;

                this.saveCodeWithId(id, mode, code);
                this.currentId = id;
                if (this.errorDisplayEl) {
                    this.errorDisplayEl.innerText = `Đã lưu preset "${id}" vào biến ${VAR_PREFIX}${id}`;
                    this.errorDisplayEl.style.color = '#38bdf8';
                }
            };

            this.uiWindow.querySelector('#aw-btn-play').onclick = async () => {
                const id = this.uiWindow.querySelector('#aw-id-input').value.trim() || 'song1';
                const mode = this.uiWindow.querySelector('#aw-mode-select').value;
                const code = this.editorCodeArea.value;

                this.saveCodeWithId(id, mode, code);
                await this.playCodeById({ ID: id });
            };

            this.uiWindow.querySelector('#aw-btn-delete').onclick = () => {
                const id = this.uiWindow.querySelector('#aw-id-input').value.trim();
                if (id && readPreset(id)) {
                    deletePreset(id);
                    const remainingIds = listPresetIds();
                    if (remainingIds.length > 0) {
                        this.currentId = remainingIds[0];
                        const p = readPreset(this.currentId);
                        this.uiWindow.querySelector('#aw-id-input').value = this.currentId;
                        if (p) {
                            this.uiWindow.querySelector('#aw-mode-select').value = p.mode;
                            this.editorCodeArea.value = p.code;
                        }
                    } else {
                        writePreset('song1', { mode: 'Bytebeat', code: '0' });
                        this.currentId = 'song1';
                        this.uiWindow.querySelector('#aw-id-input').value = 'song1';
                        this.uiWindow.querySelector('#aw-mode-select').value = 'Bytebeat';
                        this.editorCodeArea.value = '0';
                    }
                    this.updatePresetDropdownUI();
                    if (this.errorDisplayEl) {
                        this.errorDisplayEl.innerText = `Đã xóa preset "${id}"!`;
                        this.errorDisplayEl.style.color = '#f59e0b';
                    }
                }
            };

            this.uiWindow.querySelector('#aw-btn-stop').onclick = () => {
                this.stopAudio();
            };

            const header = this.uiWindow.querySelector('#aw-header');
            let isDragging = false;
            let startX, startY, initialLeft, initialTop;

            header.onmousedown = (e) => {
                isDragging = true;
                startX = e.clientX;
                startY = e.clientY;
                const rect = this.uiWindow.getBoundingClientRect();
                initialLeft = rect.left;
                initialTop = rect.top;
                document.onmousemove = (em) => {
                    if (!isDragging) return;
                    this.uiWindow.style.left = (initialLeft + (em.clientX - startX)) + 'px';
                    this.uiWindow.style.top = (initialTop + (em.clientY - startY)) + 'px';
                    this.uiWindow.style.position = 'fixed';
                };
                document.onmouseup = () => {
                    isDragging = false;
                    document.onmousemove = null;
                    document.onmouseup = null;
                };
            };
        }

        closeEditor() {
            if (this.uiWindow) {
                this.uiWindow.remove();
                this.uiWindow = null;
            }
            this.isEditorOpen = false;
            this.editorCodeArea = null;
            this.errorDisplayEl = null;
            this.waveformCanvas = null;
            this.waveformCtx = null;
        }
    }

    Scratch.extensions.register(new AdvancedAudioWorkletExtension());
})(Scratch);