// Name: Visualizer plus
// ID: Visualizer
// Description: A real, optimized audio visualizer showing on your project + WebGL Shader Editor.
// By: katboizz <https://scratch.mit.edu/users/katboizz/>
// By: StudioDANV <https://turbows.pages.dev/users/StudioDANV>
// License: MIT

(function (Scratch) {
    'use strict';

    if (!Scratch.extensions.unsandboxed) {
        throw new Error('Unsandboxed required');
    }

    const runtime = Scratch.vm.runtime;
    const Cast = Scratch.Cast;

    const TEX_W = 256;
    const VAR_SHADER = '__avz_shader__';
    const VAR_SETTINGS = '__avz_settings__';
    const VAR_SHADERS = '__avz_shaders__';

    const VERT = `
attribute vec2 p;
varying vec2 uv;
void main() {
  uv = p * 0.5 + 0.5;
  gl_Position = vec4(p, 0.0, 1.0);
}
`;

    const DEFAULT_FRAG = `precision mediump float;
varying vec2 uv;

uniform sampler2D tex;
uniform vec2 res;
uniform int mode;
uniform vec3 c1;
uniform vec3 c2;
uniform float gain;
uniform float opacity;
uniform float time;

float F(float x) { return texture2D(tex, vec2(clamp(x, 0.0, 1.0), 0.25)).r; }
float W(float x) { return texture2D(tex, vec2(clamp(x, 0.0, 1.0), 0.75)).r; }

void main() {
  vec3 col = vec3(0.0);
  float a = 0.0;

  if (mode == 0) {
    float n = 48.0;
    float i = floor(uv.x * n);
    float t = (i + 0.5) / n;
    float h = F(pow(t, 1.7) * 0.75) * gain;
    float fx = fract(uv.x * n);
    float bar = step(0.12, fx) * step(fx, 0.88);
    a = bar * step(uv.y, h);
    col = mix(c1, c2, uv.y);
  } else if (mode == 1) {
    float w = (W(uv.x) - 0.5) * 2.0 * gain;
    float y = 0.5 + w * 0.45;
    float d = abs(uv.y - y) * res.y;
    float core = 1.0 - smoothstep(1.0, 3.0, d);
    float glow = exp(-d * 0.12) * 0.5;
    a = clamp(core + glow, 0.0, 1.0);
    col = mix(c1, c2, uv.x);
  } else if (mode == 2) {
    vec2 p = (uv - 0.5) * vec2(res.x / res.y, 1.0) * 2.0;
    float r = length(p);
    float ang = atan(p.y, p.x);
    float t = abs(ang) / 3.14159265;
    float seg = 48.0;
    float s = fract(t * seg);
    float k = floor(t * seg) / seg;
    float h = F(pow(k + 0.5 / seg, 1.7) * 0.75) * gain;
    float base = 0.35;
    float outer = base + h * 0.55;
    float bar = step(0.12, s) * step(s, 0.88);
    a = bar * step(base, r) * step(r, outer);
    a = max(a, (1.0 - smoothstep(0.0, 0.012, abs(r - base))) * 0.6);
    col = mix(c1, c2, clamp((r - base) / 0.55, 0.0, 1.0));
  } else if (mode == 3) {
    float n = 48.0;
    float i = floor(uv.x * n);
    float t = (i + 0.5) / n;
    float h = F(pow(t, 1.7) * 0.75) * gain * 0.45;
    float fx = fract(uv.x * n);
    float barMask = step(0.12, fx) * step(fx, 0.88);
    float barA = barMask * step(uv.y, h);
    barA *= step(uv.y, 0.5);
    vec3 barCol = mix(c1, c2, uv.y / max(h, 0.001));

    float w = (W(uv.x) - 0.5) * 2.0 * gain;
    float y = 0.75 + w * 0.15;
    float d = abs(uv.y - y) * res.y;
    float core = 1.0 - smoothstep(1.0, 3.0, d);
    float glow = exp(-d * 0.12) * 0.5;
    float waveA = clamp(core + glow, 0.0, 1.0);
    waveA *= step(0.5, uv.y);
    vec3 waveCol = mix(c1, c2, uv.x);

    a = barA + waveA * (1.0 - barA);
    col = (barCol * barA + waveCol * waveA * (1.0 - barA)) / max(a, 0.0001);
  } else {
    float n = 48.0;
    float i = floor(uv.x * n);
    float t = (i + 0.5) / n;
    float h = F(pow(t, 1.7) * 0.75) * gain;
    float fx = fract(uv.x * n);
    float bar = step(0.12, fx) * step(fx, 0.88);
    a = bar * step(uv.y, h);
    col = mix(c1, c2, uv.y);
  }

  a *= opacity;
  gl_FragColor = vec4(col * a, a);
}
`;

    const SAMPLE_HEADER = `#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 uv;

uniform sampler2D tex;
uniform vec2 res;
uniform vec3 c1;
uniform vec3 c2;
uniform float gain;
uniform float opacity;
uniform float time;

float F(float x) { return texture2D(tex, vec2(clamp(x, 0.0, 1.0), 0.25)).r; }
float W(float x) { return texture2D(tex, vec2(clamp(x, 0.0, 1.0), 0.75)).r; }

`;

    const SAMPLES = [
        {
            name: 'Bars + Wave (combo)',
            src: SAMPLE_HEADER + `void main() {
  float n = 40.0;
  float i = floor(uv.x * n);
  float amp = F(pow((i + 0.5) / n, 1.6) * 0.8) * gain;
  float cell = res.x / n;
  float px = (fract(uv.x * n) - 0.5) * cell;
  float py = max(0.5 - uv.y, 0.0) * res.y;
  float top = amp * res.y * 0.45;
  float r = cell * 0.32;
  float d = length(vec2(px, max(py - top, 0.0))) - r;
  float core = 1.0 - smoothstep(0.0, 1.5, d);
  float glow = exp(-max(d, 0.0) * 0.1) * (0.15 + amp * 0.5);
  float barA = clamp(core + glow, 0.0, 1.0);
  barA *= step(uv.y, 0.5);
  vec3 barCol = mix(c1, c2, uv.y / 0.5);

  float w = (W(uv.x) - 0.5) * 2.0 * gain;
  float y = 0.75 + w * 0.15;
  float dw = abs(uv.y - y) * res.y;
  float coreW = 1.0 - smoothstep(1.0, 3.0, dw);
  float glowW = exp(-dw * 0.12) * 0.5;
  float waveA = clamp(coreW + glowW, 0.0, 1.0);
  waveA *= step(0.5, uv.y);
  vec3 waveCol = mix(c1, c2, uv.x);

  float a = barA + waveA * (1.0 - barA);
  vec3 col = (barCol * barA + waveCol * waveA * (1.0 - barA)) / max(a, 0.0001);
  a *= opacity;
  gl_FragColor = vec4(col * a, a);
}
`
        },
        {
            name: 'Neon Bars (đối xứng, có glow)',
            src: SAMPLE_HEADER + `void main() {
  float n = 40.0;
  float i = floor(uv.x * n);
  float amp = F(pow((i + 0.5) / n, 1.6) * 0.8) * gain;

  float cell = res.x / n;
  float px = (fract(uv.x * n) - 0.5) * cell;
  float py = abs(uv.y - 0.5) * res.y;
  float top = amp * res.y * 0.5;
  float r = cell * 0.32;

  float d = length(vec2(px, max(py - top, 0.0))) - r;
  float core = 1.0 - smoothstep(0.0, 1.5, d);
  float glow = exp(-max(d, 0.0) * 0.1) * (0.15 + amp * 0.5);

  vec3 col = mix(c1, c2, clamp(py / (res.y * 0.5), 0.0, 1.0));
  float a = clamp(core + glow, 0.0, 1.0) * opacity;
  gl_FragColor = vec4(col * a, a);
}
`
        },
        {
            name: 'Radial Pulse (vòng tròn xoay, nhảy theo bass)',
            src: SAMPLE_HEADER + `void main() {
  vec2 p = (uv - 0.5) * vec2(res.x / res.y, 1.0) * 2.0;
  float r = length(p);
  float ang = atan(p.y, p.x) + mod(time * 0.25, 6.2831853);
  float u = abs(fract(ang / 6.2831853) * 2.0 - 1.0);

  float bass = (F(0.02) + F(0.05) + F(0.09)) / 3.0 * gain;
  float base = 0.30 + bass * 0.10;

  float seg = 64.0;
  float k = floor(u * seg) / seg;
  float amp = F(pow(k + 0.5 / seg, 1.6) * 0.8) * gain;
  float s = fract(u * seg);
  float ray = step(0.2, s) * step(s, 0.8);
  float outer = base + 0.03 + amp * 0.45;
  float rays = ray * step(base + 0.03, r) * step(r, outer);

  float ring = 1.0 - smoothstep(0.0, 0.012, abs(r - base));
  float glow = exp(-abs(r - base) * 12.0) * (0.2 + bass * 0.8);
  float core = (1.0 - smoothstep(0.0, base, r)) * bass * 0.6;

  float a = clamp(rays + ring * 0.8 + glow + core, 0.0, 1.0) * opacity;
  vec3 col = mix(c1, c2, clamp((r - base) / 0.5, 0.0, 1.0));
  gl_FragColor = vec4(col * a, a);
}
`
        },
        {
            name: 'Plasma Wave (nền plasma, đường cong phổ)',
            src: SAMPLE_HEADER + `void main() {
  float h = F(pow(uv.x, 1.4) * 0.8) * gain * 0.9;
  float inside = 1.0 - smoothstep(h - 0.008, h + 0.008, uv.y);
  float line = exp(-abs(uv.y - h) * res.y * 0.07);

  float t = time;
  float v = sin(uv.x * 10.0 + t) + sin(uv.y * 8.0 - t * 1.3)
          + sin((uv.x + uv.y) * 6.0 + t * 0.7) + sin(length(uv - 0.5) * 12.0 - t * 2.0);
  v = v * 0.25 + 0.5;
  vec3 col = mix(c1, c2, v);
  col += 0.12 * sin(vec3(0.0, 2.0, 4.0) + v * 6.0 + t);
  col = clamp(col, 0.0, 1.0);

  float a = clamp(inside * 0.7 + line * 0.9, 0.0, 1.0) * opacity;
  gl_FragColor = vec4(col * a, a);
}
`
        },
        {
            name: 'CRT Scope (oscilloscope, lưới + scanline)',
            src: SAMPLE_HEADER + `void main() {
  float px = 1.0 / res.x;
  float amp = gain * 0.42;
  float y  = 0.5 + (W(uv.x) - 0.5) * 2.0 * amp;
  float y0 = 0.5 + (W(uv.x - px * 2.0) - 0.5) * 2.0 * amp;
  float y1 = 0.5 + (W(uv.x + px * 2.0) - 0.5) * 2.0 * amp;
  float lo = min(y, min(y0, y1));
  float hi = max(y, max(y0, y1));
  float dy = max(max(lo - uv.y, uv.y - hi), 0.0) * res.y;

  float trace = 1.0 - smoothstep(0.5, 2.0, dy);
  float glow = exp(-dy * 0.12) * 0.6;

  float gx = 1.0 - smoothstep(0.0, 0.015, abs(fract(uv.x * 10.0 + 0.5) - 0.5));
  float gy = 1.0 - smoothstep(0.0, 0.02, abs(fract(uv.y * 6.0 + 0.5) - 0.5));
  float grid = max(gx, gy);

  float scan = 0.85 + 0.15 * sin(uv.y * res.y * 3.14159265);
  float vig = 1.0 - 0.55 * pow(length(uv - 0.5) * 1.4, 2.0);

  float inten = clamp((trace + glow) * scan, 0.0, 1.0) * vig;
  float a = clamp(inten + grid * 0.18 * vig, 0.0, 1.0);
  vec3 rgb = min(c1 * inten + c2 * grid * 0.18 * vig, vec3(a));
  gl_FragColor = vec4(rgb * opacity, a * opacity);
}
`
        },
        {
            name: 'Tunnel Rings (đường hầm, vòng sáng theo phổ)',
            src: SAMPLE_HEADER + `void main() {
  vec2 p = (uv - 0.5) * vec2(res.x / res.y, 1.0) * 2.0;
  float r = length(p);
  float ang = atan(p.y, p.x);
  float u = abs(fract(ang / 6.2831853) * 2.0 - 1.0);

  float bass = (F(0.02) + F(0.05) + F(0.09)) / 3.0 * gain;
  float amp = F(pow(u, 1.5) * 0.8) * gain;

  float z = 1.0 / (r + 0.15);
  float band = abs(fract(z * 1.5 - time * 0.6) - 0.5);
  float ring = 1.0 - smoothstep(0.0, 0.08 + bass * 0.12, band);
  ring *= 0.35 + amp * 1.2;

  float fade = smoothstep(0.0, 0.25, r) * (1.0 - smoothstep(0.9, 1.5, r));
  vec3 col = mix(c1, c2, clamp(r, 0.0, 1.0));
  float a = clamp(ring * fade, 0.0, 1.0) * opacity;
  gl_FragColor = vec4(col * a, a);
}
`
        },
        {
            name: 'Aurora (rèm cực quang uốn lượn)',
            src: SAMPLE_HEADER + `void main() {
  float x = uv.x;
  float amp = F(pow(x, 1.5) * 0.8) * gain;

  float curtain = 0.0;
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    float y0 = 0.35 + fi * 0.12
             + 0.08 * sin(x * (4.0 + fi * 2.0) + time * (0.4 + 0.2 * fi))
             + amp * 0.15;
    float d = uv.y - y0;
    curtain += exp(-abs(d) * (10.0 - fi * 2.0)) * (1.0 - fi * 0.25);
  }

  float streak = 0.5 + 0.5 * sin(x * 80.0 + sin(x * 7.0 + time) * 3.0);
  curtain *= 0.6 + 0.4 * streak;

  vec3 col = mix(c1, c2, uv.y);
  float a = clamp(curtain * (0.5 + amp), 0.0, 1.0) * opacity;
  gl_FragColor = vec4(col * a, a);
}
`
        },
        {
            name: 'Dot Matrix EQ (ma trận chấm, đỉnh sáng)',
            src: SAMPLE_HEADER + `void main() {
  float cx = 40.0;
  float cy = floor(cx * res.y / res.x);
  vec2 cells = vec2(cx, cy);
  vec2 id = floor(uv * cells);
  vec2 f = fract(uv * cells) - 0.5;

  float amp = F(pow((id.x + 0.5) / cx, 1.6) * 0.8) * gain;
  float rowY = (id.y + 0.5) / cy;
  float lit = step(rowY, amp);
  float topLit = lit * (1.0 - step(amp, (id.y + 1.5) / cy));

  float dotShape = 1.0 - smoothstep(0.30, 0.38, length(f));
  float twinkle = 0.8 + 0.2 * sin(time * 3.0 + id.x * 1.7 + id.y * 2.3);
  float I = dotShape * (lit * twinkle + (1.0 - lit) * 0.1);

  vec3 col = mix(c1, c2, uv.y);
  col = mix(col, vec3(1.0), topLit * 0.7);
  float a = clamp(I, 0.0, 1.0) * opacity;
  gl_FragColor = vec4(col * a, a);
}
`
        }
    ];

    const MODES = { bars: 0, wave: 1, circle: 2, both: 3, custom: 4 };
    const MODE_NAMES = ['bars', 'wave', 'circle', 'both', 'custom'];

    function getGlobalVar(name) {
        try {
            const stage = runtime.getTargetForStage();
            if (!stage || !stage.variables) return null;
            return stage.lookupVariableByNameAndType(name, '') || null;
        } catch (e) { return null; }
    }

    function ensureGlobalVar(name, defaultValue) {
        let v = getGlobalVar(name);
        if (v) return v;

        const stage = runtime.getTargetForStage();
        if (!stage) return null;

        let VarCtor = null;
        try {
            const existing = Object.values(stage.variables)[0];
            if (existing && existing.constructor && existing.constructor !== Object) {
                VarCtor = existing.constructor;
            }
        } catch (e) {}

        let newVar = null;
        if (VarCtor) {
            try { newVar = new VarCtor(null, name, defaultValue, false); } catch (e) { newVar = null; }
        }

        if (!newVar) {
            const id = name + '_' + Math.random().toString(36).slice(2, 10);
            newVar = { id: id, name: name, type: '', value: defaultValue, isCloud: false };
        }

        try { stage.variables[name] = newVar; } catch (e) { return null; }
        return newVar;
    }

    function readProjectVar(name) {
        const v = getGlobalVar(name);
        return v ? v.value : null;
    }

    function writeProjectVar(name, value) {
        const v = ensureGlobalVar(name, '');
        if (v) v.value = value;
        return !!v;
    }

    function getShaders() {
        const raw = readProjectVar(VAR_SHADERS);
        if (typeof raw === 'string' && raw.length > 0) {
            try {
                const arr = JSON.parse(raw);
                if (Array.isArray(arr)) return arr.filter(s => s && typeof s.name === 'string' && typeof s.src === 'string');
            } catch (e) {}
        }
        return [];
    }

    function setShaders(arr) { return writeProjectVar(VAR_SHADERS, JSON.stringify(arr)); }
    function findShader(name) { return getShaders().find(s => s.name === name) || null; }

    function addOrUpdateShader(name, src) {
        const arr = getShaders();
        const i = arr.findIndex(s => s.name === name);
        if (i >= 0) arr[i].src = src; else arr.push({ name, src });
        setShaders(arr);
        return arr;
    }

    function removeShader(name) {
        const arr = getShaders().filter(s => s.name !== name);
        setShaders(arr);
        return arr;
    }

    function saveShaderToProject(src) { return writeProjectVar(VAR_SHADER, src); }
    function loadShaderFromProject() {
        const v = readProjectVar(VAR_SHADER);
        return typeof v === 'string' && v.length > 0 ? v : null;
    }
    function clearShaderFromProject() { return writeProjectVar(VAR_SHADER, ''); }

    function saveSettingsToProject() {
        return writeProjectVar(VAR_SETTINGS, JSON.stringify({
            mode: MODE_NAMES[state.mode] || 'bars',
            customShader: state.customShader || '',
            color1: rgbToHex(state.color1),
            color2: rgbToHex(state.color2),
            sensitivity: Math.round(state.gain * 100),
            opacity: Math.round(state.opacity * 100),
            smoothing: state.smoothing,
            area: state.area
        }));
    }

    function loadSettingsFromProject() {
        const t = readProjectVar(VAR_SETTINGS);
        if (typeof t === 'string' && t.length > 0) {
            try { loadSettings(JSON.parse(t)); } catch (e) {}
        }
    }

    function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }

    function colorToRgb(value) {
        const c = Cast.toRgbColorList(value);
        return [c[0] / 255, c[1] / 255, c[2] / 255];
    }

    function rgbToHex(c) {
        return '#' + c.map(v => Math.round(clamp(v, 0, 1) * 255).toString(16).padStart(2, '0')).join('');
    }

    const state = {
        visible: false, mode: 0, customShader: '',
        color1: [1.0, 0.31, 0.85], color2: [0.31, 0.76, 1.0],
        gain: 1.0, opacity: 1.0, smoothing: 80,
        area: { x: 0, y: 60, w: 100, h: 40 },
        shaderSrc: loadShaderFromProject() || DEFAULT_FRAG
    };

    let glAnalyser = null;
    let glFreqBuf = null;
    let glTimeBuf = null;
    let glLastEngine = null;
    let realSilent = true;
    const texData = new Uint8Array(TEX_W * 2);
    const demoData = new Uint8Array(TEX_W * 2);
    const t0 = performance.now();

    function setupGlAnalyser() {
        const engine = runtime.audioEngine;
        if (!engine || !engine.audioContext || !engine.inputNode) return false;
        if (glAnalyser && glLastEngine === engine && glFreqBuf && glTimeBuf) return true;
        try {
            glAnalyser = engine.audioContext.createAnalyser();
            glAnalyser.fftSize = 1024;
            glAnalyser.smoothingTimeConstant = state.smoothing / 100;
            glAnalyser.minDecibels = -90;
            glAnalyser.maxDecibels = -20;
            engine.inputNode.connect(glAnalyser);
            glFreqBuf = new Uint8Array(glAnalyser.frequencyBinCount);
            glTimeBuf = new Uint8Array(glAnalyser.fftSize);
            glLastEngine = engine;
            return true;
        } catch (e) {
            console.warn('[Audio Visualizer] Không gắn được analyser:', e);
            glAnalyser = null; glFreqBuf = null; glTimeBuf = null;
            return false;
        }
    }

    function updateAudioTexture() {
        if (!setupGlAnalyser()) {
            texData.fill(0);
            for (let i = 0; i < TEX_W; i++) texData[TEX_W + i] = 128;
            realSilent = true;
            return;
        }
        if (!glFreqBuf || !glTimeBuf) {
            realSilent = true;
            return;
        }
        const ctx = runtime.audioEngine.audioContext;
        if (ctx.state === 'suspended') ctx.resume().catch(() => {});
        try {
            glAnalyser.getByteFrequencyData(glFreqBuf);
            glAnalyser.getByteTimeDomainData(glTimeBuf);
        } catch (e) {
            return;
        }
        let any = 0;
        for (let i = 0; i < TEX_W; i++) {
            texData[i] = glFreqBuf[i] || 0;
            texData[TEX_W + i] = glTimeBuf[i * 4] || 128;
            any |= glFreqBuf[i] || 0;
        }
        realSilent = any === 0;
    }

    function fillDemo(t) {
        for (let i = 0; i < TEX_W; i++) {
            const x = i / TEX_W;
            let v = Math.exp(-x * 2.2) * (0.55 + 0.35 * Math.sin(t * 2.3 + x * 14)) * (0.7 + 0.3 * Math.sin(t * 0.9));
            v += 0.2 * Math.max(0, Math.sin(t * 3.1 - x * 30)) * Math.exp(-x * 1.2);
            demoData[i] = clamp(v * 255, 0, 255);
            const w = 0.5 * Math.sin(x * Math.PI * 6 + t * 4) * (0.6 + 0.4 * Math.sin(t * 1.3)) + 0.25 * Math.sin(x * Math.PI * 14 - t * 6);
            demoData[TEX_W + i] = clamp(128 + w * 110, 0, 255);
        }
    }

    function createRenderer(canvas) {
        const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: true });
        if (!gl) return null;
        let program = null; let uni = {};

        function compile(type, src) {
            const sh = gl.createShader(type);
            gl.shaderSource(sh, src); gl.compileShader(sh);
            if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
                const log = gl.getShaderInfoLog(sh) || 'Lỗi biên dịch shader không rõ.';
                gl.deleteShader(sh); throw new Error(log);
            }
            return sh;
        }

        function buildProgram(fragSrc) {
            const vs = compile(gl.VERTEX_SHADER, VERT);
            let fs;
            try { fs = compile(gl.FRAGMENT_SHADER, fragSrc); }
            catch (e) { gl.deleteShader(vs); throw e; }
            const prog = gl.createProgram();
            gl.attachShader(prog, vs); gl.attachShader(prog, fs);
            gl.bindAttribLocation(prog, 0, 'p'); gl.linkProgram(prog);
            gl.deleteShader(vs); gl.deleteShader(fs);
            if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
                const log = gl.getProgramInfoLog(prog) || 'Lỗi link shader không rõ.';
                gl.deleteProgram(prog); throw new Error(log);
            }
            return prog;
        }

        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, TEX_W, 2, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, texData);

        function apply(src) {
            try {
                const prog = buildProgram(src);
                if (program) gl.deleteProgram(program);
                program = prog; gl.useProgram(program); uni = {};
                ['tex', 'res', 'mode', 'c1', 'c2', 'gain', 'opacity', 'time'].forEach(n => {
                    uni[n] = gl.getUniformLocation(program, n);
                });
                gl.uniform1i(uni.tex, 0); return null;
            } catch (e) { return String(e.message || e); }
        }

        function draw(data) {
            if (!program) return;
            const dpr = window.devicePixelRatio || 1;
            const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
            const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
            if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
            gl.viewport(0, 0, canvas.width, canvas.height); gl.useProgram(program);
            gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
            gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, TEX_W, 2, gl.LUMINANCE, gl.UNSIGNED_BYTE, data);

            gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
            gl.uniform2f(uni.res, canvas.width, canvas.height);
            gl.uniform1i(uni.mode, state.mode === 4 ? 0 : state.mode);
            gl.uniform3fv(uni.c1, state.color1); gl.uniform3fv(uni.c2, state.color2);
            gl.uniform1f(uni.gain, state.gain); gl.uniform1f(uni.opacity, state.opacity);
            gl.uniform1f(uni.time, (performance.now() - t0) / 1000);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }

        return { canvas, apply, draw };
    }

    let main = null; let overlay = null; let preview = null; let previewCanvas = null; let previewSource = 'auto'; let raf = 0;

    function applyShaderAll(src) {
        if (main) { const err = main.apply(src); if (err) return err; }
        if (preview) { const err = preview.apply(src); if (err) return err; }
        state.shaderSrc = src; return null;
    }

    function initGL() {
        if (main) return true;
        const c = document.createElement('canvas');
        c.style.position = 'absolute'; c.style.pointerEvents = 'none'; c.style.zIndex = '2'; c.style.display = 'none';
        const r = createRenderer(c);
        if (!r) { return false; }
        let err = r.apply(state.shaderSrc);
        if (err) {
            state.shaderSrc = DEFAULT_FRAG; err = r.apply(DEFAULT_FRAG);
            if (err) { return false; }
        }
        main = r; overlay = c; return true;
    }

    function attachOverlay() {
        const stageCanvas = runtime.renderer && runtime.renderer.canvas;
        if (!stageCanvas || !stageCanvas.parentElement) return false;
        const parent = stageCanvas.parentElement;
        if (overlay.parentElement !== parent) {
            if (getComputedStyle(parent).position === 'static') parent.style.position = 'relative';
            parent.appendChild(overlay);
        }
        return true;
    }

    function layoutCanvas(c) {
        if (!c) return;
        const a = state.area;
        c.style.left = a.x + '%'; c.style.top = a.y + '%'; c.style.width = a.w + '%'; c.style.height = a.h + '%';
    }

    function applyLayout() { layoutCanvas(overlay); layoutCanvas(previewCanvas); }
    function previewActive() { return !!(editor && preview && editor.root.style.display !== 'none'); }

    function loop() {
        raf = 0;
        const mainOn = state.visible && main;
        const prevOn = previewActive();
        if (!mainOn && !prevOn) return;

        updateAudioTexture();
        if (mainOn && attachOverlay()) main.draw(texData);

        if (prevOn) {
            let data = texData;
            if (previewSource === 'demo' || (previewSource === 'auto' && realSilent)) {
                fillDemo((performance.now() - t0) / 1000); data = demoData;
            }
            preview.draw(data);
        }
        raf = requestAnimationFrame(loop);
    }

    function ensureLoop() { if (!raf) raf = requestAnimationFrame(loop); }

    function show() {
        if (!initGL()) return;
        state.visible = true; overlay.style.display = 'block';
        applyLayout(); ensureLoop(); syncEditor();
    }

    function hide() {
        state.visible = false; if (overlay) overlay.style.display = 'none';
        syncEditor();
    }

    function setSmoothing(percent) {
        state.smoothing = clamp(percent, 0, 99);
        if (glAnalyser) glAnalyser.smoothingTimeConstant = state.smoothing / 100;
    }

    function applyStyle(styleName) {
        const key = Cast.toString(styleName).toLowerCase();
        if (key === 'custom') {
            state.mode = 4;
            if (main || preview) { const err = applyShaderAll(state.shaderSrc); if (err) return err; }
            return null;
        }
        const found = findShader(key);
        if (found) {
            state.mode = 4; state.customShader = key;
            if (main || preview) { const err = applyShaderAll(found.src); if (err) return err; }
            else { state.shaderSrc = found.src; }
            return null;
        }
        if (key in MODES && key !== 'custom') {
            state.mode = MODES[key]; state.customShader = ''; return null;
        }
        return 'Không tìm thấy style: ' + styleName;
    }

    let editor = null;
    let autoLoadedProShader = false;

    function buildProEquivalentShader() {
        const isBoth = (mode === 'both');
        const wColorHex = waveColor || '#00ffcc';
        let specCol = spectrumColor;
        const useGradient = (specCol === 'FL_GRADIENT');

        const wc = rgbToHex(colorToRgb(wColorHex));
        const sc1 = useGradient ? '#00ffcc' : rgbToHex(colorToRgb(specCol || '#00ffcc'));

        return `precision highp float;
varying vec2 uv;

uniform sampler2D tex;
uniform vec2 res;
uniform vec3 c1;
uniform vec3 c2;
uniform float gain;
uniform float opacity;
uniform float time;

float F(float x) { return texture2D(tex, vec2(clamp(x, 0.0, 1.0), 0.25)).r; }
float W(float x) { return texture2D(tex, vec2(clamp(x, 0.0, 1.0), 0.75)).r; }

void main() {
  vec3 col = vec3(0.0);
  float a = 0.0;

  float n = ${barcount.toFixed(1)};
  float i = floor(uv.x * n);
  float t = (i + 0.5) / n;
  float h = F(pow(t, 1.7) * 0.75) * gain * ${(isBoth ? '0.45' : '0.9')};
  float fx = fract(uv.x * n);
  float barMask = step(0.12, fx) * step(fx, 0.88);
  float barA = barMask * step(uv.y, h) * step(0.02, uv.y);
  ${isBoth ? 'barA *= step(uv.y, 0.5);' : ''}
  vec3 barCol = mix(c1, c2, uv.y / max(h, 0.001));

  float w = (W(uv.x) - 0.5) * 2.0 * gain;
  float wy = ${isBoth ? '0.75 + w * 0.15' : '0.5 + w * 0.45'};
  float d = abs(uv.y - wy) * res.y;
  float core = 1.0 - smoothstep(1.0, 3.0, d);
  float glow = exp(-d * 0.12) * 0.5;
  float waveA = clamp(core + glow, 0.0, 1.0);
  ${isBoth ? 'waveA *= step(0.5, uv.y);' : ''}
  vec3 waveCol = mix(c1, c2, uv.x);

  a = barA + waveA * (1.0 - barA);
  col = (barCol * barA + waveCol * waveA * (1.0 - barA)) / max(a, 0.0001);
  a *= opacity;
  gl_FragColor = vec4(col * a, a);
}
`;
    }

    const EDITOR_CSS = `
.avz-panel{position:fixed;top:60px;right:20px;width:min(880px,calc(100vw - 40px));height:min(660px,calc(100vh - 80px));z-index:99999;
  display:flex;flex-direction:column;background:#1e1f26;color:#e6e6ee;border:1px solid #3a3c4a;border-radius:10px;
  box-shadow:0 10px 40px rgba(0,0,0,.45);font:13px/1.4 system-ui,-apple-system,Segoe UI,sans-serif;}
.avz-head{display:flex;align-items:center;justify-content:space-between;padding:8px 12px;cursor:move;
  background:#2a2c38;border-radius:10px 10px 0 0;font-weight:600;user-select:none;touch-action:none;}
.avz-x{background:none;border:0;color:#e6e6ee;font-size:18px;cursor:pointer;line-height:1;padding:0 4px;}
.avz-body{flex:1;min-height:0;padding:10px 12px;display:flex;gap:14px;overflow:hidden;}
.avz-col{display:flex;flex-direction:column;gap:8px;min-width:0;min-height:0;overflow:auto;}
.avz-left{flex:0 0 340px;}
.avz-right{flex:1 1 auto;}
.avz-right select{flex:1;min-width:0;}
.avz-right .avz-btn{white-space:nowrap;}
@media (max-width:760px){
  .avz-body{flex-direction:column;overflow:auto;}
  .avz-col{overflow:visible;}
  .avz-left{flex:none;}
  .avz-right .avz-code{min-height:240px;}
}
.avz-row{display:flex;align-items:center;gap:8px;}
.avz-row>label{flex:0 0 96px;color:#aab;}
.avz-row input[type=range]{flex:1;}
.avz-val{flex:0 0 40px;text-align:right;color:#aab;font-variant-numeric:tabular-nums;}
.avz-panel select,.avz-panel input[type=number]{background:#14151a;color:#e6e6ee;border:1px solid #3a3c4a;border-radius:6px;padding:3px 6px;}
.avz-panel input[type=number]{width:62px;}
.avz-panel input[type=color]{width:44px;height:26px;border:1px solid #3a3c4a;border-radius:6px;background:#14151a;padding:1px;}
.avz-sec{font-weight:600;margin-top:4px;color:#cfd2ff;}
.avz-code{width:100%;box-sizing:border-box;flex:1 1 auto;min-height:200px;resize:none;background:#101116;color:#d6e2ff;
  border:1px solid #3a3c4a;border-radius:6px;padding:6px;font:12px/1.45 Consolas,Menlo,monospace;tab-size:2;white-space:pre;}
.avz-btn{background:#3b6cff;color:#fff;border:0;border-radius:6px;padding:5px 10px;cursor:pointer;font-weight:600;}
.avz-btn.alt{background:#3a3c4a;}
.avz-err{white-space:pre-wrap;font:12px/1.4 Consolas,Menlo,monospace;color:#ff8a8a;max-height:120px;overflow:auto;}
.avz-err.ok{color:#7be39a;}
.avz-prev{display:flex;flex-direction:column;gap:6px;}
.avz-prevbar{display:flex;align-items:center;justify-content:space-between;gap:8px;}
.avz-prevbar span{font-weight:600;color:#cfd2ff;}
.avz-stage{position:relative;overflow:hidden;width:100%;border-radius:6px;border:1px solid #3a3c4a;
  background:linear-gradient(135deg,#2b2f3a,#14151a);}
.avz-stage canvas{position:absolute;pointer-events:none;outline:1px dashed rgba(255,255,255,.28);outline-offset:-1px;}
.avz-note{position:absolute;left:8px;top:6px;font-size:11px;color:rgba(255,255,255,.55);pointer-events:none;}
.avz-mgr-list{display:flex;flex-direction:column;gap:4px;max-height:160px;overflow:auto;border:1px solid #3a3c4a;border-radius:6px;padding:4px;background:#101116;}
.avz-mgr-item{display:flex;align-items:center;gap:6px;padding:4px 6px;border-radius:4px;cursor:pointer;}
.avz-mgr-item:hover{background:#2a2c38;}
.avz-mgr-item.active{background:#3b6cff;color:#fff;}
.avz-mgr-item span{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.avz-mgr-item button{background:#c0392b;color:#fff;border:0;border-radius:4px;padding:2px 6px;cursor:pointer;font-size:11px;}
`;

    function h(tag, props, ...children) {
        const el = document.createElement(tag);
        if (props) {
            for (const k of Object.keys(props)) {
                if (k === 'class') el.className = props[k];
                else if (k === 'text') el.textContent = props[k];
                else if (k.startsWith('on')) el.addEventListener(k.slice(2), props[k]);
                else el.setAttribute(k, props[k]);
            }
        }
        for (const c of children) if (c) el.appendChild(c);
        return el;
    }

    function buildEditor() {
        const style = h('style', { text: EDITOR_CSS });
        const els = {};
        const row = (label, ...ctrls) => h('div', { class: 'avz-row' }, h('label', { text: label }), ...ctrls);

        const sw = runtime.stageWidth || 480;
        const sh = runtime.stageHeight || 360;
        const stageBox = h('div', { class: 'avz-stage' });
        stageBox.style.aspectRatio = sw + ' / ' + sh;

        previewCanvas = document.createElement('canvas');
        stageBox.appendChild(previewCanvas);
        preview = createRenderer(previewCanvas);
        if (preview) {
            const err = preview.apply(state.shaderSrc);
            if (err) { preview.apply(DEFAULT_FRAG); }
        } else {
            stageBox.appendChild(h('div', { class: 'avz-note', text: 'Trình duyệt không hỗ trợ WebGL — không có preview.' }));
        }
        layoutCanvas(previewCanvas);

        els.source = h('select');
        [['auto', 'Tự động'], ['project', 'Âm thanh project'], ['demo', 'Demo']].forEach(([v, t]) =>
            els.source.appendChild(h('option', { value: v, text: t }))
        );
        els.source.addEventListener('change', () => (previewSource = els.source.value));

        const previewBox = h('div', { class: 'avz-prev' },
            h('div', { class: 'avz-prevbar' }, h('span', { text: 'Preview' }), els.source),
            stageBox
        );

        els.visible = h('input', { type: 'checkbox' });
        els.visible.addEventListener('change', () => (els.visible.checked ? show() : hide()));

        els.mode = h('select');
        function rebuildModeOptions() {
            els.mode.innerHTML = '';
            MODE_NAMES.slice(0, 4).forEach((n, i) => els.mode.appendChild(h('option', { value: String(i), text: n })));
            els.mode.appendChild(h('option', { value: 'custom', text: 'custom (dùng shader active)' }));
            getShaders().forEach(s => {
                els.mode.appendChild(h('option', { value: s.name, text: 'shader: ' + s.name }));
            });
            if (state.mode === 4 && state.customShader && findShader(state.customShader)) {
                els.mode.value = state.customShader;
            } else if (state.mode === 4) {
                els.mode.value = 'custom';
            } else {
                els.mode.value = String(state.mode);
            }
        }
        els.mode.addEventListener('change', () => {
            const v = els.mode.value;
            if (v === 'custom') { state.mode = 4; state.customShader = ''; }
            else if (/^\d+$/.test(v)) { state.mode = Number(v); state.customShader = ''; }
            else {
                const found = findShader(v);
                if (found) {
                    state.mode = 4; state.customShader = v;
                    const err = applyShaderAll(found.src);
                    if (err) { els.err.className = 'avz-err'; els.err.textContent = err; }
                }
            }
            saveSettingsToProject();
        });
        els.mode._rebuild = rebuildModeOptions;
        rebuildModeOptions();

        els.c1 = h('input', { type: 'color' });
        els.c2 = h('input', { type: 'color' });
        els.c1.addEventListener('input', () => { state.color1 = colorToRgb(els.c1.value); saveSettingsToProject(); });
        els.c2.addEventListener('input', () => { state.color2 = colorToRgb(els.c2.value); saveSettingsToProject(); });

        function slider(key, min, max, onChange) {
            const input = h('input', { type: 'range', min: String(min), max: String(max), step: '1' });
            const val = h('span', { class: 'avz-val' });
            input.addEventListener('input', () => {
                val.textContent = input.value + '%';
                onChange(Number(input.value));
            });
            els[key] = input; els[key + 'Val'] = val;
            return [input, val];
        }
        const sSens = slider('gain', 0, 300, v => { state.gain = v / 100; saveSettingsToProject(); });
        const sOp = slider('opacity', 0, 100, v => { state.opacity = v / 100; saveSettingsToProject(); });
        const sSm = slider('smoothing', 0, 99, v => { setSmoothing(v); saveSettingsToProject(); });

        function num(key, min, max) {
            const input = h('input', { type: 'number', min: String(min), max: String(max), step: '1' });
            input.addEventListener('input', () => {
                const v = Number(input.value);
                if (!isFinite(v)) return;
                state.area[key] = key === 'w' || key === 'h' ? clamp(v, 1, 100) : v;
                applyLayout(); saveSettingsToProject();
            });
            els['area' + key] = input;
            return input;
        }
        const aRow1 = row('Vị trí (%)', h('span', { text: 'x' }), num('x', -100, 100), h('span', { text: 'y' }), num('y', -100, 100));
        const aRow2 = row('Kích thước (%)', h('span', { text: 'w' }), num('w', 1, 100), h('span', { text: 'h' }), num('h', 1, 100));

        els.code = h('textarea', { class: 'avz-code', spellcheck: 'false' });
        els.err = h('div', { class: 'avz-err' });

        function applyFromEditor() {
            const err = applyShaderAll(els.code.value);
            if (err) { els.err.className = 'avz-err'; els.err.textContent = err; }
            else {
                els.err.className = 'avz-err ok';
                els.err.textContent = 'Biên dịch OK.';
                saveShaderToProject(els.code.value);
            }
        }

        els.code.addEventListener('keydown', e => {
            if (e.key === 'Tab') {
                e.preventDefault();
                const ta = els.code;
                ta.setRangeText('  ', ta.selectionStart, ta.selectionEnd, 'end');
            } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault(); applyFromEditor();
            }
        });

        els.preset = h('select');
        els.preset.appendChild(h('option', { value: '', text: 'Shader mẫu…' }));
        SAMPLES.forEach((s, i) => els.preset.appendChild(h('option', { value: String(i), text: s.name })));
        els.preset.appendChild(h('option', { value: 'default', text: 'Shader mặc định' }));
        els.preset.addEventListener('change', () => {
            const v = els.preset.value;
            if (v === '') return;
            els.code.value = v === 'default' ? DEFAULT_FRAG : SAMPLES[Number(v)].src;
            const label = v === 'default' ? 'default-shader' : SAMPLES[Number(v)].name.split(' (')[0];
            lastFileName = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '.glsl';
            applyFromEditor();
        });

        const fileInput = h('input', { type: 'file', accept: '.glsl,.frag,.fs,.txt,text/plain' });
        fileInput.style.display = 'none';
        let lastFileName = 'visualizer-shader.glsl';

        function loadShaderFile(file) {
            if (!file) return;
            if (file.size > 500 * 1024) { els.err.className = 'avz-err'; els.err.textContent = 'File quá lớn (tối đa 500 KB): ' + file.name; return; }
            file.text().then(
                text => {
                    els.code.value = text.replace(/^\uFEFF/, '');
                    els.preset.value = ''; lastFileName = file.name; applyFromEditor();
                    els.err.textContent = 'Đã tải ' + file.name + ' — ' + els.err.textContent;
                },
                () => { els.err.className = 'avz-err'; els.err.textContent = 'Không đọc được file: ' + file.name; }
            );
        }

        fileInput.addEventListener('change', () => { loadShaderFile(fileInput.files[0]); fileInput.value = ''; });
        const btnFile = h('button', { class: 'avz-btn alt', text: 'Load file…', onclick: () => fileInput.click() });

        function saveShaderFile() {
            const blob = new Blob([els.code.value], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = lastFileName;
            document.body.appendChild(a); a.click(); a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            els.err.className = 'avz-err ok'; els.err.textContent = 'Đã lưu ' + lastFileName;
        }
        const btnSave = h('button', { class: 'avz-btn alt', text: 'Save file', onclick: saveShaderFile });

        const btnSaveProject = h('button', {
            class: 'avz-btn', text: 'Save to project',
            onclick: () => {
                const ok1 = saveShaderToProject(els.code.value);
                const ok2 = saveSettingsToProject();
                const ok = ok1 && ok2;
                els.err.className = ok ? 'avz-err ok' : 'avz-err';
                els.err.textContent = ok ? 'Đã lưu shader + settings vào project.' : 'Không lưu được.';
            }
        });

        const btnSaveManager = h('button', {
            class: 'avz-btn', text: 'Save to Manager',
            onclick: () => {
                const name = prompt('Tên shader trong manager:', state.customShader || 'my-shader');
                if (!name) return;
                addOrUpdateShader(name, els.code.value);
                state.customShader = name; state.mode = 4;
                saveSettingsToProject(); refreshManager();
                els.err.className = 'avz-err ok'; els.err.textContent = 'Đã lưu shader "' + name + '" vào manager.';
            }
        });

        const btnClearSaved = h('button', {
            class: 'avz-btn alt', text: 'Clear saved',
            onclick: () => { clearShaderFromProject(); els.err.className = 'avz-err ok'; els.err.textContent = 'Đã xoá shader active.'; }
        });

        const mgrList = h('div', { class: 'avz-mgr-list' });
        function refreshManager() {
            mgrList.innerHTML = '';
            const arr = getShaders();
            if (arr.length === 0) {
                mgrList.appendChild(h('div', { class: 'avz-note', style: 'position:static', text: '(chưa có shader nào)' }));
            }
            arr.forEach(s => {
                const item = h('div', {
                    class: 'avz-mgr-item' + (state.customShader === s.name ? ' active' : '')
                });
                const nameEl = h('span', { text: s.name, title: s.name });
                const useBtn = h('button', { text: 'Use', style: 'background:#27ae60', onclick: (e) => {
                    e.stopPropagation();
                    state.mode = 4; state.customShader = s.name;
                    applyShaderAll(s.src); els.code.value = s.src;
                    saveSettingsToProject(); refreshManager();
                }});
                const delBtn = h('button', { text: '×', onclick: (e) => {
                    e.stopPropagation();
                    if (!confirm('Xoá shader "' + s.name + '"?')) return;
                    removeShader(s.name);
                    if (state.customShader === s.name) { state.customShader = ''; state.mode = 0; }
                    saveSettingsToProject(); refreshManager();
                    if (els.mode._rebuild) els.mode._rebuild();
                }});
                item.appendChild(nameEl); item.appendChild(useBtn); item.appendChild(delBtn);
                item.addEventListener('click', () => {
                    els.code.value = s.src; els.preset.value = ''; applyFromEditor();
                });
                mgrList.appendChild(item);
            });
            if (els.mode._rebuild) els.mode._rebuild();
        }
        refreshManager();

        els.code.addEventListener('dragover', e => e.preventDefault());
        els.code.addEventListener('drop', e => {
            e.preventDefault();
            if (e.dataTransfer && e.dataTransfer.files.length) loadShaderFile(e.dataTransfer.files[0]);
        });

        const btnApply = h('button', { class: 'avz-btn', text: 'Apply (Ctrl+Enter)', onclick: applyFromEditor });
        const btnReset = h('button', {
            class: 'avz-btn alt', text: 'Reset shader',
            onclick: () => { els.code.value = DEFAULT_FRAG; applyFromEditor(); }
        });

        const btnLoadPro = h('button', {
            class: 'avz-btn', text: 'Load Pro shader',
            title: 'Lấy shader tương đương Visualizer Pro đang chạy',
            onclick: () => {
                els.code.value = buildProEquivalentShader();
                applyFromEditor();
            }
        });

        const btnCopy = h('button', {
            class: 'avz-btn alt', text: 'Copy settings',
            onclick: () => {
                const json = JSON.stringify({
                    mode: MODE_NAMES[state.mode] || 'bars',
                    customShader: state.customShader,
                    color1: rgbToHex(state.color1), color2: rgbToHex(state.color2),
                    sensitivity: Math.round(state.gain * 100), opacity: Math.round(state.opacity * 100),
                    smoothing: state.smoothing, area: state.area, shader: state.shaderSrc
                }, null, 2);
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(json).then(() => alert('Đã copy.'), () => prompt('Copy:', json));
                } else prompt('Copy:', json);
            }
        });
        const btnLoad = h('button', {
            class: 'avz-btn alt', text: 'Load settings',
            onclick: () => {
                const text = prompt('Dán JSON settings:');
                if (!text) return;
                try { loadSettings(JSON.parse(text)); } catch (e) { alert('JSON lỗi: ' + e.message); }
            }
        });

        const closeBtn = h('button', { class: 'avz-x', text: '×', title: 'Đóng' });
        const head = h('div', { class: 'avz-head' }, h('span', { text: 'Visualizer Editor' }), closeBtn);
        let drag = null;
        head.addEventListener('pointerdown', e => {
            if (e.target === closeBtn) return;
            const r = root.getBoundingClientRect();
            drag = { dx: e.clientX - r.left, dy: e.clientY - r.top };
            head.setPointerCapture(e.pointerId);
        });
        head.addEventListener('pointermove', e => {
            if (!drag) return;
            root.style.left = clamp(e.clientX - drag.dx, 0, window.innerWidth - 60) + 'px';
            root.style.top = clamp(e.clientY - drag.dy, 0, window.innerHeight - 40) + 'px';
            root.style.right = 'auto';
        });
        head.addEventListener('pointerup', () => (drag = null));
        closeBtn.addEventListener('click', closeEditor);

        const left = h('div', { class: 'avz-col avz-left' },
            previewBox,
            row('Hiển thị', els.visible),
            row('Style', els.mode),
            row('Màu 1', els.c1),
            row('Màu 2', els.c2),
            row('Độ nhạy', ...sSens),
            row('Độ trong suốt', ...sOp),
            row('Độ mượt', ...sSm),
            aRow1, aRow2
        );

        const right = h('div', { class: 'avz-col avz-right' },
            h('div', { class: 'avz-sec', text: 'Shader Manager' }),
            mgrList,
            h('div', { class: 'avz-row' }, btnSaveManager, btnClearSaved),
            h('div', { class: 'avz-sec', text: 'Shader (GLSL fragment)' }),
            h('div', { class: 'avz-row' }, els.preset, btnFile, btnSave, btnSaveProject, fileInput),
            els.code,
            h('div', { class: 'avz-row' }, btnApply, btnReset, btnLoadPro),
            els.err,
            h('div', { class: 'avz-row' }, btnCopy, btnLoad)
        );

        const body = h('div', { class: 'avz-body' }, left, right);
        const root = h('div', { class: 'avz-panel' }, style, head, body);

        ['keydown', 'keyup', 'keypress'].forEach(t => root.addEventListener(t, e => e.stopPropagation()));
        document.body.appendChild(root);

        return { root, els, refreshManager };
    }

    function loadSettings(o) {
        if (o.mode in MODES) state.mode = MODES[o.mode];
        else if (typeof o.mode === 'string' && MODE_NAMES.includes(o.mode)) state.mode = MODES[o.mode];
        if (typeof o.customShader === 'string') state.customShader = o.customShader;
        if (o.color1) state.color1 = colorToRgb(o.color1);
        if (o.color2) state.color2 = colorToRgb(o.color2);
        if (typeof o.sensitivity === 'number') state.gain = clamp(o.sensitivity, 0, 1000) / 100;
        if (typeof o.opacity === 'number') state.opacity = clamp(o.opacity, 0, 100) / 100;
        if (typeof o.smoothing === 'number') setSmoothing(o.smoothing);
        if (o.area) {
            state.area = {
                x: Cast.toNumber(o.area.x), y: Cast.toNumber(o.area.y),
                w: clamp(Cast.toNumber(o.area.w), 1, 100), h: clamp(Cast.toNumber(o.area.h), 1, 100)
            };
            applyLayout();
        }
        if (typeof o.shader === 'string') {
            if (main || preview) {
                const err = applyShaderAll(o.shader);
                if (err) alert('Shader lỗi:\n' + err);
            } else state.shaderSrc = o.shader;
            saveShaderToProject(o.shader);
        }
        if (state.mode === 4 && state.customShader) {
            const found = findShader(state.customShader);
            if (found) applyShaderAll(found.src);
        }
        saveSettingsToProject();
        syncEditor(true);
    }

    function syncEditor(includeCode) {
        if (!editor) return;
        const e = editor.els;
        e.visible.checked = state.visible;
        if (e.mode._rebuild) e.mode._rebuild();
        e.c1.value = rgbToHex(state.color1);
        e.c2.value = rgbToHex(state.color2);
        e.gain.value = String(Math.round(state.gain * 100));
        e.gainVal.textContent = e.gain.value + '%';
        e.opacity.value = String(Math.round(state.opacity * 100));
        e.opacityVal.textContent = e.opacity.value + '%';
        e.smoothing.value = String(Math.round(state.smoothing));
        e.smoothingVal.textContent = e.smoothing.value + '%';
        e.areax.value = String(state.area.x);
        e.areay.value = String(state.area.y);
        e.areaw.value = String(state.area.w);
        e.areah.value = String(state.area.h);
        if (includeCode || !e.code.value) e.code.value = state.shaderSrc;
        if (editor.refreshManager) editor.refreshManager();
    }

    function openEditor() {
        if (!editor) editor = buildEditor();

        if (!autoLoadedProShader) {
            autoLoadedProShader = true;
            const proSrc = buildProEquivalentShader();
            if (editor.els.code && !editor.els.code.value.trim()) {
                editor.els.code.value = proSrc;
            }
        }

        editor.root.style.display = 'flex';
        syncEditor(true);
        ensureLoop();
    }

    function closeEditor() {
        if (editor) editor.root.style.display = 'none';
    }


    let offscreenCanvas = null;
    let ctx = null;
    let running = false;
    let mode = 'both';
    let waveColor = '#00ffcc';
    let spectrumColor = 'FL_GRADIENT';
    let peaks = [];
    let peakDropCounters = [];
    let showPeaks = true;
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
    let stageW = 480;
    let stageH = 360;
    let posX = 0;
    let posY = 0;

    let currentBass = 0; let currentMid = 0; let currentTreble = 0;
    let shakeX = 0; let shakeY = 0;

    let proAnalyser = null;
    let proFreqData = null;
    let proTimeData = null;

    let renderer = null;
    let drawableId = null;
    let skinId = null;


    function startShaderByName(name) {
        const found = findShader(name);
        if (found) {
            state.mode = 4;
            state.customShader = name;
            applyShaderAll(found.src);
            saveSettingsToProject();
            syncEditor();
            show();
        } else {
            console.warn('[Audio Visualizer] Không tìm thấy shader: ' + name);
            state.mode = 4;
            state.customShader = '';
            applyShaderAll(DEFAULT_FRAG);
            show();
        }
    }

    // Global AudioContext Unlocker
    function unlockAudio() {
        const engine = Scratch.vm.runtime.audioEngine;
        if (engine && engine.audioContext && engine.audioContext.state === 'suspended') {
            engine.audioContext.resume().catch(() => {});
        }
    }
    document.addEventListener('click', unlockAudio);
    document.addEventListener('touchstart', unlockAudio);
    document.addEventListener('keydown', unlockAudio);

    class WebGLAudioVisualizer {
        getInfo() {
            return {
                id: 'Visualizer',
                name: 'Visualizer plus',
                color1: '#007694',
                color2: '#00657e',
                color3: '#005e75',
              blocks: [
                    { blockType: Scratch.BlockType.LABEL, text: 'Core Controls' },
                    { opcode: 'startWaveform', blockType: Scratch.BlockType.COMMAND, text: 'start waveform' },
                    { opcode: 'startSpectrum', blockType: Scratch.BlockType.COMMAND, text: 'start spectrum' },
                    { opcode: 'startBoth', blockType: Scratch.BlockType.COMMAND, text: 'start both visualizers' },
                    { opcode: 'stop', blockType: Scratch.BlockType.COMMAND, text: 'stop visualizer' },
                    '---',
                    { blockType: Scratch.BlockType.LABEL, text: 'Display Settings' },
                    { opcode: 'setSize', blockType: Scratch.BlockType.COMMAND, text: 'set visualizer size [NUM] %', arguments: { NUM: { type: Scratch.ArgumentType.NUMBER, defaultValue: 100 } } },
                    { opcode: 'setPosition', blockType: Scratch.BlockType.COMMAND, text: 'go to x: [X] y: [Y]', arguments: { X: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 }, Y: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 } } },
                    { opcode: 'setLayer', blockType: Scratch.BlockType.COMMAND, text: 'go to [LAYER] layer', arguments: { LAYER: { type: Scratch.ArgumentType.STRING, menu: 'menuLayer', defaultValue: 'front' } } },
                    '---',
                    { blockType: Scratch.BlockType.LABEL, text: 'Spectrum & Wave Config' },
                    { opcode: 'barcount', blockType: Scratch.BlockType.COMMAND, text: 'set number of bars [AMOUNT]', arguments: { AMOUNT: { type: Scratch.ArgumentType.NUMBER, defaultValue: 52 } } },
                    { opcode: 'setSmoothing', blockType: Scratch.BlockType.COMMAND, text: 'set audio smoothing to [NUM]', arguments: { NUM: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0.8 } } },
                    { opcode: 'setSpectrumShape', blockType: Scratch.BlockType.COMMAND, text: 'change spectrum shape to [SHAPE]', arguments: { SHAPE: { type: Scratch.ArgumentType.STRING, menu: 'menuShape', defaultValue: 'linear' } } },
                    { opcode: 'setWaveStyle', blockType: Scratch.BlockType.COMMAND, text: 'change waveform style to [WSTYLE]', arguments: { WSTYLE: { type: Scratch.ArgumentType.STRING, menu: 'menuWaveStyle', defaultValue: 'line' } } },
                    { opcode: 'setSpectrumAnchor', blockType: Scratch.BlockType.COMMAND, text: 'set spectrum anchor to [ANCHOR]', arguments: { ANCHOR: { type: Scratch.ArgumentType.STRING, menu: 'menuAnchor', defaultValue: 'bottom' } } },
                    { opcode: 'setBarStyle', blockType: Scratch.BlockType.COMMAND, text: 'change bar style to [STYLE]', arguments: { STYLE: { type: Scratch.ArgumentType.STRING, menu: 'menuStyle', defaultValue: 'solid' } } },
                    { opcode: 'setCircleBarMode', blockType: Scratch.BlockType.COMMAND, text: 'set circle bars [CMODE]', arguments: { CMODE: { type: Scratch.ArgumentType.STRING, menu: 'menuCircleMode', defaultValue: 'outer' } } },
                    { opcode: 'setMirror', blockType: Scratch.BlockType.COMMAND, text: 'set mirror style [STATE]', arguments: { STATE: { type: Scratch.ArgumentType.STRING, menu: 'menuToggle', defaultValue: 'false' } } },
                    { opcode: 'setPeaks', blockType: Scratch.BlockType.COMMAND, text: 'show bar peaks [STATE]', arguments: { STATE: { type: Scratch.ArgumentType.STRING, menu: 'menuToggle', defaultValue: 'true' } } },
                    '---',
                    { blockType: Scratch.BlockType.LABEL, text: 'Colors & Effects' },
                    { opcode: 'setWaveColor', blockType: Scratch.BlockType.COMMAND, text: 'set waveform color [COLOR]', arguments: { COLOR: { type: Scratch.ArgumentType.COLOR, defaultValue: '#00ffcc' } } },
                    { opcode: 'setSpectrumColor', blockType: Scratch.BlockType.COMMAND, text: 'set spectrum color [COLOR]', arguments: { COLOR: { type: Scratch.ArgumentType.STRING, defaultValue: 'FL_GRADIENT' } } },
                    { opcode: 'setMotionTrail', blockType: Scratch.BlockType.COMMAND, text: 'set motion trail [STATE]', arguments: { STATE: { type: Scratch.ArgumentType.STRING, menu: 'menuToggle', defaultValue: 'false' } } },
                    { opcode: 'setBassDrop', blockType: Scratch.BlockType.COMMAND, text: 'set bass drop effect [STATE]', arguments: { STATE: { type: Scratch.ArgumentType.STRING, menu: 'menuToggle', defaultValue: 'false' } } },
                    { opcode: 'setPulse', blockType: Scratch.BlockType.COMMAND, text: 'set bass pulse intensity [NUM]', arguments: { NUM: { type: Scratch.ArgumentType.NUMBER, defaultValue: 3 } } },
                    { opcode: 'setParticleStyle', blockType: Scratch.BlockType.COMMAND, text: 'set particle style [PSTYLE]', arguments: { PSTYLE: { type: Scratch.ArgumentType.STRING, menu: 'menuPStyle', defaultValue: 'none' } } },
                    '---',
                    { blockType: Scratch.BlockType.LABEL, text: 'Reporters & Data' },
                    { opcode: 'setSensitivity', blockType: Scratch.BlockType.COMMAND, text: 'set visualizer sensitivity [NUM]', arguments: { NUM: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1.0 } } },
                    { opcode: 'getAudioValue', blockType: Scratch.BlockType.REPORTER, text: 'get [TYPE] value', arguments: { TYPE: { type: Scratch.ArgumentType.STRING, menu: 'menuAudioType', defaultValue: 'bass' } } },
                    { opcode: 'isBeatDetected', blockType: Scratch.BlockType.BOOLEAN, text: 'is beat detected?' },
                    '---',
                    { blockType: Scratch.BlockType.LABEL, text: 'Shader' },
                    { opcode: 'startShader', blockType: Scratch.BlockType.COMMAND, text: 'start shader [NAME]', arguments: { NAME: { type: Scratch.ArgumentType.STRING, defaultValue: 'my-shader' } } },
                    { opcode: 'openEditor', blockType: Scratch.BlockType.COMMAND, text: 'open visualizer editor' },
                    { opcode: 'closeEditor', blockType: Scratch.BlockType.COMMAND, text: 'close visualizer editor' },
                    { opcode: 'saveShaderNamed', blockType: Scratch.BlockType.COMMAND, text: 'save current shader as [NAME] into project', arguments: { NAME: { type: Scratch.ArgumentType.STRING, defaultValue: 'my-shader' } } },
                    { opcode: 'useShaderNamed', blockType: Scratch.BlockType.COMMAND, text: 'use saved shader [NAME]', arguments: { NAME: { type: Scratch.ArgumentType.STRING, defaultValue: 'my-shader' } } },
                    { opcode: 'deleteShaderNamed', blockType: Scratch.BlockType.COMMAND, text: 'delete saved shader [NAME]', arguments: { NAME: { type: Scratch.ArgumentType.STRING, defaultValue: 'my-shader' } } }
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
                if (!engine || !engine.audioContext || !engine.inputNode) return false;
                const audioCtx = engine.audioContext;
                if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});

                proAnalyser = audioCtx.createAnalyser();
                proAnalyser.fftSize = 1024;
                proAnalyser.smoothingTimeConstant = 0.8;
                engine.inputNode.connect(proAnalyser);

                const bufferLength = proAnalyser.frequencyBinCount;
                proFreqData = new Uint8Array(bufferLength);
                proTimeData = new Uint8Array(proAnalyser.fftSize);
                peaks = new Array(bufferLength).fill(0);
                peakDropCounters = new Array(bufferLength).fill(0);

                this.updateStageSize();
                this.initParticles();
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
            if (!renderer) return;
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
            if (!proAnalyser) { if (!this.hookAudio()) return; }
            this.setupWebGLRenderer();
            if (!skinId) return;
            running = true;
            this.loop();
        }

        startShader(args) {
            const name = Cast.toString(args.NAME);
            startShaderByName(name);
        }

        stop() {
            running = false;
            if (ctx && offscreenCanvas) {
                ctx.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
                renderer.updateBitmapSkin(skinId, offscreenCanvas, 1);
            }
        }

        setSmoothing(args) { if(proAnalyser) proAnalyser.smoothingTimeConstant = Math.max(0, Math.min(0.99, Number(args.NUM))); }
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

        setSize(args) { visualizerSize = Number(args.NUM); this.updateDrawable(); }
        setPosition(args) { posX = Number(args.X); posY = Number(args.Y); this.updateDrawable(); }

        setLayer(args) {
            if (renderer && drawableId !== null) {
                if (args.LAYER === 'front') {
                    renderer.setDrawableOrder(drawableId, Infinity);
                } else {
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
            if (!proAnalyser || !proFreqData || !ctx || !offscreenCanvas || !renderer || !skinId) return;

            if (stageW !== Scratch.vm.runtime.stageWidth || stageH !== Scratch.vm.runtime.stageHeight) {
                this.updateStageSize();
            }

            try {
                proAnalyser.getByteFrequencyData(proFreqData);
            } catch (e) {
                return;
            }

            let bSum = 0, mSum = 0, tSum = 0;
            for (let i = 0; i < 8; i++) bSum += proFreqData[i];
            for (let i = 8; i < 32; i++) mSum += proFreqData[i];
            for (let i = 32; i < 96; i++) tSum += proFreqData[i];

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
                if (mode === 'spectrum' || mode === 'both') this.drawSpectrumBottom(proFreqData, currentBass);
                ctx.restore();
            }

            if (mode === 'waveform' || mode === 'both') this.drawWaveTop();
            if (mode === 'spectrum' || mode === 'both') this.drawSpectrumBottom(proFreqData, currentBass);
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
            if (!proAnalyser || !proTimeData) return;
            try {
                proAnalyser.getByteTimeDomainData(proTimeData);
            } catch (e) {
                return;
            }
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
                const sampleStep = Math.floor(proTimeData.length / totalPoints);

                for (let i = 0; i <= totalPoints; i++) {
                    const angle = (i / totalPoints) * Math.PI * 2 + imgRotation;
                    const audioIdx = Math.min(proTimeData.length - 1, i * sampleStep);
                    const waveVal = (proTimeData[audioIdx] / 128.0 - 1.0) * 25 * sensitivity;

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

            const step = stageW / proTimeData.length;
            const centerY = stageH * 0.25;

            if (waveStyle === 'line') {
                ctx.beginPath();
                let x = 0; ctx.moveTo(0, ((proTimeData[0] / 255) * (stageH * 0.5)));
                for (let i = 0; i < proTimeData.length - 1; i += 4) {
                    const x1 = x; const y1 = ((proTimeData[i] / 255) * (stageH * 0.5));
                    const x2 = x + (step * 4); const y2 = ((proTimeData[i + 1] / 255) * (stageH * 0.5));
                    ctx.quadraticCurveTo(x1, y1, (x1 + x2) / 2, (y1 + y2) / 2); x += step * 4;
                }
                ctx.stroke();
            } else {
                const sampleStep = Math.floor(proTimeData.length / 50);
                const barWidth = (stageW / 50) - 2;
                ctx.fillStyle = waveColor;
                for (let i = 0; i < 50; i++) {
                    const v = (proTimeData[i * sampleStep] / 128.0 - 1.0) * sensitivity;
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

                if (h > peaks[i]) { peaks[i] = h; peakDropCounters[i] = 0; }
                else {
                    peakDropCounters[i]++;
                    if (peakDropCounters[i] > 10) {
                        peaks[i] -= (2 + peaks[i] * 0.05);
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
                        if (showPeaks && peaks[i] > 0) {
                            ctx.fillStyle = waveColor;
                            ctx.fillRect(currentX, (direction === -1) ? baselineY - peaks[i] - 2 : baselineY + peaks[i], widthBar, 2);
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

                    if (showPeaks && peaks[i] > 0) {
                        const peakX = centerX + cos * (radius + peaks[i]); const peakY = centerY + sin * (radius + peaks[i]);
                        ctx.fillStyle = waveColor;
                        ctx.beginPath(); ctx.arc(peakX, peakY, 2, 0, Math.PI * 2); ctx.fill();
                    }

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

        openEditor() { openEditor(); }
        closeEditor() { closeEditor(); }

        saveShaderNamed(args) {
            const name = Cast.toString(args.NAME) || 'my-shader';
            addOrUpdateShader(name, state.shaderSrc);
            state.customShader = name; state.mode = 4;
            saveSettingsToProject();
            if (editor && editor.refreshManager) editor.refreshManager();
        }
        useShaderNamed(args) {
            const name = Cast.toString(args.NAME);
            const found = findShader(name);
            if (!found) return;
            state.mode = 4; state.customShader = name;
            applyShaderAll(found.src); syncEditor(); saveSettingsToProject();
        }
        deleteShaderNamed(args) {
            const name = Cast.toString(args.NAME);
            removeShader(name);
            if (state.customShader === name) { state.customShader = ''; state.mode = 0; }
            syncEditor(); saveSettingsToProject();
        }
    }

    Scratch.extensions.register(new WebGLAudioVisualizer());

    setTimeout(() => {
        try { loadSettingsFromProject(); } catch (e) {}
    }, 100);

})(Scratch);
