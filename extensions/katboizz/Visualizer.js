// Name: Visualizer Pro
// ID: Visualizer
// Description: A real, optimized audio visualizer showing on your project.
// By: katboizz <https://scratch.mit.edu/users/katboizz/>
// By: DANV
// License: MIT
(function (Scratch) {
    'use strict';

    if (!Scratch.extensions.unsandboxed) {
        throw new Error('Unsandboxed required');
    }

    let analyser = null;
    let audioReady = false;

    let offscreenCanvas = null;
    let ctx = null;

    let running = false;
    let mode = 'both';

    let waveColor = '#00ffcc';
    let spectrumColor = 'FL_GRADIENT'; 

    let peaks = [];
    let peakDropCounters = [];
    let showPeaks = true; // New feature

    let particles = [];
    const maxParticles = 30; 

    let pulseIntensity = 3;      
    let isMirror = false;        
    let barStyle = 'solid';      

    let spectrumShape = 'linear'; 
    let waveStyle = 'line';       
    let spectrumAnchor = 'bottom'; 

    let circleBarMode = 'outer';   
    let sensitivity = 1.0;         
    let imgRotation = 0;           

    let motionTrail = false;       
    let particleStyle = 'white';   
    let bassDropEffect = false;    
    
    let visualizerSize = 100;
    let barcount = 52;
    
    // Dynamic size variables
    let stageW = 480;
    let stageH = 360;
    let posX = 0; // New feature
    let posY = 0; // New feature

    let currentBass = 0; let currentMid = 0; let currentTreble = 0;
    let shakeX = 0; let shakeY = 0;

    // Optimized memory buffers
    let freqData = null;
    let timeData = null;

    let renderer = null;
    let drawableId = null;
    let skinId = null;

    class WebGLAudioVisualizer {
        getInfo() {
            return {
                id: 'Visualizer',
                name: 'Visualizer Pro',
                color1: '#007694',
                color2: '#00657e',
                color3: '#005e75',
                blocks: [
                    // --- Core Controls ---
                    { opcode: 'startWaveform', blockType: Scratch.BlockType.COMMAND, text: 'start waveform' },
                    { opcode: 'startSpectrum', blockType: Scratch.BlockType.COMMAND, text: 'start spectrum' },
                    { opcode: 'startBoth', blockType: Scratch.BlockType.COMMAND, text: 'start both visualizers' },
                    { opcode: 'stop', blockType: Scratch.BlockType.COMMAND, text: 'stop visualizer' },
                    
                    '---',
                    // --- Display Settings ---
                    {
                        opcode: 'setSize', blockType: Scratch.BlockType.COMMAND, text: 'set visualizer size [NUM] %',
                        arguments: { NUM: { type: Scratch.ArgumentType.NUMBER, defaultValue: 100 } }
                    },
                    {
                        opcode: 'setPosition', blockType: Scratch.BlockType.COMMAND, text: 'go to x: [X] y: [Y]',
                        arguments: { 
                            X: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 },
                            Y: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 }
                        }
                    },
                    {
                        opcode: 'setLayer', blockType: Scratch.BlockType.COMMAND, text: 'go to [LAYER] layer',
                        arguments: { LAYER: { type: Scratch.ArgumentType.STRING, menu: 'menuLayer', defaultValue: 'front' } }
                    },

                    '---',
                    // --- Spectrum & Wave Config ---
                    {
                        opcode: 'barcount', blockType: Scratch.BlockType.COMMAND, text: 'set number of bars [AMOUNT]',
                        arguments: { AMOUNT: { type: Scratch.ArgumentType.NUMBER, defaultValue: 52 } }
                    },
                    {
                        opcode: 'setSmoothing', blockType: Scratch.BlockType.COMMAND, text: 'set audio smoothing to [NUM]',
                        arguments: { NUM: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0.8 } }
                    },
                    {
                        opcode: 'setSpectrumShape', blockType: Scratch.BlockType.COMMAND, text: 'change spectrum shape to [SHAPE]',
                        arguments: { SHAPE: { type: Scratch.ArgumentType.STRING, menu: 'menuShape', defaultValue: 'linear' } }
                    },
                    {
                        opcode: 'setWaveStyle', blockType: Scratch.BlockType.COMMAND, text: 'change waveform style to [WSTYLE]',
                        arguments: { WSTYLE: { type: Scratch.ArgumentType.STRING, menu: 'menuWaveStyle', defaultValue: 'line' } }
                    },
                    {
                        opcode: 'setSpectrumAnchor', blockType: Scratch.BlockType.COMMAND, text: 'set spectrum anchor to [ANCHOR]',
                        arguments: { ANCHOR: { type: Scratch.ArgumentType.STRING, menu: 'menuAnchor', defaultValue: 'bottom' } }
                    },
                    {
                        opcode: 'setBarStyle', blockType: Scratch.BlockType.COMMAND, text: 'change bar style to [STYLE]',
                        arguments: { STYLE: { type: Scratch.ArgumentType.STRING, menu: 'menuStyle', defaultValue: 'solid' } }
                    },
                    {
                        opcode: 'setCircleBarMode', blockType: Scratch.BlockType.COMMAND, text: 'set circle bars [CMODE]',
                        arguments: { CMODE: { type: Scratch.ArgumentType.STRING, menu: 'menuCircleMode', defaultValue: 'outer' } }
                    },
                    {
                        opcode: 'setMirror', blockType: Scratch.BlockType.COMMAND, text: 'set mirror style [STATE]',
                        arguments: { STATE: { type: Scratch.ArgumentType.STRING, menu: 'menuToggle', defaultValue: 'false' } }
                    },
                    {
                        opcode: 'setPeaks', blockType: Scratch.BlockType.COMMAND, text: 'show bar peaks [STATE]',
                        arguments: { STATE: { type: Scratch.ArgumentType.STRING, menu: 'menuToggle', defaultValue: 'true' } }
                    },

                    '---',
                    // --- Colors & Effects ---
                    {
                        opcode: 'setWaveColor', blockType: Scratch.BlockType.COMMAND, text: 'set waveform color [COLOR]',
                        arguments: { COLOR: { type: Scratch.ArgumentType.COLOR, defaultValue: '#00ffcc' } }
                    },
                    {
                        opcode: 'setSpectrumColor', blockType: Scratch.BlockType.COMMAND, text: 'set spectrum color [COLOR]',
                        arguments: { COLOR: { type: Scratch.ArgumentType.STRING, defaultValue: 'FL_GRADIENT' } }
                    },
                    {
                        opcode: 'setMotionTrail', blockType: Scratch.BlockType.COMMAND, text: 'set motion trail [STATE]',
                        arguments: { STATE: { type: Scratch.ArgumentType.STRING, menu: 'menuToggle', defaultValue: 'false' } }
                    },
                    {
                        opcode: 'setBassDrop', blockType: Scratch.BlockType.COMMAND, text: 'set bass drop effect [STATE]',
                        arguments: { STATE: { type: Scratch.ArgumentType.STRING, menu: 'menuToggle', defaultValue: 'false' } }
                    },
                    {
                        opcode: 'setPulse', blockType: Scratch.BlockType.COMMAND, text: 'set bass pulse intensity [NUM]',
                        arguments: { NUM: { type: Scratch.ArgumentType.NUMBER, defaultValue: 3 } }
                    },
                    {
                        opcode: 'setParticleStyle', blockType: Scratch.BlockType.COMMAND, text: 'set particle style [PSTYLE]',
                        arguments: { PSTYLE: { type: Scratch.ArgumentType.STRING, menu: 'menuPStyle', defaultValue: 'none' } }
                    },
                    
                    '---',
                    // --- Reporters ---
                    {
                        opcode: 'setSensitivity', blockType: Scratch.BlockType.COMMAND, text: 'set visualizer sensitivity [NUM]',
                        arguments: { NUM: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1.0 } }
                    },
                    {
                        opcode: 'getAudioValue', blockType: Scratch.BlockType.REPORTER, text: 'get [TYPE] value',
                        arguments: { TYPE: { type: Scratch.ArgumentType.STRING, menu: 'menuAudioType', defaultValue: 'bass' } }
                    },
                    {
                        opcode: 'isBeatDetected', blockType: Scratch.BlockType.BOOLEAN, text: 'is beat detected?'
                    }
                ],
                menus: {
                    menuToggle: { acceptReporters: true, items: [{ text: 'On', value: 'true' }, { text: 'Off', value: 'false' }] },
                    menuStyle: { acceptReporters: true, items: [{ text: 'Solid bar', value: 'solid' }, { text: 'LED style', value: 'led' }, { text: 'Dots', value: 'dots' }] },
                    menuShape: { acceptReporters: true, items: [{ text: 'Linear', value: 'linear' }, { text: 'Circle', value: 'circle' }, { text: 'Spiral', value: 'spiral' }] },
                    menuWaveStyle: { acceptReporters: true, items: [{ text: 'Line', value: 'line' }, { text: 'Bars', value: 'bars' }] },
                    menuAnchor: { acceptReporters: true, items: [{ text: 'Bottom', value: 'bottom' }, { text: 'Top', value: 'top' }, { text: 'Center', value: 'center' }] },
                    menuCircleMode: { acceptReporters: true, items: [{ text: 'Outer', value: 'outer' }, { text: 'Inner', value: 'inner' }, { text: 'Double', value: 'double' }] },
                    menuPStyle: { acceptReporters: true, items: [{ text: 'None', value: 'none' }, { text: 'White', value: 'white' }, { text: 'Rainbow', value: 'rainbow' }] },
                    menuAudioType: { acceptReporters: true, items: [{ text: 'Bass', value: 'bass' }, { text: 'Mid', value: 'mid' }, { text: 'Treble', value: 'treble' }] },
                    menuLayer: { acceptReporters: false, items: [{ text: 'front', value: 'front' }, { text: 'back', value: 'back' }] }
                }
            };
        }

        hookAudio() {
            try {
                const engine = Scratch.vm.runtime.audioEngine;
                if (!engine) return false;
                
                const audioCtx = engine.audioContext;
                analyser = audioCtx.createAnalyser();
                analyser.fftSize = 1024;
                analyser.smoothingTimeConstant = 0.8; // Default smoothing
                engine.inputNode.connect(analyser);

                const bufferLength = analyser.frequencyBinCount;
                
                // Pre-allocate arrays for performance
                freqData = new Uint8Array(bufferLength);
                timeData = new Uint8Array(analyser.fftSize);
                
                peaks = new Array(bufferLength).fill(0);
                peakDropCounters = new Array(bufferLength).fill(0);

                this.updateStageSize();
                this.initParticles();
                audioReady = true;
                return true;
            } catch (e) { console.error("Audio hook failed:", e); return false; }
        }

        updateStageSize() {
            stageW = Scratch.vm.runtime.stageWidth;
            stageH = Scratch.vm.runtime.stageHeight;
            if (offscreenCanvas) {
                offscreenCanvas.width = stageW;
                offscreenCanvas.height = stageH;
            }
        }

        initParticles() {
            particles = [];
            for (let i = 0; i < maxParticles; i++) {
                particles.push({
                    x: Math.random() * stageW,
                    y: Math.random() * stageH,
                    size: Math.random() * 1.5 + 0.8,
                    speedY: Math.random() * 0.4 + 0.2,
                    alpha: Math.random() * 0.4 + 0.1,
                    hue: Math.random() * 360 
                });
            }
        }

        setupWebGLRenderer() {
            if (skinId !== null) return;

            renderer = Scratch.vm.runtime.renderer;
            this.updateStageSize();
            
            offscreenCanvas = document.createElement('canvas');
            offscreenCanvas.width = stageW;
            offscreenCanvas.height = stageH;
            ctx = offscreenCanvas.getContext('2d');
            
            skinId = renderer.createBitmapSkin(offscreenCanvas, 1);
            drawableId = renderer.createDrawable('background');
            this.updateDrawable();
        }

        updateDrawable() {
            if (renderer && drawableId !== null) {
                renderer.updateDrawableProperties(drawableId, {
                    skinId: skinId,
                    position: [posX, posY],
                    scale: [visualizerSize, visualizerSize],
                    direction: 90
                });
            }
        }

        startWaveform() { mode = 'waveform'; this.start(); }
        startSpectrum() { mode = 'spectrum'; this.start(); }
        startBoth() { mode = 'both'; this.start(); }
        
        start() {
            if (running) return;
            if (!analyser) { if (!this.hookAudio()) return; }
            this.setupWebGLRenderer();
            running = true;
            this.loop();
        }

        stop() {
            running = false;
            if (ctx && offscreenCanvas) {
                ctx.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
                renderer.updateBitmapSkin(skinId, offscreenCanvas, 1);
            }
        }

        setSmoothing(args) { if(analyser) analyser.smoothingTimeConstant = Math.max(0, Math.min(0.99, Number(args.NUM))); }
        setPulse(args) { pulseIntensity = Number(args.NUM); }
        setMirror(args) { isMirror = args.STATE === 'true'; }
        setPeaks(args) { showPeaks = args.STATE === 'true'; }
        setBarStyle(args) { barStyle = args.STYLE; }
        setSpectrumShape(args) { spectrumShape = args.SHAPE; }
        setWaveStyle(args) { waveStyle = args.WSTYLE; }
        setSpectrumAnchor(args) { spectrumAnchor = args.ANCHOR; }
        setWaveColor(args) { waveColor = args.COLOR; }
        setSpectrumColor(args) { spectrumColor = args.COLOR; }
        setCircleBarMode(args) { circleBarMode = args.CMODE; }
        setSensitivity(args) { sensitivity = Number(args.NUM); }
        setMotionTrail(args) { motionTrail = args.STATE === 'true'; }
        setParticleStyle(args) { particleStyle = args.PSTYLE; }
        setBassDrop(args) { bassDropEffect = args.STATE === 'true'; }
        
        setSize(args) {
            visualizerSize = Number(args.NUM);
            this.updateDrawable();
        }

        setPosition(args) {
            posX = Number(args.X);
            posY = Number(args.Y);
            this.updateDrawable();
        }

        setLayer(args) {
            if (renderer && drawableId !== null) {
                if (args.LAYER === 'front') {
                    // Pull to front by placing it at the very top of the stack
                    renderer.setDrawableOrder(drawableId, Infinity);
                } else {
                    // Push to back (just above standard background)
                    renderer.setDrawableOrder(drawableId, -Infinity);
                }
            }
        }

        barcount(args) { barcount = Math.max(1, Math.min(256, Number(args.AMOUNT))); }
        
        getAudioValue(args) {
            if (args.TYPE === 'bass') return Math.round(currentBass * 100);
            if (args.TYPE === 'mid') return Math.round(currentMid * 100);
            if (args.TYPE === 'treble') return Math.round(currentTreble * 100);
            return 0;
        }

        isBeatDetected() { return currentBass > 0.85; }

        loop() { 
            if (!running) return; 
            requestAnimationFrame(() => this.loop()); 
            this.draw(); 
        }

        draw() {
            if (!analyser || !ctx || !offscreenCanvas || !renderer) return;
            
            // Check if stage size changed
            if (stageW !== Scratch.vm.runtime.stageWidth || stageH !== Scratch.vm.runtime.stageHeight) {
                this.updateStageSize();
            }
            
            analyser.getByteFrequencyData(freqData);

            let bSum = 0, mSum = 0, tSum = 0;
            for (let i = 0; i < 8; i++) bSum += freqData[i];
            for (let i = 8; i < 32; i++) mSum += freqData[i];
            for (let i = 32; i < 96; i++) tSum += freqData[i];

            currentBass = bSum / 8 / 255;
            currentMid = mSum / 24 / 255;
            currentTreble = tSum / 64 / 255;

            shakeX = 0; shakeY = 0;
            if (bassDropEffect && this.isBeatDetected()) {
                shakeX = (Math.random() - 0.5) * 8;
                shakeY = (Math.random() - 0.5) * 8;
            }

            ctx.save();
            ctx.translate(shakeX, shakeY); 

            if (motionTrail) {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.25)'; 
                ctx.fillRect(0, 0, stageW, stageH);
            } else {
                ctx.clearRect(0, 0, stageW, stageH);
            }

            if (pulseIntensity > 0 && currentBass > 0.35) {
                ctx.save();
                const alphaPulse = (currentBass * 0.12) * (pulseIntensity / 5);
                ctx.fillStyle = spectrumColor === 'FL_GRADIENT' ? 'rgba(0, 255, 204,' + alphaPulse + ')' : waveColor;
                ctx.globalAlpha = alphaPulse;
                ctx.fillRect(0, 0, stageW, stageH);
                ctx.restore();
            }

            if(particleStyle !== 'none') {
                this.drawParticles(currentTreble); 
            }

            if (bassDropEffect && currentBass > 0.88) {
                ctx.save();
                ctx.globalCompositeOperation = 'screen';
                ctx.translate(3, 1);
                if (mode === 'waveform' || mode === 'both') this.drawWaveTop();
                if (mode === 'spectrum' || mode === 'both') this.drawSpectrumBottom(freqData, currentBass);
                ctx.restore();
            }

            if (mode === 'waveform' || mode === 'both') this.drawWaveTop();
            if (mode === 'spectrum' || mode === 'both') this.drawSpectrumBottom(freqData, currentBass);
            ctx.restore();

            renderer.updateBitmapSkin(skinId, offscreenCanvas, 1);
        }

        drawParticles(trebleIntensity) {
            ctx.save();
            for (let i = 0; i < particles.length; i++) {
                let p = particles[i];
                p.y -= (p.speedY + (trebleIntensity * 4.0));
                if (p.y < 0) { p.y = stageH; p.x = Math.random() * stageW; }
                ctx.beginPath(); 
                if (particleStyle === 'white') {
                    ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(0.7, p.alpha + (trebleIntensity * 0.3))})`;
                } else if (particleStyle === 'rainbow') {
                    p.hue = (p.hue + 1) % 360; 
                    ctx.fillStyle = `hsla(${p.hue}, 90%, 65%, ${Math.min(0.7, p.alpha + (trebleIntensity * 0.3))})`;
                }
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
            }
            ctx.restore();
        }

        drawWaveTop() {
            analyser.getByteTimeDomainData(timeData);
            
            ctx.save();
            ctx.strokeStyle = waveColor;
            ctx.lineWidth = 1.5;

            if (spectrumShape === 'circle' && mode === 'both') {
                ctx.globalAlpha = 0.8;
                const centerX = stageW / 2;
                const centerY = stageH / 2;
                const baseRadius = Math.min(stageW, stageH) * 0.14; 

                ctx.beginPath();
                const totalPoints = 120; 
                const sampleStep = Math.floor(timeData.length / totalPoints);

                for (let i = 0; i <= totalPoints; i++) {
                    const angle = (i / totalPoints) * Math.PI * 2 + imgRotation;
                    const audioIdx = Math.min(timeData.length - 1, i * sampleStep);
                    const waveVal = (timeData[audioIdx] / 128.0 - 1.0) * 25 * sensitivity; 
                    
                    const r = baseRadius + waveVal;
                    const x = centerX + Math.cos(angle) * r;
                    const y = centerY + Math.sin(angle) * r;
                    
                    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                }
                ctx.closePath();
                ctx.stroke();
                ctx.restore();
                return;
            }

            const step = stageW / timeData.length;
            const centerY = stageH * 0.25;

            if (waveStyle === 'line') {
                ctx.beginPath();
                let x = 0; ctx.moveTo(0, ((timeData[0] / 255) * (stageH * 0.5)));
                for (let i = 0; i < timeData.length - 1; i += 4) { 
                    const x1 = x; const y1 = ((timeData[i] / 255) * (stageH * 0.5));
                    const x2 = x + (step * 4); const y2 = ((timeData[i + 1] / 255) * (stageH * 0.5));
                    ctx.quadraticCurveTo(x1, y1, (x1 + x2) / 2, (y1 + y2) / 2); x += step * 4;
                }
                ctx.stroke();
            } else {
                const sampleStep = Math.floor(timeData.length / 50); 
                const barWidth = (stageW / 50) - 2;
                ctx.fillStyle = waveColor;
                for (let i = 0; i < 50; i++) {
                    const v = (timeData[i * sampleStep] / 128.0 - 1.0) * sensitivity; 
                    const h = v * 35; ctx.fillRect(i * (barWidth + 2), centerY - h, barWidth, h * 2 || 2);
                }
            }
            ctx.restore();
        }

        drawSpectrumBottom(data, bass) {
            const bars = Math.min(data.length, barcount);
            ctx.save();

            let currentFill;
            if (spectrumColor === 'FL_GRADIENT') {
                const gradient = ctx.createLinearGradient(0, stageH, 0, stageH - (stageH * 0.4));
                gradient.addColorStop(0.0, '#00ffcc'); gradient.addColorStop(0.5, '#00ff22');
                gradient.addColorStop(1.0, '#ff0044');
                currentFill = gradient;
            } else { currentFill = spectrumColor; }

            let baselineY = stageH;
            if (spectrumAnchor === 'top') baselineY = stageH * 0.5;
            if (spectrumAnchor === 'center') baselineY = stageH * 0.75;

            const centerX = stageW / 2;
            const centerY = stageH / 2;

            for (let i = 0; i < bars; i++) {
                const v = data[i];
                let h = (v / 255) * (stageH * 0.4) * sensitivity;
                
                // Peak drop logic calculation
                if (h > peaks[i]) {
                    peaks[i] = h;
                    peakDropCounters[i] = 0; // Reset drop counter
                } else {
                    peakDropCounters[i]++;
                    if (peakDropCounters[i] > 10) { // Delay before dropping
                        peaks[i] -= (2 + peaks[i] * 0.05); // Gravity acceleration
                        if (peaks[i] < 0) peaks[i] = 0;
                    }
                }

                if (spectrumShape === 'linear') {
                    const barW = stageW / (isMirror ? bars * 2 : bars);
                    const drawPositions = isMirror ? [stageW/2 + i*barW, stageW/2 - (i+1)*barW] : [i*barW];

                    drawPositions.forEach(currentX => {
                        const widthBar = barW - 1;
                        const direction = (spectrumAnchor === 'top') ? 1 : -1;

                        if (h > 0) {
                            ctx.fillStyle = currentFill;
                            if (barStyle === 'solid') {
                                ctx.fillRect(currentX, (direction === -1) ? baselineY - h : baselineY, widthBar, h);
                            } else if (barStyle === 'led') {
                                const ledGap = 2; const ledHeight = 4; const totalLeds = Math.floor(h / (ledHeight + ledGap));
                                for (let j = 0; j < totalLeds; j++) {
                                    const ledY = (direction === -1) ? baselineY - (j*(ledHeight+ledGap)) - ledHeight : baselineY + (j*(ledHeight+ledGap));
                                    ctx.fillRect(currentX, ledY, widthBar, ledHeight);
                                }
                            } else if (barStyle === 'dots') {
                                ctx.beginPath(); ctx.arc(currentX + widthBar/2, baselineY + (h * direction), Math.max(1, widthBar/2), 0, Math.PI * 2); ctx.fill();
                            }
                        }
                    });

                } else if (spectrumShape === 'circle') {
                    const baseRadius = Math.min(stageW, stageH) * 0.18;
                    const radius = baseRadius + (bass * 10); 

                    const angle = (i / bars) * Math.PI * 2 + imgRotation;
                    const cos = Math.cos(angle); const sin = Math.sin(angle);

                    ctx.strokeStyle = currentFill;
                    ctx.lineWidth = Math.max(1.5, (radius * 2 * Math.PI) / bars - 1);
                    ctx.lineCap = 'round';

                    let startX = centerX + cos * radius; let startY = centerY + sin * radius;
                    let endX = startX, endY = startY;

                    if (circleBarMode === 'outer') {
                        endX = centerX + cos * (radius + h); endY = centerY + sin * (radius + h);
                    } else if (circleBarMode === 'inner') {
                        endX = centerX + cos * (radius - h); endY = centerY + sin * (radius - h);
                    } else if (circleBarMode === 'double') {
                        startX = centerX + cos * (radius - h/1.5); startY = centerY + sin * (radius - h/1.5);
                        endX = centerX + cos * (radius + h/1.5); endY = centerY + sin * (radius + h/1.5);
                    }

                    ctx.beginPath(); ctx.moveTo(startX, startY); ctx.lineTo(endX, endY); ctx.stroke();


                } else if (spectrumShape === 'spiral') {
                    const spiralTightness = 1.4; 
                    const radius = (i * spiralTightness) + (bass * 12);

                    const angle = (i / bars) * Math.PI * 5 + imgRotation; 
                    const cos = Math.cos(angle); const sin = Math.sin(angle);

                    const startX = centerX + cos * radius; const startY = centerY + sin * radius;
                    const endX = centerX + cos * (radius + h * 0.65); const endY = centerY + sin * (radius + h * 0.65);

                    ctx.strokeStyle = currentFill;
                    ctx.lineWidth = Math.max(1.5, 3.5 - (i * 0.02)); ctx.lineCap = 'round';

                    ctx.beginPath(); ctx.moveTo(startX, startY); ctx.lineTo(endX, endY); ctx.stroke();
                }
            }

            imgRotation += 0.004 + (bass * 0.012); 
            ctx.restore();
        }
    }

    Scratch.extensions.register(new WebGLAudioVisualizer());

})(Scratch);
