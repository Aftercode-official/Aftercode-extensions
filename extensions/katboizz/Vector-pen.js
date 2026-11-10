// Name: Vector Pen
// ID: VPen
// Description: Draws a Vector Pen on the stage, thank Koji Yokokawa for the code Vector pen and original code Xcratch.
// By: katboizz <https://scratch.mit.edu/users/katboizz/>
// license: MIT

(function (Scratch) {
  "use strict";

  if (!Scratch.extensions.unsandboxed) {
    throw new Error("Vector pen must run unsandboxed");
  }

  const CDN = {
    svgjs:
      "https://cdn.jsdelivr.net/npm/@svgdotjs/svg.js@3.2.4/dist/svg.min.js",
    fileSaver:
      "https://cdn.jsdelivr.net/npm/file-saver@2.0.5/dist/FileSaver.min.js",
    jspdf: "https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js",
    svg2pdf:
      "https://cdn.jsdelivr.net/npm/svg2pdf.js@2.2.4/dist/svg2pdf.umd.min.js",
  };

  const _loaded = {};
  const loadScript = (url) => {
    if (_loaded[url]) return _loaded[url];
    _loaded[url] = new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${url}"]`)) {
        resolve();
        return;
      }
      const s = document.createElement("script");
      s.src = url;
      s.onload = resolve;
      s.onerror = () => reject(new Error("Failed to load " + url));
      document.head.appendChild(s);
    });
    return _loaded[url];
  };

  const ensureLibs = async (needPdf) => {
    await loadScript(CDN.svgjs);
    await loadScript(CDN.fileSaver);
    if (needPdf) {
      await loadScript(CDN.jspdf);
      await loadScript(CDN.svg2pdf);
    }
  };

  const EXTENSION_ID = "VPen";
  const DISPLAY_STROKE_WIDTH_MIN = 0.1;
  const PEN_TYPES = { TRAIL: "trail", PLOTTER: "plotter" };
  const LINE_SHAPES = { STRAIGHT: "straight", CURVE: "curve" };
  const CHANGE_LAYER = { TOP: "top", BOTTOM: "bottom" };
  const MOVE_LAYER = { UP: "up", DOWN: "down" };
  const LINE_STYLES = { SOLID: "solid", DASHED: "dashed" };
  const SHAPES = { CIRCLE: "circle", SQUARE: "square", TRIANGLE: "triangle" };
  const FILL_STATE = { ON: "on", OFF: "off" };

  const DEFAULT_PEN_STATE = () => ({
    skinID: -1,
    drawableID: -1,
    penType: PEN_TYPES.TRAIL,
    penPath: null,
    drawing: null,
    penAttributes: {
      color3b: { r: 0, g: 0, b: 0 },
      opacity: 1,
      diameter: 1,
      lineShape: LINE_SHAPES.STRAIGHT,
      lineStyle: LINE_STYLES.SOLID,
      fillColor3b: { r: 0, g: 0, b: 0 },
      fillOpacity: 0,
      fillEnabled: false,
    },
    referencePoint: null,
    hasThinLines: false,
    _pendingSkinUpdate: null,
    isVisible: true,
  });

  const cloneSimple = (obj) => {
    if (obj === null || typeof obj !== "object") return obj;
    if (Array.isArray(obj)) return obj.map(cloneSimple);
    const out = {};
    for (const k in obj) out[k] = cloneSimple(obj[k]);
    return out;
  };
  const toNumber = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };
  const toString = (v) => String(v == null ? "" : v);
  const toRgbColorObject = (value) => {
    if (typeof value === "string" && value.startsWith("#")) {
      const hex = value.substring(1);
      if (hex.length === 6 || hex.length === 8) {
        return {
          r: parseInt(hex.substring(0, 2), 16),
          g: parseInt(hex.substring(2, 4), 16),
          b: parseInt(hex.substring(4, 6), 16),
          a: hex.length === 8 ? parseInt(hex.substring(6, 8), 16) : 255,
        };
      }
    }
    if (value && typeof value === "object" && "r" in value) return value;
    return { r: 0, g: 0, b: 0, a: 255 };
  };

  class VPenBlocks {
    constructor(runtime) {
      this.runtime = runtime;
      this._penStates = {};
      this._lastPositions = {};
      this._rafLoopRunning = false;
      this._rafHandle = null;

      const [w, h] = runtime.renderer.getNativeSize();
      this.stageWidth = w;
      this.stageHeight = h;
      this.stepPerMM = 2;

      this.onTargetMoved = this.onTargetMoved.bind(this);

      runtime.on("targetWasCreated", this.onTargetCreated.bind(this));
      runtime.on("targetWasRemoved", this.onTargetWillExit.bind(this));
      runtime.on("RUNTIME_DISPOSED", this.onRuntimeDisposed.bind(this));

      this._libsReady = ensureLibs(false).then(() => {
        this.SVG = window.SVG;
        if (!this.SVG) throw new Error("svg.js not loaded");
        return true;
      });
    }

    _startAutoUpdate() {
      if (this._rafLoopRunning) return;
      this._rafLoopRunning = true;
      const tick = () => {
        if (!this._rafLoopRunning) return;
        try {
          this._autoUpdateAll();
        } catch (e) {
          console.error("VectorPen auto-update error:", e);
        }
        this._rafHandle = requestAnimationFrame(tick);
      };
      this._rafHandle = requestAnimationFrame(tick);
    }

    _stopAutoUpdate() {
      this._rafLoopRunning = false;
      if (this._rafHandle) {
        cancelAnimationFrame(this._rafHandle);
        this._rafHandle = null;
      }
    }

    _hasActivePens() {
      for (const id in this._penStates) {
        if (this._penStates[id].penPath) return true;
      }
      return false;
    }

    _autoUpdateAll() {
      if (!this.SVG) return;
      if (!this._hasActivePens()) {
        this._stopAutoUpdate();
        return;
      }
      for (const target of this.runtime.targets) {
        if (!target || !target.isSprite || !target.isSprite()) continue;
        const ps = this._penStateFor(target);
        if (!ps || !ps.penPath) continue;
        this._autoUpdateFor(target, ps);
      }
    }

    _autoUpdateFor(target, ps) {
      const last = this._lastPositions[target.id];
      const curX = target.x,
        curY = target.y;
      if (last && last.x === curX && last.y === curY) return;

      if (ps.penType === PEN_TYPES.PLOTTER && !ps.referencePoint) {
        this._lastPositions[target.id] = { x: curX, y: curY };
        return;
      }
      if (ps.penType === PEN_TYPES.PLOTTER) this._removeReferenceLine(ps);
      ps.referencePoint = { x: curX, y: curY };

      if (ps.penAttributes.lineShape === LINE_SHAPES.CURVE) {
        this._addCurveToPenPath(ps.penPath, curX, curY);
      } else {
        this._addLineToPenPath(ps.penPath, curX, curY);
      }
      this._updatePenSkinFor(target);
      this._lastPositions[target.id] = { x: curX, y: curY };
    }

    _createDrawingSVG() {
      const c = document.createElement("div");
      return this.SVG()
        .addTo(c)
        .size(`${this.stageWidth}`, `${this.stageHeight}`)
        .viewbox(0, 0, this.stageWidth, this.stageHeight);
    }

    _penStateFor(t) {
      return this._penStates[t.id];
    }

    _getPenState(target) {
      let ps = this._penStateFor(target);
      if (!ps) {
        ps = DEFAULT_PEN_STATE();
        this._penStates[target.id] = ps;
      }
      if (!ps.drawing && this.SVG) ps.drawing = this._createDrawingSVG();
      return ps;
    }

    _getSkinIDFor(target) {
      const ps = this._getPenState(target);
      const r = this.runtime.renderer;
      if (ps.skinID < 0 && r && ps.drawing) {
        ps.skinID = r.createSVGSkin(
          this.convertSVGForPenLayer(ps.drawing.svg()),
        );
        ps.drawableID = r.createDrawable("pen");
        r.updateDrawableSkinId(ps.drawableID, ps.skinID);
        r.updateDrawableVisible(ps.drawableID, ps.isVisible);
      }
      return ps.skinID;
    }

    _updatePenSkinFor(target) {
      const ps = this._penStateFor(target);
      if (!ps || ps._pendingSkinUpdate) return;
      ps._pendingSkinUpdate = requestAnimationFrame(() => {
        ps._pendingSkinUpdate = null;
        const id = this._getSkinIDFor(target);
        if (id < 0) return;
        const svg = ps.drawing.root();
        this.runtime.renderer.updateSVGSkin(
          id,
          this.convertSVGForPenLayer(svg.svg(), ps),
        );
        this.runtime.requestRedraw();
      });
    }

    _mapToSVGViewBox(x, y) {
      return [x + this.stageWidth / 2, this.stageHeight / 2 - y];
    }

    convertSVGForPenLayer(svg, ps) {
      if (ps && !ps.hasThinLines) return svg;
      return svg.replace(/stroke-width="([^"]+)"/g, (m, w) => {
        if (parseFloat(w) < DISPLAY_STROKE_WIDTH_MIN)
          return `stroke-width="${DISPLAY_STROKE_WIDTH_MIN}"`;
        return m;
      });
    }

    _finishPen(ps) {
      if (!ps.penPath) return;
      this._removeReferenceLine(ps);
      const p = ps.penPath;
      ps.penPath = null;
      const plots = p.array();
      if (plots.length < 3) {
        if (plots.length <= 1) p.remove();
        return;
      }
      const start = plots[1][0] === "L" ? plots[0] : plots[1];
      const last = plots[plots.length - 1];
      if (Math.sqrt((start[1] - last[1]) ** 2 + (start[2] - last[2]) ** 2) > 8)
        return;
      const first = plots[1];
      if (first[0] === "Q" && last[0] === "T") {
        plots.pop();
        plots.push([...plots[1]]);
        plots[0] = ["M", ...plots[1].slice(3)];
        plots.splice(1, 1);
      }
      p.plot(plots.concat(["Z"]));
    }

    _removeReferenceLine(ps) {
      if (!ps.referencePoint) return;
      const p = ps.penPath;
      if (ps.penAttributes.lineShape === LINE_SHAPES.CURVE) {
        p.array().pop();
        const rc = p.array().pop();
        p.array().push(["T", rc[1], rc[2]]);
      } else {
        p.array().pop();
      }
      p.plot(p.array());
      ps.referencePoint = null;
    }

    _startPenPath(target) {
      const ps = this._getPenState(target);
      this._finishPen(ps);
      if (!ps.drawing) return;
      const np = ps.drawing.path([
        "M",
        ...this._mapToSVGViewBox(target.x, target.y),
      ]);
      this._applyFill(np, ps);
      np.stroke({
        width: ps.penAttributes.diameter * this.stepPerMM,
        color: ps.penAttributes.color3b,
        opacity: ps.penAttributes.opacity,
        linecap: "round",
        linejoin: "round",
        dasharray:
          ps.penAttributes.lineStyle === LINE_STYLES.DASHED ? "10,10" : "none",
      });
      if (ps.penAttributes.diameter < DISPLAY_STROKE_WIDTH_MIN)
        ps.hasThinLines = true;
      ps.penPath = np;
    }

    _addLineToPenPath(p, x, y) {
      p.array().push(["L", ...this._mapToSVGViewBox(x, y)]);
      p.plot(p.array());
    }

    _addCurveToPenPath(p, x, y) {
      const arr = p.array();
      const prev = arr[arr.length - 1];
      if (prev[0] === "T") arr.pop();
      const pp = [prev[1], prev[2]];
      const ep = this._mapToSVGViewBox(x, y);
      const cp = [(pp[0] + ep[0]) / 2, (pp[1] + ep[1]) / 2];
      arr.push(["Q", ...pp, ...cp]);
      arr.push(["T", ...ep]);
      p.plot(arr);
    }

    _applyFill(pathOrGroup, ps) {
      const a = ps.penAttributes;
      const shouldFill = a.fillEnabled && a.fillOpacity > 0;
      pathOrGroup.fill(
        shouldFill
          ? { color: a.fillColor3b, opacity: a.fillOpacity }
          : "none",
      );
    }

    _clampPenSize(n) {
      return Math.max(0, n);
    }

    _clearForTarget(target) {
      const ps = this._penStateFor(target);
      if (!ps || !ps.drawing) return;
      ps.drawing.remove();
      if (this.SVG) ps.drawing = this._createDrawingSVG();
      const was = !!ps.penPath;
      ps.penPath = null;
      ps.hasThinLines = false;
      if (was) this._startPenPath(target);
      this._updatePenSkinFor(target);
    }

    destroyPenLayerForID(id) {
      const ps = this._penStates[id];
      if (!ps) return;
      const t = this.runtime.getTargetById(id);
      if (t && t.isOriginal) {
        if (ps.drawableID >= 0)
          this.runtime.renderer.destroyDrawable(ps.drawableID, "pen");
        if (ps.skinID >= 0) this.runtime.renderer.destroySkin(ps.skinID);
      }
      delete this._penStates[id];
      delete this._lastPositions[id];
      this.runtime.requestRedraw();
    }

    onTargetWillExit(target) {
      if (this._penStateFor(target)) {
        this.penUp({}, { target });
        this.destroyPenLayerForID(target.id);
      }
    }

    onRuntimeDisposed() {
      this._stopAutoUpdate();
      Object.keys(this._penStates).forEach((id) =>
        this.destroyPenLayerForID(id),
      );
    }

    onTargetCreated(newTarget, sourceTarget) {
      if (!sourceTarget) return;
      const sourceState = this._penStateFor(sourceTarget);
      if (!sourceState) return;
      const ps = DEFAULT_PEN_STATE();
      ps.penType = sourceState.penType;
      ps.penAttributes = cloneSimple(sourceState.penAttributes);
      this._penStates[newTarget.id] = ps;
      if (sourceState.drawing) ps.drawing = sourceState.drawing.group();
    }

    onTargetMoved(target, oldX, oldY, isForce) {
      const ps = this._penStateFor(target);
      if (!ps || !ps.penPath) return;
      if (ps.penType === PEN_TYPES.TRAIL && isForce) {
        this._startPenPath(target);
        this._updatePenSkinFor(target);
        return;
      }
      if (ps.penType === PEN_TYPES.PLOTTER) this._removeReferenceLine(ps);
      ps.referencePoint = { x: target.x, y: target.y };
      if (ps.penAttributes.lineShape === LINE_SHAPES.CURVE) {
        this._addCurveToPenPath(ps.penPath, target.x, target.y);
      } else {
        this._addLineToPenPath(ps.penPath, target.x, target.y);
      }
      this._updatePenSkinFor(target);
    }

    async _ensureReady() {
      if (!this.SVG) await this._libsReady;
    }

    async penDown(args, util) {
      await this._ensureReady();
      const target = util.target;
      const ps = this._getPenState(target);
      if (ps.penPath) {
        if (ps.penType === args.PEN_TYPE) return;
        this.penUp(args, util);
      }
      ps.penType = args.PEN_TYPE;
      if (ps.penType === PEN_TYPES.TRAIL) this._startPenPath(target);
      this._updatePenSkinFor(target);
      this._lastPositions[target.id] = { x: target.x, y: target.y };
      this._startAutoUpdate();
    }

    penUp(args, util) {
      const target = util.target;
      const ps = this._penStateFor(target);
      if (!ps || !ps.penPath) return;
      this._finishPen(ps);
      this._updatePenSkinFor(target);
    }

    async plot(args, util) {
      await this._ensureReady();
      const target = util.target;
      const ps = this._getPenState(target);
      if (ps.penPath) {
        if (ps.penType === PEN_TYPES.TRAIL) return;
      } else {
        ps.penType = PEN_TYPES.PLOTTER;
        this._startPenPath(target);
        this._updatePenSkinFor(target);
      }
      ps.referencePoint = null;
      this._lastPositions[target.id] = { x: target.x, y: target.y };
      this._startAutoUpdate();
    }

    setPenColorToColor(args, util) {
      const ps = this._getPenState(util.target);
      const c = toRgbColorObject(args.COLOR);
      const op = 1 - (c.a != null ? c.a : 0) / 255;
      if (
        ps.penAttributes.color3b.r === c.r &&
        ps.penAttributes.color3b.g === c.g &&
        ps.penAttributes.color3b.b === c.b &&
        ps.penAttributes.opacity === op
      )
        return;
      ps.penAttributes.color3b = { r: c.r, g: c.g, b: c.b };
      ps.penAttributes.opacity = op;
      if (ps.penPath) this._startPenPath(util.target);
    }

    setPenOpacity(args, util) {
      const ps = this._getPenState(util.target);
      const v = Math.max(0, Math.min(1, toNumber(args.OPACITY) / 100));
      if (ps.penAttributes.opacity === v) return;
      ps.penAttributes.opacity = v;
      if (ps.penPath) this._startPenPath(util.target);
    }

    setPenSizeTo(args, util) {
      const ps = this._getPenState(util.target);
      const v = this._clampPenSize(toNumber(args.SIZE));
      if (ps.penAttributes.diameter === v) return;
      ps.penAttributes.diameter = v;
      if (ps.penPath) this._startPenPath(util.target);
    }

    setLineShape(args, util) {
      const ps = this._getPenState(util.target);
      if (ps.penAttributes.lineShape === args.LINE_SHAPE) return;
      ps.penAttributes.lineShape = args.LINE_SHAPE;
    }

    setFillEnabled(args, util) {
      const ps = this._getPenState(util.target);
      const v = args.STATE === FILL_STATE.ON;
      if (ps.penAttributes.fillEnabled === v) return;
      ps.penAttributes.fillEnabled = v;
      if (ps.penPath) {
        this._applyFill(ps.penPath, ps);
        this._updatePenSkinFor(util.target);
      }
    }

    setFillColorToColor(args, util) {
      const ps = this._getPenState(util.target);
      const c = toRgbColorObject(args.COLOR);
      const op = 1 - (c.a != null ? c.a : 0) / 255;
      if (
        ps.penAttributes.fillColor3b.r === c.r &&
        ps.penAttributes.fillColor3b.g === c.g &&
        ps.penAttributes.fillColor3b.b === c.b &&
        ps.penAttributes.fillOpacity === op
      )
        return;
      ps.penAttributes.fillColor3b = { r: c.r, g: c.g, b: c.b };
      ps.penAttributes.fillOpacity = op;
      if (op > 0) ps.penAttributes.fillEnabled = true;
      if (ps.penPath) {
        this._applyFill(ps.penPath, ps);
        this._updatePenSkinFor(util.target);
      }
    }

    setFillOpacity(args, util) {
      const ps = this._getPenState(util.target);
      const v = Math.max(0, Math.min(1, toNumber(args.OPACITY) / 100));
      if (ps.penAttributes.fillOpacity === v) return;
      ps.penAttributes.fillOpacity = v;
      if (ps.penPath) {
        this._applyFill(ps.penPath, ps);
        this._updatePenSkinFor(util.target);
      }
    }

    _moveLayerToFront(id) {
      const r = this.runtime.renderer;
      const top = r._layerGroups["sprite"].drawListOffset - 1;
      r.setDrawableOrder(id, top, "pen", false);
    }
    _moveLayerToBack(id) {
      this.runtime.renderer.setDrawableOrder(id, -Infinity, "pen", false);
    }
    _moveLayerUp(id, n) {
      const r = this.runtime.renderer;
      const o = r.getDrawableOrder(id);
      const top = r._layerGroups["sprite"].drawListOffset - 1;
      n = Math.min(n, top - o);
      r.setDrawableOrder(id, n, "pen", true);
    }
    _moveLayerDown(id, n) {
      this._moveLayerUp(id, -n);
    }

    changeLayerTo(args, util) {
      const ps = this._getPenState(util.target);
      if (ps.drawableID < 0) return;
      if (args.LAYER === CHANGE_LAYER.TOP)
        this._moveLayerToFront(ps.drawableID);
      else if (args.LAYER === CHANGE_LAYER.BOTTOM)
        this._moveLayerToBack(ps.drawableID);
      this.runtime.requestRedraw();
    }

    moveLayerBy(args, util) {
      const ps = this._getPenState(util.target);
      if (ps.drawableID < 0) return;
      const n = toNumber(args.LAYERS);
      if (args.DIRECTION === MOVE_LAYER.UP) this._moveLayerUp(ps.drawableID, n);
      else if (args.DIRECTION === MOVE_LAYER.DOWN)
        this._moveLayerDown(ps.drawableID, n);
      this.runtime.requestRedraw();
    }

    showDrawing(_a, util) {
      const ps = this._getPenState(util.target);
      if (ps.isVisible) return;
      ps.isVisible = true;
      if (ps.drawableID >= 0) {
        this.runtime.renderer.updateDrawableVisible(ps.drawableID, true);
        this.runtime.requestRedraw();
      }
    }

    hideDrawing(_a, util) {
      const ps = this._getPenState(util.target);
      if (!ps.isVisible) return;
      ps.isVisible = false;
      if (ps.drawableID >= 0) {
        this.runtime.renderer.updateDrawableVisible(ps.drawableID, false);
        this.runtime.requestRedraw();
      }
    }

    isDrawingShown(_a, util) {
      const ps = this._penStateFor(util.target);
      return ps ? ps.isVisible : true;
    }

    isFillEnabled(_a, util) {
      const ps = this._penStateFor(util.target);
      return ps ? ps.penAttributes.fillEnabled : false;
    }

    clear(_a, util) {
      this._clearForTarget(util.target);
    }
    clearAll() {
      this.runtime.targets.forEach((t) => this._clearForTarget(t));
    }

    eraseLast(_a, util) {
      const ps = this._penStateFor(util.target);
      if (ps && ps.drawing) {
        const kids = ps.drawing.children();
        if (kids.length > 0) {
          kids[kids.length - 1].remove();
          this._updatePenSkinFor(util.target);
        }
      }
    }

    getStepPerMM() {
      return this.stepPerMM;
    }
    stepForMM(args) {
      return toNumber(args.MM) * this.stepPerMM;
    }
    mmForStep(args) {
      return toNumber(args.STEP) / this.stepPerMM;
    }
    setStepPerMM(args) {
      this.stepPerMM = toNumber(args.STEP_PER_MM);
    }

    async stamp(args, util) {
      await this._ensureReady();
      const target = util.target;
      const r = this.runtime.renderer;
      const tid = r.createDrawable("sprite");
      const cos = target.sprite.costumes[target.currentCostume];
      r.updateDrawableSkinId(tid, cos.skinId);
      for (const n in target.effects) {
        if (Object.prototype.hasOwnProperty.call(target.effects, n))
          r.updateDrawableEffect(tid, n, target.effects[n]);
      }
      const rs = 2;
      let fd = target.direction;
      let fsc = [100 * rs, 100 * rs];
      if (target.rotationStyle === "don't rotate") fd = 90;
      else if (target.rotationStyle === "left-right") {
        fd = 90;
        const f = target.direction < 0 ? -1 : 1;
        fsc = [f * 100 * rs, 100 * rs];
      }
      r.updateDrawableDirectionScale(tid, fd, fsc);
      r.updateDrawableVisible(tid, true);
      r.updateDrawablePosition(tid, [0, 0]);
      const dd = r.extractDrawableScreenSpace(tid);
      r.destroyDrawable(tid, "sprite");
      const cv = document.createElement("canvas");
      cv.width = dd.imageData.width;
      cv.height = dd.imageData.height;
      cv.getContext("2d").putImageData(dd.imageData, 0, 0);
      const url = cv.toDataURL();
      const ps = this._getPenState(target);
      const img = ps.drawing.image(url);
      const cw = r.canvas.clientWidth,
        ch = r.canvas.clientHeight;
      const sr = [cw / this.stageWidth, ch / this.stageHeight];
      const nW = dd.width / sr[0] / rs,
        nH = dd.height / sr[1] / rs;
      const pX = cw / 2 - dd.x,
        pY = ch / 2 - dd.y;
      const nPX = pX / sr[0] / rs,
        nPY = pY / sr[1] / rs;
      const sz = target.size / 100;
      const fW = nW * sz,
        fH = nH * sz;
      const fPX = nPX * sz,
        fPY = nPY * sz;
      img.size(fW, fH);
      const [cx, cy] = this._mapToSVGViewBox(target.x, target.y);
      img.move(cx - fPX, cy - fPY);
      img.opacity((100 - (target.effects.ghost || 0)) / 100);
      this._updatePenSkinFor(target);
    }

    _saveSVGAsFile(svg, name) {
      const d = svg
        .size(
          `${this.stageWidth / this.stepPerMM}mm`,
          `${this.stageHeight / this.stepPerMM}mm`,
        )
        .svg();
      window.saveAs(
        new Blob([d], { type: "application/octet-stream" }),
        `${name}.svg`,
      );
    }

    setLineStyle(args, util) {
      const ps = this._getPenState(util.target);
      if (ps.penAttributes.lineStyle === args.STYLE) return;
      ps.penAttributes.lineStyle = args.STYLE;
      if (ps.penPath) {
        ps.penPath.stroke({
          dasharray: args.STYLE === "dashed" ? "10,10" : "none",
        });
        this._updatePenSkinFor(util.target);
      }
    }

    async drawShape(args, util) {
      await this._ensureReady();
      const target = util.target;
      const ps = this._getPenState(target);
      const shape = args.SHAPE;
      const radius = toNumber(args.RADIUS);

      let cx = target.x;
      let cy = target.y;
      let pathData = [];

      if (shape === SHAPES.CIRCLE) {
        const r = radius;
        const k = 0.552284749831 * r;
        pathData = [
          ["M", ...this._mapToSVGViewBox(cx, cy - r)],
          [
            "C",
            ...this._mapToSVGViewBox(cx + k, cy - r),
            ...this._mapToSVGViewBox(cx + r, cy - k),
            ...this._mapToSVGViewBox(cx + r, cy),
          ],
          [
            "C",
            ...this._mapToSVGViewBox(cx + r, cy + k),
            ...this._mapToSVGViewBox(cx + k, cy + r),
            ...this._mapToSVGViewBox(cx, cy + r),
          ],
          [
            "C",
            ...this._mapToSVGViewBox(cx - k, cy + r),
            ...this._mapToSVGViewBox(cx - r, cy + k),
            ...this._mapToSVGViewBox(cx - r, cy),
          ],
          [
            "C",
            ...this._mapToSVGViewBox(cx - r, cy - k),
            ...this._mapToSVGViewBox(cx - k, cy - r),
            ...this._mapToSVGViewBox(cx, cy - r),
          ],
          ["Z"],
        ];
      } else if (shape === SHAPES.SQUARE) {
        pathData = [
          ["M", ...this._mapToSVGViewBox(cx - radius, cy - radius)],
          ["L", ...this._mapToSVGViewBox(cx + radius, cy - radius)],
          ["L", ...this._mapToSVGViewBox(cx + radius, cy + radius)],
          ["L", ...this._mapToSVGViewBox(cx - radius, cy + radius)],
          ["Z"],
        ];
      } else if (shape === SHAPES.TRIANGLE) {
        const h = radius * Math.sqrt(3);
        pathData = [
          ["M", ...this._mapToSVGViewBox(cx, cy + radius)],
          ["L", ...this._mapToSVGViewBox(cx - h / 2, cy - radius / 2)],
          ["L", ...this._mapToSVGViewBox(cx + h / 2, cy - radius / 2)],
          ["Z"],
        ];
      }

      const np = ps.drawing.path(pathData);
      this._applyFill(np, ps);
      np.stroke({
        width: ps.penAttributes.diameter * this.stepPerMM,
        color: ps.penAttributes.color3b,
        opacity: ps.penAttributes.opacity,
        linecap: "round",
        linejoin: "round",
        dasharray:
          ps.penAttributes.lineStyle === LINE_STYLES.DASHED ? "10,10" : "none",
      });
      if (ps.penAttributes.diameter < DISPLAY_STROKE_WIDTH_MIN)
        ps.hasThinLines = true;

      this._updatePenSkinFor(target);
    }

    async addNode(args, util) {
      await this._ensureReady();
      const target = util.target;
      const ps = this._getPenState(target);
      const x = toNumber(args.X);
      const y = toNumber(args.Y);

      if (!ps.penPath) {
        ps.penType = PEN_TYPES.PLOTTER;
        ps.referencePoint = { x: x, y: y };
        this._startPenPath(target);
        const arr = ps.penPath.array();
        if (arr.length > 0 && arr[0][0] === "M") {
          arr[0] = ["M", ...this._mapToSVGViewBox(x, y)];
          ps.penPath.plot(arr);
        }
      } else {
        if (ps.penType === PEN_TYPES.TRAIL) return;
        this._addLineToPenPath(ps.penPath, x, y);
      }
      this._updatePenSkinFor(target);
    }

    async _savePDFAsFile(svg, name) {
      try {
        const w = this.stageWidth / this.stepPerMM,
          h = this.stageHeight / this.stepPerMM;
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
          orientation: w > h ? "landscape" : "portrait",
          unit: "mm",
          format: [w, h],
        });
        const str = svg.size(`${w}mm`, `${h}mm`).svg();
        const doc = new DOMParser().parseFromString(
          str,
          "image/svg+xml",
        ).documentElement;
        await pdf.svg(doc, { x: 0, y: 0, width: w, height: h });
        pdf.save(`${name}.pdf`);
        return "saved";
      } catch (e) {
        console.error("PDF error:", e);
        return "error";
      }
    }

    _addSpriteDrawingTo(target, cont, opt = {}) {
      const { includeHidden = false } = opt;
      const ps = this._penStateFor(target);
      if (!ps || !ps.drawing) return null;
      if (!ps.isVisible && !includeHidden) return null;
      const kids = ps.drawing.children();
      if (kids.length === 0) return null;
      const g = cont.group();
      g.id(target.sprite.name);
      if (!ps.isVisible) g.attr("style", "display:none");
      kids.forEach((c) => g.add(c.clone()));
      return g;
    }

    async loadSVG(args, util) {
      await this._ensureReady();
      const target = util.target;
      const ps = this._getPenState(target);

      const svgCode = toString(args.SVG_CODE).trim();
      if (!svgCode) return "empty svg";

      let svgEl;
      try {
        const parsed = new DOMParser().parseFromString(
          svgCode,
          "image/svg+xml",
        );
        svgEl = parsed.documentElement;
        if (!svgEl || svgEl.nodeName.toLowerCase() !== "svg") {
          return "invalid svg";
        }
        if (parsed.querySelector("parsererror")) return "parse error";
      } catch (e) {
        console.error("SVG parse error:", e);
        return "parse error";
      }

      try {
        svgEl.querySelectorAll("script, foreignObject").forEach((n) =>
          n.remove(),
        );
        svgEl.querySelectorAll("*").forEach((n) => {
          Array.from(n.attributes).forEach((a) => {
            const name = a.name.toLowerCase();
            if (name.startsWith("on")) n.removeAttribute(a.name);
            else if (
              (name === "href" || name === "xlink:href") &&
              a.value.trim().toLowerCase().startsWith("javascript:")
            ) {
              n.removeAttribute(a.name);
            }
          });
        });
      } catch (e) {
        console.warn("SVG sanitize error:", e);
      }

      if (!svgEl.getAttribute("viewBox")) {
        const w = parseFloat(svgEl.getAttribute("width")) || this.stageWidth;
        const h = parseFloat(svgEl.getAttribute("height")) || this.stageHeight;
        svgEl.setAttribute("viewBox", `0 0 ${w} ${h}`);
      }

      svgEl.removeAttribute("width");
      svgEl.removeAttribute("height");

      const group = ps.drawing.group();

      try {
        const node = document.importNode(svgEl, true);
        node.setAttribute("width", String(this.stageWidth));
        node.setAttribute("height", String(this.stageHeight));
        if (!node.getAttribute("preserveAspectRatio"))
          node.setAttribute("preserveAspectRatio", "xMidYMid meet");
        group.add(node);
      } catch (e) {
        console.error("Failed to add SVG node:", e);
        group.remove();
        return "error";
      }

      const a = ps.penAttributes;
      if (!a.fillEnabled) {
        try {
          group.select("*").forEach((el) => {
            if (el.attr && typeof el.attr === "function") {
              el.attr("fill", "none");
            }
          });
        } catch (e) {
          console.warn("fill off apply error:", e);
        }
      }

      const pos = args.POS || "stage";
      if (pos === "sprite") {
        try {
          const bbox = group.bbox();
          const [cx, cy] = this._mapToSVGViewBox(target.x, target.y);
          group.move(cx - bbox.width / 2, cy - bbox.height / 2);
        } catch (e) {
          console.warn("bbox failed:", e);
        }
      }

      this._updatePenSkinFor(target);
      return "loaded";
    }

    async downloadSpriteDrawing(args, util) {
      await this._ensureReady();
      const target = util.target;
      let name = toString(args.FILENAME) || target.sprite.name;
      const fmt = args.FORMAT || "svg";
      const ps = this._penStateFor(target);
      if (!ps || !ps.drawing) return "no drawing";
      if (fmt === "pdf") await ensureLibs(true);
      const out = this._createDrawingSVG();
      this._addSpriteDrawingTo(target, out, { includeHidden: fmt !== "pdf" });
      if (fmt === "pdf") return this._savePDFAsFile(out, name);
      this._saveSVGAsFile(out, name);
      return "saved";
    }

    async downloadAllDrawing(args) {
      await this._ensureReady();
      let name = toString(args.FILENAME) || "vpen";
      const fmt = args.FORMAT || "svg";
      if (fmt === "pdf") await ensureLibs(true);
      const out = this._createDrawingSVG();
      const incH = fmt !== "pdf";
      const targets = this.runtime.targets
        .filter((t) => t.isSprite())
        .sort((a, b) => {
          const oa = this._penStateFor(a),
            ob = this._penStateFor(b);
          const da =
            oa && oa.drawableID >= 0
              ? this.runtime.renderer.getDrawableOrder(oa.drawableID)
              : -1;
          const db =
            ob && ob.drawableID >= 0
              ? this.runtime.renderer.getDrawableOrder(ob.drawableID)
              : -1;
          return da - db;
        });
      if (targets.length === 0) return "no drawing";
      targets.forEach((t) =>
        this._addSpriteDrawingTo(t, out, { includeHidden: incH }),
      );
      if (out.children().length === 0) return "no drawing";
      if (fmt === "pdf") return this._savePDFAsFile(out, name);
      this._saveSVGAsFile(out, name);
      return "saved";
    }

    getInfo() {
      return {
        id: EXTENSION_ID,
        name: "Vector Pen",
        color1: "#0FBD8C",
        color2: "#0DA57A",
        blockIconURI:
          "data:image/svg+xml;base64," +
          btoa(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">' +
              '<path d="M8 32 L32 8 L36 12 L12 36 Z" fill="#fff"/>' +
              '<path d="M8 32 L12 36 L6 38 Z" fill="#9c9c9c"/></svg>',
          ),
        blocks: [
          {
            opcode: "stamp",
            blockType: "command",
            text: "stamp",
            filter: ["sprite"],
          },
          {
            opcode: "drawShape",
            blockType: "command",
            text: "draw [SHAPE] with radius [RADIUS]",
            arguments: {
              SHAPE: { type: "string", menu: "shapesMenu" },
              RADIUS: { type: "number", defaultValue: 50 },
            },
            filter: ["sprite"],
          },
          {
            opcode: "addNode",
            blockType: "command",
            text: "add node at x: [X] y: [Y]",
            arguments: {
              X: { type: "number", defaultValue: 0 },
              Y: { type: "number", defaultValue: 0 },
            },
            filter: ["sprite"],
          },
          {
            opcode: "setLineStyle",
            blockType: "command",
            text: "set line style to [STYLE]",
            arguments: { STYLE: { type: "string", menu: "lineStylesMenu" } },
            filter: ["sprite"],
          },
          "---",
          {
            opcode: "penDown",
            blockType: "command",
            text: "[PEN_TYPE] pen down",
            arguments: { PEN_TYPE: { type: "string", menu: "penTypesMenu" } },
            filter: ["sprite"],
          },
          {
            opcode: "penUp",
            blockType: "command",
            text: "pen up",
            filter: ["sprite"],
          },
          {
            opcode: "plot",
            blockType: "command",
            text: "plot",
            filter: ["sprite"],
          },
          "---",
          {
            opcode: "setPenColorToColor",
            blockType: "command",
            text: "set pen color to [COLOR]",
            arguments: { COLOR: { type: "color" } },
            filter: ["sprite"],
          },
          {
            opcode: "setPenOpacity",
            blockType: "command",
            text: "set pen opacity to [OPACITY]",
            arguments: { OPACITY: { type: "number", defaultValue: 100 } },
            filter: ["sprite"],
          },
          {
            opcode: "setPenSizeTo",
            blockType: "command",
            text: "set pen size to [SIZE] mm",
            arguments: { SIZE: { type: "number", defaultValue: 1 } },
            filter: ["sprite"],
          },
          {
            opcode: "setLineShape",
            blockType: "command",
            text: "set line shape to [LINE_SHAPE]",
            arguments: {
              LINE_SHAPE: { type: "string", menu: "lineShapesMenu" },
            },
            filter: ["sprite"],
          },
          {
            opcode: "setFillEnabled",
            blockType: "command",
            text: "set fill [STATE]",
            arguments: {
              STATE: {
                type: "string",
                menu: "fillStateMenu",
                defaultValue: FILL_STATE.OFF,
              },
            },
            filter: ["sprite"],
          },
          {
            opcode: "setFillColorToColor",
            blockType: "command",
            text: "set fill color to [COLOR]",
            arguments: { COLOR: { type: "color" } },
            filter: ["sprite"],
          },
          {
            opcode: "setFillOpacity",
            blockType: "command",
            text: "set fill opacity to [OPACITY]",
            arguments: { OPACITY: { type: "number", defaultValue: 100 } },
            filter: ["sprite"],
          },
          "---",
          {
            opcode: "changeLayerTo",
            blockType: "command",
            text: "change layer to [LAYER]",
            arguments: { LAYER: { type: "string", menu: "changeLayerMenu" } },
            filter: ["sprite"],
          },
          {
            opcode: "moveLayerBy",
            blockType: "command",
            text: "move [DIRECTION] [LAYERS] layers",
            arguments: {
              DIRECTION: { type: "string", menu: "moveLayerDirectionMenu" },
              LAYERS: { type: "number", defaultValue: 1 },
            },
            filter: ["sprite"],
          },
          "---",
          {
            opcode: "showDrawing",
            blockType: "command",
            text: "show drawing",
            filter: ["sprite"],
          },
          {
            opcode: "hideDrawing",
            blockType: "command",
            text: "hide drawing",
            filter: ["sprite"],
          },
          {
            opcode: "isDrawingShown",
            blockType: "Boolean",
            text: "drawing shown?",
            filter: ["sprite"],
          },
          {
            opcode: "isFillEnabled",
            blockType: "Boolean",
            text: "fill enabled?",
            filter: ["sprite"],
          },
          "---",
          {
            opcode: "clearAll",
            blockType: "command",
            text: "erase all drawings",
          },
          {
            opcode: "clear",
            blockType: "command",
            text: "erase drawings of this sprite",
            filter: ["sprite"],
          },
          {
            opcode: "eraseLast",
            blockType: "command",
            text: "erase last drawing",
            filter: ["sprite"],
          },
          "---",
          {
            opcode: "stepForMM",
            blockType: "reporter",
            text: "steps for [MM] mm",
            arguments: { MM: { type: "number", defaultValue: 10 } },
          },
          {
            opcode: "mmForStep",
            blockType: "reporter",
            text: "mm for [STEP] steps",
            arguments: { STEP: { type: "number", defaultValue: 100 } },
          },
          { opcode: "getStepPerMM", blockType: "reporter", text: "step/mm" },
          {
            opcode: "setStepPerMM",
            blockType: "command",
            text: "set step/mm to [STEP_PER_MM]",
            arguments: { STEP_PER_MM: { type: "number", defaultValue: 2 } },
          },
          "---",
          {
            opcode: "loadSVG",
            blockType: "command",
            text: "load SVG from [SVG_CODE] positioned [POS]",
            arguments: {
              SVG_CODE: {
                type: "string",
                defaultValue:
                  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">\n' +
                  '  <path d="M8 32 L32 8 L36 12 L12 36 Z" fill="#b3b3b3"/>\n' +
                  '  <path d="M8 32 L12 36 L6 38 Z" fill="#333"/>\n' +
                  "</svg>",
              },
              POS: { type: "string", menu: "svgPosMenu", defaultValue: "stage" },
            },
            filter: ["sprite"],
          },
          {
            opcode: "downloadAllDrawing",
            blockType: "command",
            text: "download all drawings as [FORMAT] named [FILENAME]",
            arguments: {
              FORMAT: {
                type: "string",
                menu: "fileFormatMenu",
                defaultValue: "svg",
              },
              FILENAME: { type: "string", defaultValue: "vpen" },
            },
          },
          {
            opcode: "downloadSpriteDrawing",
            blockType: "command",
            text: "download drawing by the sprite as [FORMAT] named [FILENAME]",
            arguments: {
              FORMAT: {
                type: "string",
                menu: "fileFormatMenu",
                defaultValue: "svg",
              },
              FILENAME: { type: "string", defaultValue: "sprite" },
            },
            filter: ["sprite"],
          },
        ],
        menus: {
          penTypesMenu: {
            acceptReporters: false,
            items: [
              { text: "trail", value: PEN_TYPES.TRAIL },
              { text: "plotter", value: PEN_TYPES.PLOTTER },
            ],
          },
          lineStylesMenu: {
            acceptReporters: false,
            items: [
              { text: "solid", value: LINE_STYLES.SOLID },
              { text: "dashed", value: LINE_STYLES.DASHED },
            ],
          },
          shapesMenu: {
            acceptReporters: false,
            items: [
              { text: "circle", value: SHAPES.CIRCLE },
              { text: "square", value: SHAPES.SQUARE },
              { text: "triangle", value: SHAPES.TRIANGLE },
            ],
          },
          lineShapesMenu: {
            acceptReporters: false,
            items: [
              { text: "straight", value: LINE_SHAPES.STRAIGHT },
              { text: "curve", value: LINE_SHAPES.CURVE },
            ],
          },
          changeLayerMenu: {
            acceptReporters: false,
            items: [
              { text: "top", value: CHANGE_LAYER.TOP },
              { text: "bottom", value: CHANGE_LAYER.BOTTOM },
            ],
          },
          moveLayerDirectionMenu: {
            acceptReporters: false,
            items: [
              { text: "up", value: MOVE_LAYER.UP },
              { text: "down", value: MOVE_LAYER.DOWN },
            ],
          },
          fillStateMenu: {
            acceptReporters: false,
            items: [
              { text: "on", value: FILL_STATE.ON },
              { text: "off", value: FILL_STATE.OFF },
            ],
          },
          svgPosMenu: {
            acceptReporters: false,
            items: [
              { text: "on stage", value: "stage" },
              { text: "at sprite", value: "sprite" },
            ],
          },
          fileFormatMenu: {
            acceptReporters: false,
            items: [
              { text: "SVG", value: "svg" },
              { text: "PDF", value: "pdf" },
            ],
          },
        },
      };
    }
  }

  Scratch.extensions.register(new VPenBlocks(Scratch.vm.runtime));
})(Scratch);
