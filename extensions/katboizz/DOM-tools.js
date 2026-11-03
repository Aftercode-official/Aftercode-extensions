// Name: DOM plugin v3
// ID: DOMplugin
// Description: Customize DOM element in your project
// By: katboizz
// License: MIT
(function(Scratch) {
  'use strict';

if (!Scratch.extensions.unsandboxed) {
    throw new Error("must be ran unsandboxed");
}
const extId = 'DOMplugin';
const { BlockType, ArgumentType, vm } = Scratch, runtime = vm.runtime;
  const hasOwn = (object, property) => Object.prototype.hasOwnProperty.call(object, property);
  if (hasOwn(runtime, `ext_${extId}`)) {
    const MESSAGE = `Palette overload.<br /><small>(MoreFields loaded twice)</small>`;
    const toString = Object.prototype.toString;
    Object.prototype.toString = function() {
      throw new Error(MESSAGE);
    }
    vm.editingTarget = {};
    vm.emitTargetsUpdate();
    setTimeout(function(){
      const err = document.querySelector('p[class^=crash-message_error-message]');
      err.innerHTML = MESSAGE;
      Object.prototype.toString = toString;
    }, 100);
    throw new Error(MESSAGE);
  }
  const customFieldTypes = {};
  let Blockly = null;
  const _LDC = function _LightenDarkenColor(col, amt) {
    const num = parseInt(col.replace('#', ''), 16);
    const r = (num >> 16) + amt;
    const b = ((num >> 8) & 0x00FF) + amt;
    const g = (num & 0x0000FF) + amt;
    const newColour = g | (b << 8) | (r << 16);
    return (col.at(0) === '#' ? '#' : '') + newColour.toString(16);
  };
  function _setCssNattr(node, attr, value) {
    node.setAttribute(attr, String(value));
    node.style[attr] = value;
  }
  function _delCssNattr(node, attr) {
    node.removeAttribute(attr);
    delete node.style[attr];
  }
  function _fixColours(doText, col1, textColour) {
    const LDA = -10;
    const self = this.sourceBlock_;
    const parent = self?.parentBlock_;
    if (!parent) return;
    const path = self?.svgPath_;
    const argumentSvg = path?.parentNode;
    const textNode = argumentSvg.querySelector('g.blocklyEditableText text');
    const oldFirstColour = parent.colour_;
    self.colour_ = (col1 ?? _LDC(parent.colour_, LDA));
    self.colourSecondary_ = _LDC(parent.colourSecondary_, LDA);
    self.colourTertiary_ = _LDC(parent.colourTertiary_, LDA);
    self.colourQuaternary_ = _LDC(parent?.colourQuaternary_ ?? oldFirstColour, LDA);
    _setCssNattr(path, 'fill', self.colour_);
    _setCssNattr(path, 'stroke', self.colourTertiary_);
    if (doText && textNode) _setCssNattr(textNode, 'fill', textColour ?? '#e06c75');
  }
  function _moveDropdown(toArgument) {
    toArgument ??= false;
    Blockly.DropDownDiv.showPositionedByBlock(this, (toArgument ? this.sourceBlock_ : this.sourceBlock_.parentBlock_));
  }
  const _cbfsb = runtime._convertBlockForScratchBlocks.bind(runtime);
  runtime._convertBlockForScratchBlocks = function(blockInfo, categoryInfo, ...args) {
    const res = _cbfsb(blockInfo, categoryInfo, ...args);
    if (hasOwn(blockInfo, 'blockShape')) res.json.outputShape = blockInfo.blockShape;
    return res;
  };
  const bcfi = runtime._buildCustomFieldInfo.bind(runtime);
  const bcftfsb = runtime._buildCustomFieldTypeForScratchBlocks.bind(runtime);
  let fi = null;
  runtime._buildCustomFieldInfo = function(fieldName, fieldInfo, extensionId, categoryInfo, ...args) {
    fi = fieldInfo;
    return bcfi(fieldName, fieldInfo, extensionId, categoryInfo, ...args);
  };
  runtime._buildCustomFieldTypeForScratchBlocks = function(fieldName, output, outputShape, categoryInfo, ...args) {
    const res = bcftfsb(fieldName, output, outputShape, categoryInfo, ...args);
    if (fi) {
      if (fi.color1) res.json.colour = fi.color1;
      if (fi.color2) res.json.colourSecondary = fi.color2;
      if (fi.color3) res.json.colourTertiary = fi.color3;
      if (fi.color4) res.json.colourQuaternary = fi.color4;
      if (hasOwn(fi, 'output')) res.json.output = fi.output;
      fi = null;
    }
    return res;
  };
  const toRegisterOnBlocklyGot = [];
   vm.addListener('EXTENSION_FIELD_ADDED', (fieldInfo) => {
    if (Blockly) Blockly.Field.register(fieldInfo.name, fieldInfo.implementation);
    else toRegisterOnBlocklyGot.push([fieldInfo.name, fieldInfo.implementation]);
  });
  ArgumentType.TEXTAREA = 'Textarea';
  const implementations = {
    FieldInlineTextarea: null,
  };
  customFieldTypes[ArgumentType.TEXTAREA] = {
    output: ArgumentType.STRING,
    color1: '#2ECC71',
    outputShape: 3,
    implementation: {
      fromJson: () => new implementations.FieldInlineTextarea(),
    },
  };
    function gotBlockly(_sb) {
    Blockly = _sb;
    const BlockSvg = Blockly.BlockSvg;
    const _setAttribute = SVGTextElement.prototype.setAttribute;
    SVGTextElement.prototype.setAttribute = function(attr, val, ...args) {
      if (String(val) === 'NaN' && (attr === 'x' || attr === 'y') && this.getAttribute('class') === 'blocklyText') {
        const nattr = `MoreFieldsAttrErr${attr.toUpperCase()}`;
        _setAttribute.call(this, nattr, `Attempted an illegal set on this text node. ${attr.toUpperCase()} was set to NaN.`);
        return _setAttribute.call(this, attr, '0', ...args);
      }
      return _setAttribute.call(this, attr, val, ...args);
    };
    const _endBlockDrag = Blockly.BlockDragger.prototype.endBlockDrag
    Blockly.BlockDragger.prototype.endBlockDrag = function (...a) {
      const res = _endBlockDrag.apply(this, a);
      for (const childBlock of this.draggingBlock_.childBlocks_) {
        const inputList = childBlock.inputList;
        if (inputList.length === 1 && inputList[0].fieldRow.length === 1 && !!inputList[0].fieldRow[0]?.inlineDblRender) childBlock.render();
      }
      return res;
    }
    const textInputs_trueToOriginal = true;
    implementations.FieldInlineTextarea = class FieldInlineTextarea extends Blockly.Field {
      constructor(opt_value) {
        opt_value = ArgumentType.TEXTAREA;
        super(opt_value);
        this.addArgType('String');
        this.addArgType(ArgumentType.TEXTAREA);
      }
      updateWidth() {
        if (this._textarea) {
          const width = this._textarea.offsetWidth + 1, height = this._textarea.offsetHeight + 1;
          this._textareaHolder.setAttribute('width', String(width + 3));
          this._textareaHolder.setAttribute('height', String(height + 3));
          this.size_.width = width - BlockSvg.NOTCH_START_PADDING + 2 * BlockSvg.NOTCH_START_PADDING / 3;
          this.size_.height = height + BlockSvg.NOTCH_HEIGHT + 1.5 + BlockSvg.NOTCH_START_PADDING / 3;
        } else {
          this.size_.width = this._FakeWidth || 300;
          this.size_.height = this._FakeHeight || 150;
        }
      }
      dispose() {
        super.dispose();
      }
      init(...initArgs) {
        this.inlineDblRender = true;
        Blockly.Field.prototype.init.call(this, ...initArgs);
        this.textNode__ = this.sourceBlock_.svgPath_.parentNode.querySelector('g.blocklyEditableText text');
        if (!!this.textNode__ && this.sourceBlock_.parentBlock_) {
          this.textNode__.style.display = 'none';
          _fixColours.call(this, false, this.sourceBlock_.parentBlock_.colour_);
        }
        this._FakeWidth ??= 300;
        this._FakeHeight ??= 150;
        const textareaHolder = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
        textareaHolder.setAttribute('style', 'color-scheme: Dark; color: #e06c75;');
        textareaHolder.addEventListener('keydown', (e) => {
          e.stopPropagation();
          if (e.key === 'Tab') {
            e.preventDefault();
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            textarea.value = textarea.value.substring(0, start) + '  ' + textarea.value.substring(end);
            textarea.selectionStart = textarea.selectionEnd = start + 2;
            this.setValue(textarea.value);
          }
        });
        textareaHolder.addEventListener('keyup', (e) => e.stopPropagation());
        textareaHolder.addEventListener('input', () => {
          this.setValue(textarea.value);
        });
        textareaHolder.setAttribute('x', '6');
        textareaHolder.setAttribute('y', String(BlockSvg.NOTCH_START_PADDING / 2 - 0.375));
        textareaHolder.addEventListener('mousedown', (e) => e.stopPropagation());
        const textarea = document.createElement('textarea');
        textarea.value = this.getValue() ?? '';
        textarea.style.width = '300px';
        textarea.style.height = '150px';
        textarea.addEventListener('input', () => this._onInput());
        textarea.addEventListener('mouseup', () => this._resizeHolder());
        if (this.fieldGroup_) {
          this.fieldGroup_.insertAdjacentElement('afterend', textareaHolder);
          textareaHolder.appendChild(textarea);
          this._textareaHolder = textareaHolder;
          this._textarea = textarea;
          if (this.sourceBlock_ && this.sourceBlock_.isInFlyout) {
            textarea.disabled = true;
            textarea.style.resize = 'none';
          }
          new ResizeObserver(() => this._resizeHolder()).observe(this._textarea);
        }
        this._resizeHolder();
      }
      _resizeHolder() {
        this.updateWidth();
        const ov = this.getValue();
        this.setValue(ov + '~');
        this.setValue(ov);
        this.render_();
      }
      _onInput() {
        this.setValue(this._textarea.value);
      }
      showEditor_() {
      }
    }
    }
    gotBlockly._on = new Set();
  gotBlockly.when = function(callback) {
    if (Blockly) {
      callback(Blockly);
      return;
    }
    gotBlockly._on.add(() => callback(Blockly));
  };
  gotBlockly._registerFields = function() {
    while (toRegisterOnBlocklyGot.length > 0) {
      const [name, impl] = toRegisterOnBlocklyGot.shift();
      Blockly.Field.register(name, impl);
    }
    gotBlockly._hardRefresh();
  };
  gotBlockly._hardRefresh = function() {
    vm.extensionManager.refreshBlocks();
    const eventsOriginallyEnabled = Blockly.Events.isEnabled(), workspace = Blockly.getMainWorkspace();
    try {
      Blockly.Events.disable();
      if (workspace) {
        if (vm.editingTarget) vm.emitWorkspaceUpdate();
        const flyout = workspace.getFlyout();
        if (flyout) {
          const flyoutWorkspace = flyout.getWorkspace();
          Blockly.Xml.clearWorkspaceAndLoadFromXml(
            Blockly.Xml.workspaceToDom(flyoutWorkspace),
            flyoutWorkspace
          );
          workspace.getToolbox().refreshSelection();
          workspace.toolboxRefreshEnabled_ = true;
        }
      }
    } catch(err) {
      console.error('Error while refreshing toolbox and workspace.', err);
    } finally {
      if (eventsOriginallyEnabled) Blockly.Events.enable();
    }
  }
  gotBlockly._badRefresh = function(ws) {
    ws.resetDragSurface();
    try {
      ws.getFlyout().clearOldBlocks_();
      vm.extensionManager.refreshBlocks();
      ws.refreshToolboxSelection_();
    } catch {/**/}
  };
  if (typeof Scratch?.gui === 'object') Scratch.gui.getBlockly().then((Blockly) => gotBlockly(Blockly));
  const xmlEscape = (unsafe) => unsafe.replace(/[<>&'"]/g, c => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
    }
  });

class extensionAPI {
    static get customFieldTypes() {
      return customFieldTypes;
    }
    static get fieldInfo() {
      return fi;
    }
    static PRIV_extensionField(args, util, blockJSON) {
      return (
        this._registered[blockJSON.fieldInfo.name.toUpperCase()]
      ).getValue(args, util, blockJSON);
    }
    static hideDropdown() {
      if (!Blockly) return;
      if (!Blockly.DropDownDiv.isVisible()) return;
      Blockly.DropDownDiv.clearContent();
      Blockly.DropDownDiv.hide();
    }
    static fixDropdown(self) {
      if (!Blockly) return;
      if (Blockly.DropDownDiv.isVisible()) return;
      if (self.sourceBlock_.parentBlock) {
        Blockly.DropDownDiv.setColour(self.sourceBlock_.parentBlock_.getColour(), self.sourceBlock_.parentBlock_.getColourTertiary());
        Blockly.DropDownDiv.setCategory(self.sourceBlock_.parentBlock_.getCategory());
      }
      _moveDropdown.call(self, true);
    }
    static setPathColour(self, colour) {
      const fg_ = self.fieldGroup_;
      if (!fg_) return;
      const path = fg_?.previousElementSibling;
      if (path?.nodeName !== 'path') return;
      path.setAttribute('stroke', colour);
      path.setAttribute('fill', colour);
    }
    static fixTextNode(self, textColour) {
      if (!self.sourceBlock_) return;
      if (!(self.textNode__ = (
        self.sourceBlock_.svgPath_.parentNode.querySelector('g.blocklyEditableText text')
      ))) return
      _setCssNattr(self.textNode__, 'fill', textColour ?? '#FFFFFF');
    }
    static _registered = Object.create(null);
    static _register = new Set();
    static _patch = new Set();
    constructor() {
    this.windows = {};
    this.zIndexCounter = 9999;
    this.updateLoop = this.updateLoop.bind(this);
    requestAnimationFrame(this.updateLoop);
      vm.on('CREATE_UNSANDBOXED_EXTENSION_API', (Scratch) => {
        const register = Scratch.extensions.register;
        Scratch.extensions.register = (clss) => {
          if (this.constructor._patch.has(clss.getInfo().id)) {
            clss['extensionField'] = this.constructor.PRIV_extensionField.bind(this.constructor);
          }
          return register(clss);
        };
      });
    }
    static register(newExtId, opts, getValue, getField) {
      const onu = opts.name.toUpperCase();
      if (this._register.has(onu)) {
        throw new Error(`"${opts.name}" already exists.`);
      }
      this._register.add(onu);
      this._patch.add(newExtId);
      ArgumentType[onu] = onu;
      opts.blockType ??= BlockType.REPORTER;
      opts.defaultValue ??= '';
      opts.text ??= '[FIELD]';
      opts.xml ??= '';
      opts.output ??= null;
      opts.outputShape ??= 3;
      opts.color1 ??= '#2ECC71';
      opts.color2 ??= opts.color1;
      opts.color3 ??= opts.color1;
      opts.color4 ??= opts.color1;
      implementations[`ceb${onu}`] = null;
      const fi = customFieldTypes[onu] = opts.fi = {
        name: onu,
        output: opts.output,
        color1: opts.color1,
        color2: opts.color2,
        color3: opts.color3,
        color4: opts.color4,
        outputShape: opts.outputShape,
        implementation: {
          fromJson: (...args) => new implementations[`ceb${onu}`](...args),
        },
      };
      this._registered[onu] = {
        getValue,
        getField,
        opts,
        fi,
      };
      gotBlockly.when((Blockly) => {
        Blockly.defineBlocksWithJsonArray([{
          type: `${extId}_${onu}`,
          message0: '%1',
          inputsInline: true,
          output: opts.output,
          colour: opts.color1,
          colourSecondary: opts.color2,
          colourTertiary: opts.color3,
          outputShape: opts.outputShape,
          args0: [{
            name: `field_${extId}_${onu}`,
            type: `field_${extId}_${onu}`,
          }],
        }]);
        const field = getField(Blockly);
        implementations[`ceb${onu}`] = field;
        this._register.delete(onu);
        if (this._register.size === 0) {
          runtime.emit('BLOCKINFO_UPDATE', runtime[`ext_${extId}`].getInfo());
          gotBlockly._registerFields();
          if (globalThis.ReduxStore) { setTimeout(() => {
            const ws = Blockly.getMainWorkspace();
            vm.clearFlyoutBlocks();
            runtime.flyoutBlocks.resetCache();
            ws.updateToolbox(ReduxStore.getState().scratchGui.toolbox.toolboxXML);
            gotBlockly._badRefresh(ws);
            setTimeout(() => gotBlockly._badRefresh(ws), 100);
          }, 250); }
        }
      });
      vm.emit('EXTENSION_FIELD_ADDED', Object.assign(fi, {
        name: `field_${extId}_${onu}`,
      }));
      return [{
        fieldInfo: opts,
        blockType: opts.blockType,
        outputShape: opts.outputShape,
        blockShape: opts.outputShape,
        func: 'extensionField',
        opcode: `ceb${onu}`,
        text: opts.text,
        arguments: {
          FIELD: {
            type: onu,
            defaultValue: opts.defaultValue,
            exemptFromNormalization: true,
          },
        },
        allowDropAnywhere: (opts.output === null),
        hideFromPalette: true,
      }, {
        blockType: BlockType.XML,
        xml: (`<block type="${newExtId}_ceb${onu}">${
          opts.xml
        }<value name="FIELD"><shadow type="${
          extId
        }_${onu}"><field name="field_${extId}_${onu}">${
          xmlEscape(opts.defaultValue)
        }</field></shadow></value></block>`),
      }];
    }
  }
  class extension extends extensionAPI {
    static exports = {
      hasOwn,
      _LDC,
      _setCssNattr,
      _delCssNattr,
      _fixColours,
      _moveDropdown,
      extensionAPI,
      xmlEscape,
      get padding() { return padding; },
    };

getInfo() {
       const getInfo = ({
         id: extId,
             name: 'DOM plugin v3',
            color1: '#2ECC71',
            color2: '#27AE60',
            blocks: [
                {
                    opcode: 'createWindow',
                    blockType: Scratch.BlockType.COMMAND,
                    text: 'create window id [ID] frameless [FRAME]',
                    arguments: {
                        ID: { type: Scratch.ArgumentType.STRING, defaultValue: "win1" },
                        FRAME: {
                            type: Scratch.ArgumentType.STRING,
                            menu: 'frameMenu'
                        }
                    }
                },

                 {
                    opcode: 'createhtmlwin',
                    blockType: BlockType.COMMAND,
                    text: ' Excute code html [TEXT] set window id [ID]',
                    arguments: {
                    TEXT: {
                        type: Scratch.ArgumentType.TEXTAREA,
                        defaultValue: '<div style="overflow-x: auto; color:white; background:#8e44ad; padding:15px; text-align:center; font-family:sans-serif; border-radius:8px;">\n <h2>Example html</h2>\n  <button onclick="alert(\'yippppppe\')">click me</button>\n</div>',
                        exemptFromNormalization: true,
                    },
                    ID:{ type: Scratch.ArgumentType.STRING, defaultValue: "win1" }

                    },
                    allowDropAnywhere: true,
                    blockShape: 3,
                },

                {
                    blockType: BlockType.XML,
                    xml: '<sep gap="140" />',
                },

                {
                    opcode: 'closeWindow',
                    blockType: Scratch.BlockType.COMMAND,
                    text: 'close window [ID]',
                    arguments: {
                        ID: { type: Scratch.ArgumentType.STRING, defaultValue: "win1" }
                    }
                },

                {
                    opcode: 'setWindowSpriteLive',
                    blockType: Scratch.BlockType.COMMAND,
                    text: 'set window [ID] live sprite [NAME]',
                    arguments: {
                        ID: { type: Scratch.ArgumentType.STRING, defaultValue: "win1" },
                        NAME: { type: Scratch.ArgumentType.STRING, defaultValue: "Sprite1" }
                    }
                },

                {
                    opcode: 'setWindowPosition',
                    blockType: Scratch.BlockType.COMMAND,
                    text: 'set window [ID] position x [X] y [Y]',
                    arguments: {
                        ID: { type: Scratch.ArgumentType.STRING, defaultValue: "win1" },
                        X: { type: Scratch.ArgumentType.NUMBER, defaultValue: 100 },
                        Y: { type: Scratch.ArgumentType.NUMBER, defaultValue: 100 }
                    }
                },

                {
                    opcode: 'setWindowSize',
                    blockType: Scratch.BlockType.COMMAND,
                    text: 'set window [ID] size width [W] height [H]',
                    arguments: {
                        ID: { type: Scratch.ArgumentType.STRING, defaultValue: "win1" },
                        W: { type: Scratch.ArgumentType.NUMBER, defaultValue: 400 },
                        H: { type: Scratch.ArgumentType.NUMBER, defaultValue: 300 }
                    }
                },

                {
                    opcode: 'setWindowCSS',
                    blockType: Scratch.BlockType.COMMAND,
                    text: 'set window [ID] css [PROP] value [VALUE]',
                    arguments: {
                        ID: { type: Scratch.ArgumentType.STRING, defaultValue: "win1" },
                        PROP: {
                            type: Scratch.ArgumentType.STRING,
                            menu: 'cssPropMenu',
                            defaultValue: 'background'
                        },
                        VALUE: { type: Scratch.ArgumentType.STRING, defaultValue: 'red' }
                    }
                },

                {
                    opcode: 'setWindowCSSFull',
                    blockType: Scratch.BlockType.COMMAND,
                    text: 'set window [ID] css style [STYLE]',
                    arguments: {
                        ID: { type: Scratch.ArgumentType.STRING, defaultValue: "win1" },
                        STYLE: {
                            type: Scratch.ArgumentType.STRING,
                            defaultValue: 'background:red; border-radius:16px; opacity:0.9;'
                        }
                    }
                },

                {
                    opcode: 'getWindowCSS',
                    blockType: Scratch.BlockType.REPORTER,
                    text: 'get window [ID] css [PROP]',
                    arguments: {
                        ID: { type: Scratch.ArgumentType.STRING, defaultValue: "win1" },
                        PROP: {
                            type: Scratch.ArgumentType.STRING,
                            menu: 'cssPropMenu',
                            defaultValue: 'background'
                        }
                    }
                },

                {
                    opcode: 'setWindowDrag',
                    blockType: Scratch.BlockType.COMMAND,
                    text: 'set window [ID] drag [MODE] value [VALUE]',
                    arguments: {
                        ID: { type: Scratch.ArgumentType.STRING, defaultValue: "win1" },
                        MODE: {
                            type: Scratch.ArgumentType.STRING,
                            menu: 'dragModeMenu',
                            defaultValue: 'enabled'
                        },
                        VALUE: { type: Scratch.ArgumentType.STRING, defaultValue: 'true' }
                    }
                },

                {
                    opcode: 'setDragLogic',
                    blockType: Scratch.BlockType.COMMAND,
                    text: 'set drag logic of window [ID] phase [PHASE] code [CODE]',
                    arguments: {
                        ID: { type: Scratch.ArgumentType.STRING, defaultValue: "win1" },
                        PHASE: {
                            type: Scratch.ArgumentType.STRING,
                            menu: 'dragPhaseMenu',
                            defaultValue: 'move'
                        },
                        CODE: {
                            type: Scratch.ArgumentType.STRING,
                            defaultValue: 'api.setPos(state.startLeft + (e.clientX - state.offsetX), state.startTop + (e.clientY - state.offsetY));'
                        }
                    }
                },

                {
                    opcode: 'appendDragLogic',
                    blockType: Scratch.BlockType.COMMAND,
                    text: 'append drag logic of window [ID] phase [PHASE] code [CODE]',
                    arguments: {
                        ID: { type: Scratch.ArgumentType.STRING, defaultValue: "win1" },
                        PHASE: {
                            type: Scratch.ArgumentType.STRING,
                            menu: 'dragPhaseMenu',
                            defaultValue: 'down'
                        },
                        CODE: {
                            type: Scratch.ArgumentType.STRING,
                            defaultValue: "win.style.boxShadow = '0 0 40px red';"
                        }
                    }
                },

                {
                    opcode: 'resetDragLogic',
                    blockType: Scratch.BlockType.COMMAND,
                    text: 'reset drag logic of window [ID]',
                    arguments: {
                        ID: { type: Scratch.ArgumentType.STRING, defaultValue: "win1" }
                    }
                },

                {
                    opcode: 'getDragLogic',
                    blockType: Scratch.BlockType.REPORTER,
                    text: 'get drag logic of window [ID] phase [PHASE]',
                    arguments: {
                        ID: { type: Scratch.ArgumentType.STRING, defaultValue: "win1" },
                        PHASE: {
                            type: Scratch.ArgumentType.STRING,
                            menu: 'dragPhaseMenu',
                            defaultValue: 'move'
                        }
                    }
                },

                {
                    opcode: 'runWindowJS',
                    blockType: Scratch.BlockType.COMMAND,
                    text: 'run JS [CODE] in window [ID]',
                    arguments: {
                        ID: { type: Scratch.ArgumentType.STRING, defaultValue: "win1" },
                        CODE: {
                            type: Scratch.ArgumentType.STRING,
                            defaultValue: "__DOMWIN__.style.transform = 'rotate(5deg)';"
                        }
                    }
                },

                {
                    opcode: 'getWindowPosition',
                    blockType: Scratch.BlockType.REPORTER,
                    text: 'get window [ID] position [AXIS]',
                    arguments: {
                        ID: { type: Scratch.ArgumentType.STRING, defaultValue: "win1" },
                        AXIS: {
                            type: Scratch.ArgumentType.STRING,
                            menu: 'axisMenu'
                        }
                    }
                },

                {
                opcode: 'Allwindows',
                blockType: Scratch.BlockType.REPORTER,
                text: 'All windows',
                },
            ],

            customFieldTypes,

            menus: {
                frameMenu: {
                    acceptReporters: true,
                    items: [
                        { text: 'normal', value: 'normal' },
                        { text: 'frameless', value: 'frameless' }
                    ]
                },
                axisMenu: {
                    acceptReporters: true,
                    items: [
                        { text: 'x', value: 'x' },
                        { text: 'y', value: 'y' }
                    ]
                },
                cssPropMenu: {
                    acceptReporters: true,
                    items: [
                        { text: 'background', value: 'background' },
                        { text: 'background-color', value: 'backgroundColor' },
                        { text: 'color', value: 'color' },
                        { text: 'border', value: 'border' },
                        { text: 'border-radius', value: 'borderRadius' },
                        { text: 'border-color', value: 'borderColor' },
                        { text: 'box-shadow', value: 'boxShadow' },
                        { text: 'opacity', value: 'opacity' },
                        { text: 'width', value: 'width' },
                        { text: 'height', value: 'height' },
                        { text: 'left', value: 'left' },
                        { text: 'top', value: 'top' },
                        { text: 'z-index', value: 'zIndex' },
                        { text: 'display', value: 'display' },
                        { text: 'transform', value: 'transform' },
                        { text: 'filter', value: 'filter' },
                        { text: 'padding', value: 'padding' },
                        { text: 'margin', value: 'margin' }
                    ]
                },
                dragModeMenu: {
                    acceptReporters: true,
                    items: [
                        { text: 'enabled (true/false)',   value: 'enabled' },
                        { text: 'snap grid (px)',         value: 'snapGrid' },
                        { text: 'clamp to viewport',      value: 'clamp' },
                        { text: 'cursor',                 value: 'cursor' },
                        { text: 'button (0=left,2=right)', value: 'button' }
                    ]
                },
                dragPhaseMenu: {
                    acceptReporters: true,
                    items: [
                        { text: 'down (bắt đầu kéo)', value: 'down' },
                        { text: 'move (đang kéo)',   value: 'move' },
                        { text: 'up (thả chuột)',    value: 'up' }
                    ]
                }
            },
        });
        return getInfo;
    };

    createWindow(args) {
    const id = String(args.ID);
    if (this.windows[id]) return;

    const win = document.createElement('div');
    win.style.position = 'fixed';
    win.style.left = '460px';
    win.style.top = '120px';
    win.style.width = '400px';
    win.style.height = '300px';
    win.style.background = 'white';
    win.style.border = '1px solid #555';
    win.style.boxShadow = '0 5px 20px rgba(0,0,0,0.4)';
    win.style.zIndex = this.zIndexCounter++;
    win.style.display = 'flex';
    win.style.flexDirection = 'column';
    win.style.overflow = 'hidden';

    const canvas = document.createElement("canvas");
    canvas.width = 400;
    canvas.height = 270;
    canvas.style.flex = "1";
    canvas.style.background = "white";

    win._dragLogic = {
        down: this._dragLogicDown,
        move: this._dragLogicMove,
        up:   this._dragLogicUp
    };

    if (args.FRAME !== 'frameless') {
        const titleBar = document.createElement('div');
        titleBar.style.height = '30px';
        titleBar.style.background = '#2ECC71';
        titleBar.style.cursor = 'move';
        titleBar.style.display = 'flex';
        titleBar.style.alignItems = 'center';
        titleBar.style.justifyContent = 'space-between';
        titleBar.style.padding = '0 8px';
        titleBar.style.color = 'white';
        titleBar.textContent = id;

        const closeBtn = document.createElement('span');
        closeBtn.textContent = '✕';
        closeBtn.style.cursor = 'pointer';
        closeBtn.onclick = () => this.closeWindow({ID:id});

        titleBar.appendChild(closeBtn);
        win.appendChild(titleBar);
        this.makeDraggable(win, titleBar);
    }

    win.appendChild(canvas);
    document.body.appendChild(win);

    this.windows[id] = {
        element: win,
        canvas: canvas,
        sprite: null,
        iframe: null
    };
}


    closeWindow(args) {
        const id = String(args.ID);
        const data = this.windows[id];
        if (!data) return;

        try { data.element._dragCleanup?.(); } catch {}

        data.element.remove();
        delete this.windows[id];
    }

    setWindowSpriteLive(args) {
        const id = String(args.ID);
        const name = String(args.NAME);

        const data = this.windows[id];
        if (!data) return;

        const target = Scratch.vm.runtime.targets.find(
            t => t.getName && t.getName() === name
        );
        if (!target) return;

        data.sprite = target;
    }

    updateLoop() {
        const renderer = Scratch.vm.renderer;

        for (const id in this.windows) {
            const data = this.windows[id];
            if (!data.sprite) continue;

            const drawableID = data.sprite.drawableID;
            if (drawableID == null) continue;

            const drawable = renderer._allDrawables[drawableID];
            if (!drawable) continue;

            const skin = renderer._allSkins[drawable.skin._id];
            if (!skin || !skin._canvas) continue;

            const canvas = data.canvas;
            const ctx = canvas.getContext("2d");

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const skinCanvas = skin._canvas;

            const scale = Math.min(
                canvas.width / skinCanvas.width,
                canvas.height / skinCanvas.height
            );

            const w = skinCanvas.width * scale;
            const h = skinCanvas.height * scale;

            ctx.drawImage(
                skinCanvas,
                (canvas.width - w) / 2,
                (canvas.height - h) / 2,
                w,
                h
            );
        }

        requestAnimationFrame(this.updateLoop);
    }

    setWindowPosition(args) {
        const data = this.windows[String(args.ID)];
        if (!data) return;
        data.element.style.left = Number(args.X) + 'px';
        data.element.style.top = Number(args.Y) + 'px';
    }

    setWindowSize(args) {
        const data = this.windows[String(args.ID)];
        if (!data) return;
        data.element.style.width = Number(args.W) + 'px';
        data.element.style.height = Number(args.H) + 'px';
    }

   createhtmlwin(args) {
    const id = String(args.ID);
    if (this.windows[id]) return;
    const htmlCode = String(args.TEXT);

    const win = document.createElement('div');
    win.style.position = 'fixed';
    win.style.left = '460px';
    win.style.top = '120px';
    win.style.width = '400px';
    win.style.height = '300px';
    win.style.background = 'white';
    win.style.border = '1px solid #555';
    win.style.boxShadow = '0 5px 20px rgba(0,0,0,0.4)';
    win.style.zIndex = this.zIndexCounter++;
    win.style.display = 'flex';
    win.style.flexDirection = 'column';
    win.style.overflow = 'hidden';

    win._dragLogic = {
        down: this._dragLogicDown,
        move: this._dragLogicMove,
        up:   this._dragLogicUp
    };

    const titleBar = document.createElement('div');
    titleBar.style.height = '30px';
    titleBar.style.background = '#2ECC71';
    titleBar.style.cursor = 'move';
    titleBar.style.display = 'flex';
    titleBar.style.alignItems = 'center';
    titleBar.style.justifyContent = 'space-between';
    titleBar.style.padding = '0 8px';
    titleBar.style.color = 'white';
    titleBar.textContent = id;

    const closeBtn = document.createElement('span');
    closeBtn.textContent = '✕';
    closeBtn.style.cursor = 'pointer';
    closeBtn.onclick = () => this.closeWindow({ ID: id });
    titleBar.appendChild(closeBtn);

    const iframe = document.createElement('iframe');
    iframe.style.flex = '1';
    iframe.style.border = 'none';
    iframe.style.width = '100%';
    iframe.srcdoc = htmlCode;

    win.appendChild(titleBar);
    win.appendChild(iframe);
    document.body.appendChild(win);

    this.makeDraggable(win, titleBar);

    this.activeHtmlFrame = iframe;
    this.windows[id] = {
        element: win,
        canvas: null,
        sprite: null,
        iframe: iframe
    };
}

    makeDraggable(win, handle) {
        if (!win._dragLogic) {
            win._dragLogic = {
                down: this._dragLogicDown,
                move: this._dragLogicMove,
                up:   this._dragLogicUp
            };
        }

        const iframe = win.querySelector('iframe');
        handle.style.userSelect = 'none';
        handle.style.cursor = 'move';

        const state = {
            isDown: false,
            startLeft: 0,
            startTop: 0,
            offsetX: 0,
            offsetY: 0,
            enabled: true,
            button: 0,
            snapGrid: 0,
            clamp: false,
            cursor: 'move'
        };
        win._dragState = state;

        const api = {
            setPos(x, y) {
                let nx = x, ny = y;
                if (state.snapGrid > 0) {
                    nx = Math.round(nx / state.snapGrid) * state.snapGrid;
                    ny = Math.round(ny / state.snapGrid) * state.snapGrid;
                }
                if (state.clamp) {
                    const maxX = window.innerWidth - win.offsetWidth;
                    const maxY = window.innerHeight - win.offsetHeight;
                    nx = Math.max(0, Math.min(nx, maxX));
                    ny = Math.max(0, Math.min(ny, maxY));
                }
                win.style.left = nx + 'px';
                win.style.top = ny + 'px';
            },
            getPos() {
                return { x: win.offsetLeft, y: win.offsetTop };
            },
            window: win,
            handle: handle,
            iframe: iframe
        };

        const compile = (src, name) => {
            try {
                return new Function('e', 'win', 'handle', 'iframe', 'state', 'api', src);
            } catch (err) {
                console.warn(`[DOMplugin] drag logic "${name}" compile lỗi:`, err);
                return () => {};
            }
        };

        let fnDown = compile(win._dragLogic.down, 'down');
        let fnMove = compile(win._dragLogic.move, 'move');
        let fnUp   = compile(win._dragLogic.up,   'up');

        const rebuild = () => {
            fnDown = compile(win._dragLogic.down, 'down');
            fnMove = compile(win._dragLogic.move, 'move');
            fnUp   = compile(win._dragLogic.up,   'up');
        };
        win._dragRebuild = rebuild;

        const onDown = (e) => { try { fnDown(e, win, handle, iframe, state, api); } catch (err) { console.warn(err); } };
        const onMove = (e) => { if (state.isDown) { try { fnMove(e, win, handle, iframe, state, api); } catch (err) { console.warn(err); } } };
        const onUp   = (e) => { try { fnUp(e, win, handle, iframe, state, api); } catch (err) { console.warn(err); } };

        handle.addEventListener('pointerdown', onDown);
        handle.addEventListener('pointermove', onMove);
        handle.addEventListener('pointerup', onUp);
        handle.addEventListener('pointercancel', onUp);

        win._dragCleanup = () => {
            handle.removeEventListener('pointerdown', onDown);
            handle.removeEventListener('pointermove', onMove);
            handle.removeEventListener('pointerup', onUp);
            handle.removeEventListener('pointercancel', onUp);
            win._dragRebuild = null;
        };
    }

    Allwindows(){
        return (Object.keys(this.windows));
    }

    getWindowPosition(args){
    const data = this.windows[String(args.ID)];
    if (!data) return '';
    const axis = String(args.AXIS).toLowerCase();
    if (axis === 'x') return data.element.offsetLeft;
    if (axis === 'y') return data.element.offsetTop;
    return `${"X: "+data.element.offsetLeft},${"Y: "+data.element.offsetTop}`;
    }

    setWindowCSS(args) {
        const data = this.windows[String(args.ID)];
        if (!data) return;

        const prop = String(args.PROP);
        const value = String(args.VALUE);

        if (prop in data.element.style) {
            data.element.style[prop] = value;
        } else {
            data.element.style.setProperty(prop, value);
        }

        if (data.iframe) {
            try {
                data.iframe.style.setProperty(prop, value);
            } catch (e) {}
        }
    }

    setWindowCSSFull(args) {
        const data = this.windows[String(args.ID)];
        if (!data) return;

        const styleStr = String(args.STYLE);

        styleStr.split(';').forEach(rule => {
            const idx = rule.indexOf(':');
            if (idx === -1) return;
            const name = rule.slice(0, idx).trim();
            const val = rule.slice(idx + 1).trim();
            if (!name) return;
            try {
                data.element.style.setProperty(name, val);
            } catch (e) {}
        });
    }

    getWindowCSS(args) {
        const data = this.windows[String(args.ID)];
        if (!data) return '';

        const prop = String(args.PROP);

        if (prop in data.element.style) {
            return data.element.style[prop] || '';
        }
        return getComputedStyle(data.element).getPropertyValue(prop) || '';
    }

    setWindowDrag(args) {
        const data = this.windows[String(args.ID)];
        if (!data) return;

        const state = data.element._dragState;
        if (!state) return;

        const mode = String(args.MODE);
        const raw = String(args.VALUE);

        switch (mode) {
            case 'enabled':
                state.enabled = (raw === 'true' || raw === '1');
                break;
            case 'snapGrid':
                state.snapGrid = Math.max(0, Number(raw) || 0);
                break;
            case 'clamp':
                state.clamp = (raw === 'true' || raw === '1');
                break;
            case 'cursor':
                state.cursor = raw;
                const handle = data.element.querySelector('div[style*="cursor"]')
                    || data.element.firstElementChild;
                if (handle) handle.style.cursor = raw;
                break;
            case 'button':
                state.button = Number(raw) === 2 ? 2 : 0;
                break;
        }
    }

    setDragLogic(args) {
        const data = this.windows[String(args.ID)];
        const phase = String(args.PHASE);
        const code = String(args.CODE);

        if (!data) {
            if (phase === 'down') this._dragLogicDown = code;
            if (phase === 'move') this._dragLogicMove = code;
            if (phase === 'up')   this._dragLogicUp   = code;
            return;
        }

        data.element._dragLogic = data.element._dragLogic || {
            down: this._dragLogicDown,
            move: this._dragLogicMove,
            up:   this._dragLogicUp
        };
        if (phase === 'down') data.element._dragLogic.down = code;
        if (phase === 'move') data.element._dragLogic.move = code;
        if (phase === 'up')   data.element._dragLogic.up   = code;

        data.element._dragRebuild?.();
    }

    appendDragLogic(args) {
        const data = this.windows[String(args.ID)];
        const phase = String(args.PHASE);
        const code = String(args.CODE);

        if (!data) return;
        data.element._dragLogic = data.element._dragLogic || {
            down: this._dragLogicDown,
            move: this._dragLogicMove,
            up:   this._dragLogicUp
        };
        if (phase === 'down') data.element._dragLogic.down += '\n' + code;
        if (phase === 'move') data.element._dragLogic.move += '\n' + code;
        if (phase === 'up')   data.element._dragLogic.up   += '\n' + code;

        data.element._dragRebuild?.();
    }

    resetDragLogic(args) {
        const data = this.windows[String(args.ID)];
        if (!data) return;
        data.element._dragLogic = {
            down: this._dragLogicDefault,
            move: this._dragLogicMoveDefault,
            up:   this._dragLogicUpDefault
        };
        data.element._dragRebuild?.();
    }

    getDragLogic(args) {
        const data = this.windows[String(args.ID)];
        const phase = String(args.PHASE);
        if (!data || !data.element._dragLogic) {
            if (phase === 'down') return this._dragLogicDown;
            if (phase === 'move') return this._dragLogicMove;
            if (phase === 'up')   return this._dragLogicUp;
            return '';
        }
        return data.element._dragLogic[phase] ?? '';
    }

    runWindowJS(args) {
        const id = String(args.ID);
        const data = this.windows[id];
        if (!data) return;

        const code = String(args.CODE);

        if (data.iframe) {
            try {
                data.iframe.contentWindow.eval(code);
            } catch (e) {
                console.warn('[DOMplugin] runWindowJS (iframe) lỗi:', e);
            }
            return;
        }

        const prevWin = globalThis.__DOMWIN__;
        const prevCanvas = globalThis.__DOMWIN_CANVAS__;
        const prevId = globalThis.__DOMWIN_ID__;
        const prevData = globalThis.__DOMWIN_DATA__;

        globalThis.__DOMWIN__ = data.element;
        globalThis.__DOMWIN_CANVAS__ = data.canvas;
        globalThis.__DOMWIN_ID__ = id;
        globalThis.__DOMWIN_DATA__ = data;

        try {
            (0, eval)(code);
        } catch (e) {
            console.warn('[DOMplugin] runWindowJS lỗi:', e);
        } finally {
            if (prevWin === undefined) delete globalThis.__DOMWIN__;
            else globalThis.__DOMWIN__ = prevWin;

            if (prevCanvas === undefined) delete globalThis.__DOMWIN_CANVAS__;
            else globalThis.__DOMWIN_CANVAS__ = prevCanvas;

            if (prevId === undefined) delete globalThis.__DOMWIN_ID__;
            else globalThis.__DOMWIN_ID__ = prevId;

            if (prevData === undefined) delete globalThis.__DOMWIN_DATA__;
            else globalThis.__DOMWIN_DATA__ = prevData;
        }
    }
}
const inst = runtime[`ext_${extId}`] = new extension();

  inst._dragLogicDefault = `
if (!state.enabled) return;
if (e.button !== state.button) return;
state.isDown = true;
const rect = win.getBoundingClientRect();
win.style.left = rect.left + 'px';
win.style.top = rect.top + 'px';
win.style.transform = 'none';
state.startLeft = rect.left;
state.startTop = rect.top;
state.offsetX = e.clientX;
state.offsetY = e.clientY;
if (iframe) iframe.style.pointerEvents = 'none';
e.preventDefault();
`;

inst._dragLogicMoveDefault = `
if (!state.isDown) return;
let x = state.startLeft + (e.clientX - state.offsetX);
let y = state.startTop + (e.clientY - state.offsetY);
api.setPos(x, y);
`;

inst._dragLogicUpDefault = `
if (!state.isDown) return;
state.isDown = false;
if (iframe) iframe.style.pointerEvents = 'auto';
`;

inst._dragLogicDown = inst._dragLogicDefault;
inst._dragLogicMove = inst._dragLogicMoveDefault;
inst._dragLogicUp   = inst._dragLogicUpDefault;

  Scratch.extensions.register(inst);
  vm._events['MOREFIELDS_REGISTERED'] = (() => {});
  vm.emit('MOREFIELDS_REGISTERED', inst, extension);
})(Scratch);
