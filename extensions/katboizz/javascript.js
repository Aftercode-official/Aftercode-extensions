//  Name: javascript v2
//  ID: javascript
//  Description: javascript code editor and runner for scratch
//  By: katboizz <https://scratch.mit.edu/users/katboizz/>
//  License: MIT
(function(Scratch) {
  'use strict';

if (!Scratch.extensions.unsandboxed) {
    throw new Error("must be ran unsandboxed");
}
// More field code
const extId = 'JavascriptV2';
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
      if (err) err.innerHTML = MESSAGE;
      Object.prototype.toString = toString;
    }, 100);
    throw new Error(MESSAGE);
  }
  function jsBeautifySimple(code) {
    let indent = 0;
    const src = String(code).replace(/\r\n/g, '\n');
    const lines = src.replace(/\s*([{};])\s*/g, '$1\n').split('\n');
    const out = [];
    for (let raw of lines) {
      let line = raw.trim();
      if (!line) continue;
      if (/^[}\])]/.test(line)) indent = Math.max(0, indent - 1);
      out.push('  '.repeat(indent) + line);
      if (/[{(\[]$/.test(line)) indent++;
    }
    return out.join('\n');
  }
  function jsMinifySimple(code) {
    return String(code)
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/(^|[^:])\/\/.*$/gm, '$1')
      .replace(/\s+/g, ' ')
      .replace(/\s*([{};:,=+\-*/<>()\[\]])\s*/g, '$1')
      .trim();
  }
  function countTokens(code) {
    const m = String(code).match(
      /[A-Za-z_$][\w$]*|\d+(\.\d+)?|"[^"]*"|'[^']*'|`[^`]*`|[{}()\[\];,.]|=>|===|!==|==|!=|<=|>=|&&|\|\||[+\-*/%<>=!&|^~?:]/g
    );
    return m ? m.length : 0;
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
        this._userW = 340;
        this._userH = 170;
      }
      updateWidth() {
        if (this._wrap && this._textareaHolder) {
          const totalW = this._userW;
          const totalH = this._userH;
          this._textareaHolder.setAttribute('width', String(totalW + 3));
          this._textareaHolder.setAttribute('height', String(totalH + 3));
          this.size_.width = totalW - BlockSvg.NOTCH_START_PADDING + 2 * BlockSvg.NOTCH_START_PADDING / 3;
          this.size_.height = totalH + BlockSvg.NOTCH_HEIGHT + 1.5 + BlockSvg.NOTCH_START_PADDING / 3;
        } else {
          this.size_.width = this._FakeWidth || 340;
          this.size_.height = this._FakeHeight || 170;
        }
      }
      dispose() {
        if (this._ro) this._ro.disconnect();
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
        this._FakeWidth ??= 340;
        this._FakeHeight ??= 170;
        const textareaHolder = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
        textareaHolder.setAttribute('style',
          'color-scheme: Dark;' +
          'color: #e06c75;' +
          'overflow: visible;'
        );
        textareaHolder.setAttribute('x', '6');
        textareaHolder.setAttribute('y', String(BlockSvg.NOTCH_START_PADDING / 2 - 0.375));
        textareaHolder.addEventListener('mousedown', (e) => e.stopPropagation());
        const wrap = document.createElement('div');
        wrap.setAttribute('style',
          'display: flex;' +
          'flex-direction: row;' +
          'width: ' + this._userW + 'px;' +
          'height: ' + this._userH + 'px;' +
          'background: #1e1e1e;' +
          'border: 1px solid #3c3c3c;' +
          'border-radius: 4px;' +
          'overflow: hidden;' +
          'box-sizing: border-box;' +
          'font-family: Consolas, Monaco, "Courier New", monospace;' +
          'font-size: 12px;' +
          'line-height: 1.4;' +
          'color-scheme: Dark;' +
          'color: #e06c75;' +
          'resize: both;' +
          'min-width: 200px;' +
          'min-height: 100px;' +
          'max-width: 900px;' +
          'max-height: 600px;'
        );
        const gutter = document.createElement('div');
        gutter.setAttribute('style',
          'flex-shrink: 0;' +
          'width: 32px;' +
          'background: #252526;' +
          'color: #858585;' +
          'text-align: right;' +
          'padding: 6px 6px 6px 8px;' +
          'user-select: none;' +
          'overflow: hidden;' +
          'border-right: 1px solid #3c3c3c;' +
          'line-height: 1.4;' +
          'font-size: 12px;' +
          'white-space: pre;' +
          'box-sizing: border-box;' +
          'color-scheme: Dark;'
        );
        gutter.textContent = '1';
        const textarea = document.createElement('textarea');
        textarea.value = this.getValue() ?? '';
        textarea.spellcheck = false;
        textarea.wrap = 'off';
        textarea.setAttribute('style',
          'flex: 1;' +
          'background: #1e1e1e;' +
          'color: #d4d4d4;' +
          'border: none;' +
          'outline: none;' +
          'padding: 6px 8px;' +
          'font-family: Consolas, Monaco, "Courier New", monospace;' +
          'font-size: 12px;' +
          'line-height: 1.4;' +
          'resize: none;' +
          'white-space: pre;' +
          'overflow: auto;' +
          'tab-size: 2;' +
          'box-sizing: border-box;' +
          'color-scheme: Dark;'
        );

        
        const updateGutter = () => {
          const n = textarea.value.split('\n').length;
          let out = '';
          for (let i = 1; i <= n; i++) out += i + '\n';
          gutter.textContent = out;
        };

        
        textarea.addEventListener('scroll', () => {
          gutter.scrollTop = textarea.scrollTop;
        });

        
        textarea.addEventListener('keydown', (e) => {
          e.stopPropagation();
          if (e.key === 'Tab') {
            e.preventDefault();
            const s = textarea.selectionStart;
            const en = textarea.selectionEnd;
            textarea.value = textarea.value.substring(0, s) + '  ' + textarea.value.substring(en);
            textarea.selectionStart = textarea.selectionEnd = s + 2;
            this.setValue(textarea.value);
            updateGutter();
          }
        });
        textarea.addEventListener('keyup', (e) => e.stopPropagation());
        textarea.addEventListener('input', () => {
          this.setValue(textarea.value);
          updateGutter();
        });
        textarea.addEventListener('mousedown', (e) => e.stopPropagation());

        
        wrap.appendChild(gutter);
        wrap.appendChild(textarea);
        textareaHolder.appendChild(wrap);

        
        this._textareaHolder = textareaHolder;
        this._textarea = textarea;
        this._gutter = gutter;
        this._wrap = wrap;

        if (this.fieldGroup_) {
          this.fieldGroup_.insertAdjacentElement('afterend', textareaHolder);
          if (this.sourceBlock_ && this.sourceBlock_.isInFlyout) {
            textarea.disabled = true;
            wrap.setAttribute('style',
              wrap.getAttribute('style') +
              'resize: none;' +
              'pointer-events: none;' +
              'opacity: 0.85;'
            );
          }
          if (window.ResizeObserver) {
            this._ro = new ResizeObserver(() => {
              
              if (this._wrap) {
                const w = this._wrap.offsetWidth;
                const h = this._wrap.offsetHeight;
                if (w && h && (w !== this._userW || h !== this._userH)) {
                  this._userW = w;
                  this._userH = h;
                }
              }
              this._resizeHolder();
            });
            this._ro.observe(this._wrap);
          }
        }

        updateGutter();
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
    };

    getInfo() {
      return {
        id: extId,
        name: 'javascript v2',
        color1: '#dad727',
        color2: '#a0ae27',
        blocks: [
          {
            opcode: 'runJSUnsandboxed',
            blockType: BlockType.COMMAND,
            text: 'run JS code [CODE]',
            arguments: {
              CODE: {
                type: Scratch.ArgumentType.TEXTAREA,
                defaultValue: '// JS code\nalert("Hello!");',
                exemptFromNormalization: true,
              },
            },
            allowDropAnywhere: true,
            blockShape: 3,
          },
          {
            opcode: 'ReturnValue',
            blockType: BlockType.REPORTER,
            text: 'run JS code [Value]',
            arguments: {
              Value: {
                type: Scratch.ArgumentType.TEXTAREA,
                defaultValue: '// return value\nconst test = 1 + 1\nreturn (test);',
                exemptFromNormalization: true,
              },
            },
          },

          { blockType: BlockType.XML, xml: '<sep gap="40" />' },

          {
            opcode: 'formatCode',
            blockType: BlockType.REPORTER,
            text: 'format JS [CODE]',
            arguments: {
              CODE: { type: Scratch.ArgumentType.STRING, defaultValue: 'const a=1;function b(){return 2}' },
            },
          },
          {
            opcode: 'minifyCode',
            blockType: BlockType.REPORTER,
            text: 'minify JS [CODE]',
            arguments: {
              CODE: { type: Scratch.ArgumentType.STRING, defaultValue: 'const a = 1; // comment' },
            },
          },
          {
            opcode: 'checkSyntax',
            blockType: BlockType.BOOLEAN,
            text: 'JS [CODE] is valid?',
            arguments: {
              CODE: { type: Scratch.ArgumentType.STRING, defaultValue: 'const a=1;' },
            },
          },
          {
            opcode: 'getSyntaxError',
            blockType: BlockType.REPORTER,
            text: 'JS error of [CODE]',
            arguments: {
              CODE: { type: Scratch.ArgumentType.STRING, defaultValue: 'const =;' },
            },
          },
          {
            opcode: 'evalToValue',
            blockType: BlockType.REPORTER,
            text: 'eval JS [CODE] as value',
            arguments: {
              CODE: { type: Scratch.ArgumentType.STRING, defaultValue: '1 + 1' },
            },
          },
          {
            opcode: 'getTokenCount',
            blockType: BlockType.REPORTER,
            text: 'token count of [CODE]',
            arguments: {
              CODE: { type: Scratch.ArgumentType.STRING, defaultValue: 'let x = 1;' },
            },
          },
          {
            opcode: 'getLineCount',
            blockType: BlockType.REPORTER,
            text: 'line count of [CODE]',
            arguments: {
              CODE: { type: Scratch.ArgumentType.STRING, defaultValue: 'let a=1;\nlet b=2;' },
            },
          },
          {
            opcode: 'getCharCount',
            blockType: BlockType.REPORTER,
            text: 'char count of [CODE]',
            arguments: {
              CODE: { type: Scratch.ArgumentType.STRING, defaultValue: 'hello' },
            },
          },
          {
            opcode: 'beautifyJSON',
            blockType: BlockType.REPORTER,
            text: 'pretty print JSON [CODE]',
            arguments: {
              CODE: { type: Scratch.ArgumentType.STRING, defaultValue: '{"a":1,"b":[2,3]}' },
            },
          },
          {
            opcode: 'getASTInfo',
            blockType: BlockType.REPORTER,
            text: 'AST info of [CODE]',
            arguments: {
              CODE: { type: Scratch.ArgumentType.STRING, defaultValue: 'function f(){} class A{}' },
            },
          },
        ],
        customFieldTypes,
      };
    }
    runJSUnsandboxed(args) {
      const CODE = args.CODE;
      try {
        return new Function(CODE)();
      } catch (e) {
        console.error('[Scratch JS]', e);
      }
    }
    ReturnValue(args) {
      const Value = args.Value;
      try {
        return new Function(Value)();
      } catch (e) {
        return 'Error: ' + e.message;
      }
    }

    formatCode(args) { return jsBeautifySimple(String(args.CODE)); }
    minifyCode(args) { return jsMinifySimple(String(args.CODE)); }
    checkSyntax(args) {
      try { new Function(String(args.CODE)); return true; }
      catch { return false; }
    }
    getSyntaxError(args) {
      try { new Function(String(args.CODE)); return ''; }
      catch (e) { return e.message; }
    }
    evalToValue(args) {
      try { return new Function('return (' + String(args.CODE) + ')')(); }
      catch (e) { return 'Error: ' + e.message; }
    }
    getTokenCount(args) { return countTokens(args.CODE); }
    getLineCount(args) { return String(args.CODE).split('\n').length; }
    getCharCount(args) { return String(args.CODE).length; }
    beautifyJSON(args) {
      try { return JSON.stringify(JSON.parse(String(args.CODE)), null, 2); }
      catch { return jsBeautifySimple(String(args.CODE)); }
    }
    getASTInfo(args) {
      const code = String(args.CODE);
      return JSON.stringify({
        functions: (code.match(/function\s+\w+|=>/g) || []).length,
        classes: (code.match(/class\s+\w+/g) || []).length,
        variables: (code.match(/\b(var|let|const)\s+\w+/g) || []).length,
        lines: code.split('\n').length,
        tokens: countTokens(code),
      });
    }
  }

  const inst = runtime[`ext_${extId}`] = new extension();
  Scratch.extensions.register(inst);
  vm._events['MOREFIELDS_REGISTERED'] = (() => {});
  vm.emit('MOREFIELDS_REGISTERED', inst, extension);
})(Scratch);