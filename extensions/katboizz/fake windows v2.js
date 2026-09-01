// Name: Fake windows v2
// Description: create a fake window in your project page
// By: katboizz <https://scratch.mit.edu/users/katboizz/>
// License: MIT
(function(Scratch) {
  'use strict';

if (!Scratch.extensions.unsandboxed) {
    throw new Error("must be ran unsandboxed");
}
const extId = 'FakeWindowsv2';
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
   const DOOMcheck = (vm.runtime.ioDevices.userData._username === 'DOOM1997');
  const searchParams = new URLSearchParams(globalThis.location.search);
  const _hideInlineTextarea = !searchParams.has('MoreFields_InlineTextarea');
  const padding = JSON.parse(localStorage['tw:addons'] || JSON.stringify(globalThis.scratchAddons ? scratchAddons.globalState.addonSettings : {'custom-block-shape': { cornerSize: 100, notchSize: 100, paddingSize: 100 }}))['custom-block-shape'] || { cornerSize: 100, notchSize: 100, paddingSize: 100 };
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
    // Temporary fix for the annoying error:
    // '<text> attribute x: Expected length, "NaN".'
    const _setAttribute = SVGTextElement.prototype.setAttribute;
    SVGTextElement.prototype.setAttribute = function(attr, val, ...args) {
      if (String(val) === 'NaN' && (attr === 'x' || attr === 'y') && this.getAttribute('class') === 'blocklyText') {
        const nattr = `MoreFieldsAttrErr${attr.toUpperCase()}`;
        _setAttribute.call(this, nattr, `Attempted an illegal set on this text node. ${attr.toUpperCase()} was set to NaN.`);
        return _setAttribute.call(this, attr, '0', ...args);
      }
      return _setAttribute.call(this, attr, val, ...args);
    };
    // Patch for a bug in size_.height
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
          this.size_.width = this._FakeWidth || 40;
          this.size_.height = this._FakeHeight || 24;
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
        this._FakeWidth ??= 40;
        this._FakeHeight ??= 24;
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
    implementations.FieldInlineDoom = class FieldInlineDoom extends Blockly.Field {
        showEditor_() {}
        constructor(opt_value) {
            opt_value = 'InlineDoom';
            super(opt_value);
            this.addArgType('String');
            this.addArgType('InlineDoom');
        }
        updateWidth() {
            this.size_.width = 650;
            this.size_.height = 410;
        }
        dispose(...a) {
            Blockly.Field.prototype.dispose.call(this, ...a);
            if (this._fObj) this._fObj.remove();
            delete this._fObj;
        }
        init(...initArgs) {
            this.inlineDblRender = true;
            Blockly.Field.prototype.init.call(this, ...initArgs);
            this.textNode__ = this.sourceBlock_.svgPath_.parentNode.querySelector('g.blocklyEditableText text');
            if (this.textNode__) {
            this.textNode__.style.display = 'none';
            if (this.sourceBlock_.parentBlock_) _fixColours.call(this, false, this.sourceBlock_.parentBlock_.colour_);
            }
            const fg_ = this.fieldGroup_;
            if (!fg_) return;
            const path = fg_?.previousElementSibling;
            if (path?.nodeName !== 'path') return;
            const fObj = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
            fObj.setAttribute('width', '650');
            fObj.setAttribute('height', '410');
            fObj.setAttribute('x', '0');
            fObj.setAttribute('y', '0');
            this._fObj = fObj;
            this.fg_ = fg_;
            if (this.fieldGroup_) this.fieldGroup_.insertAdjacentElement('afterend', fObj);
            this._addDOOM();
        }
        _addDOOM() {
            const frame = document.createElement('iframe');
            frame.width = 640;
            frame.height = 400;
            frame.id = 'DOOM';
            this._fObj.appendChild(frame);
            frame.srcdoc = atob(`PCEtLSBPUklHSU5BTDogaHR0cHM6Ly9kaWVrbWFubi5naXRodWIuaW8vd2FzbS1maXp6YnV6ei9kb29tLyAtLT48IWRvY3R5cGVodG1sPjxodG1sPjxib2R5PjxET09NPjxzdHlsZT4jb3V0cHV0e2JvcmRlcjozcHggZ3Jvb3ZlICM3ZmZmZDQ7YmFja2dyb3VuZC1jb2xvcjpiaXNxdWU7d2lkdGg6NTUwcHg7aGVpZ2h0OjQwMHB4O2ZvbnQtZmFtaWx5Om1vbm9zcGFjZSxzZXJpZjtmb250LXNpemU6MTBweDtvdmVyZmxvdy15OnNjcm9sbH0jb3V0cHV0IHNwYW4ubG9ne2NvbG9yOiM0ODNkOGJ9I291dHB1dCBzcGFuLnN0ZG91dHtjb2xvcjojMDAwfSNvdXRwdXQgc3Bhbi5zdGRlcnJ7Zm9udC13ZWlnaHQ6NzAwO2NvbG9yOmJyb3dufS5jb250YWluZXJ7ZGlzcGxheTpmbGV4fSp7bWFyZ2luOjBweDtwYWRkaW5nOjBweH08L3N0eWxlPjxzcGFuIGhpZGRlbj48cCBpZD1mb2N1c2hpbnQ+PC9wPjxwPjxidXR0b24gaWQ9ZW50ZXJCdXR0b24+PC9idXR0b24+PGJ1dHRvbiBpZD1sZWZ0QnV0dG9uPjwvYnV0dG9uPjxidXR0b24gaWQ9dXBCdXR0b24+PC9idXR0b24+PGJ1dHRvbiBpZD1kb3duQnV0dG9uPjwvYnV0dG9uPjxidXR0b24gaWQ9cmlnaHRCdXR0b24+PC9idXR0b24+IDxidXR0b24gaWQ9Y3RybEJ1dHRvbj48L2J1dHRvbj48YnV0dG9uIGlkPXNwYWNlQnV0dG9uPjwvYnV0dG9uPiA8YnV0dG9uIGlkPWFsdEJ1dHRvbj48L2J1dHRvbj48L3A+PC9zcGFuPjxkaXYgY2xhc3M9Y29udGFpbmVyPjxjYW52YXMgaGVpZ2h0PTQwMCBpZD1zY3JlZW4gdGFiaW5kZXg9MCB3aWR0aD02NDA+VGhpcyBpcyB3aGVyZSB0aGUgRG9vTSBzY3JlZW4gc2hvdWxkIHJlbmRlci48L2NhbnZhcz48ZGl2IGhpZGRlbiBpZD1vdXRwdXQ+PC9kaXY+PC9kaXY+PHNwYW4gaGlkZGVuPjxzcGFuIGlkPWdldG1zcHNfc3RhdHM+PC9zcGFuPjxzcGFuIGlkPWdldG1zX3N0YXRzPjwvc3Bhbj4gPHNwYW4gaWQ9ZnBzX3N0YXRzPjwvc3Bhbj48c3BhbiBpZD1kcmF3ZnJhbWVzX3N0YXRzPjwvc3Bhbj4gPHNwYW4gaWQ9YW5pbWF0aW9uZnBzX3N0YXRzPjwvc3Bhbj48L3NwYW4+PHNjcmlwdCBkZWZlcj4idXNlIHN0cmljdCI7dmFyIG1lbW9yeT1uZXcgV2ViQXNzZW1ibHkuTWVtb3J5KHtpbml0aWFsOjEwOH0pO2NvbnN0IG91dHB1dD1kb2N1bWVudC5nZXRFbGVtZW50QnlJZCgib3V0cHV0Iik7ZnVuY3Rpb24gcmVhZFdhc21TdHJpbmcodCxlKXtsZXQgbj1uZXcgVWludDhBcnJheShtZW1vcnkuYnVmZmVyLHQsZSk7cmV0dXJuIG5ldyBUZXh0RGVjb2RlcigidXRmOCIpLmRlY29kZShuKX1mdW5jdGlvbiBjb25zb2xlTG9nU3RyaW5nKHQsZSl7bGV0IG49cmVhZFdhc21TdHJpbmcodCxlKTtjb25zb2xlLmxvZygnIicrbisnIicpfWZ1bmN0aW9uIGFwcGVuZE91dHB1dCh0KXtyZXR1cm4gZnVuY3Rpb24oZSxuKXtsZXQgcz1yZWFkV2FzbVN0cmluZyhlLG4pLnNwbGl0KCJcbiIpO2Zvcih2YXIgYT0wO2E8cy5sZW5ndGg7KythKWlmKDAhPXNbYV0ubGVuZ3RoKXt2YXIgcj1kb2N1bWVudC5jcmVhdGVFbGVtZW50KCJzcGFuIik7ci5jbGFzc0xpc3QuYWRkKHQpLHIuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoc1thXSkpLG91dHB1dC5hcHBlbmRDaGlsZChyKSxvdXRwdXQuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgiYnIiKSksci5zY3JvbGxJbnRvVmlldyh7YmVoYXZpb3I6InNtb290aCIsYmxvY2s6ImVuZCIsaW5saW5lOiJuZWFyZXN0In0pfX19Y29uc3QgZ2V0bXNwc19zdGF0cz1kb2N1bWVudC5nZXRFbGVtZW50QnlJZCgiZ2V0bXNwc19zdGF0cyIpLGdldG1zX3N0YXRzPWRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCJnZXRtc19zdGF0cyIpO3ZhciBnZXRtc19jYWxsc190b3RhbD0wLGdldG1zX2NhbGxzPTA7ZnVuY3Rpb24gZ2V0TWlsbGlzZWNvbmRzKCl7cmV0dXJuKytnZXRtc19jYWxscyxwZXJmb3JtYW5jZS5ub3coKX13aW5kb3cuc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKXtnZXRtc19jYWxsc190b3RhbCs9Z2V0bXNfY2FsbHMsZ2V0bXNwc19zdGF0cy5pbm5lclRleHQ9Z2V0bXNfY2FsbHMvMWUzKyJrIixnZXRtc19zdGF0cy5pbm5lclRleHQ9Z2V0bXNfY2FsbHNfdG90YWwsZ2V0bXNfY2FsbHM9MH0sMWUzKTtjb25zdCBjYW52YXM9ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoInNjcmVlbiIpLGRvb21fc2NyZWVuX3dpZHRoPTY0MCxkb29tX3NjcmVlbl9oZWlnaHQ9NDAwLGZwc19zdGF0cz1kb2N1bWVudC5nZXRFbGVtZW50QnlJZCgiZnBzX3N0YXRzIiksZHJhd2ZyYW1lc19zdGF0cz1kb2N1bWVudC5nZXRFbGVtZW50QnlJZCgiZHJhd2ZyYW1lc19zdGF0cyIpO3ZhciBudW1iZXJfb2ZfZHJhd3NfdG90YWw9MCxudW1iZXJfb2ZfZHJhd3M9MDtmdW5jdGlvbiBkcmF3Q2FudmFzKHQpe3ZhciBlPW5ldyBVaW50OENsYW1wZWRBcnJheShtZW1vcnkuYnVmZmVyLHQsMTAyNGUzKSxuPW5ldyBJbWFnZURhdGEoZSw2NDAsNDAwKTtjYW52YXMuZ2V0Q29udGV4dCgiMmQiKS5wdXRJbWFnZURhdGEobiwwLDApLCsrbnVtYmVyX29mX2RyYXdzfXdpbmRvdy5zZXRJbnRlcnZhbChmdW5jdGlvbigpe251bWJlcl9vZl9kcmF3c190b3RhbCs9bnVtYmVyX29mX2RyYXdzLGRyYXdmcmFtZXNfc3RhdHMuaW5uZXJUZXh0PW51bWJlcl9vZl9kcmF3c190b3RhbCxmcHNfc3RhdHMuaW5uZXJUZXh0PW51bWJlcl9vZl9kcmF3cyxudW1iZXJfb2ZfZHJhd3M9MH0sMWUzKTt2YXIgaW1wb3J0T2JqZWN0PXtqczp7anNfY29uc29sZV9sb2c6YXBwZW5kT3V0cHV0KCJsb2ciKSxqc19zdGRvdXQ6YXBwZW5kT3V0cHV0KCJzdGRvdXQiKSxqc19zdGRlcnI6YXBwZW5kT3V0cHV0KCJzdGRlcnIiKSxqc19taWxsaXNlY29uZHNfc2luY2Vfc3RhcnQ6Z2V0TWlsbGlzZWNvbmRzLGpzX2RyYXdfc2NyZWVuOmRyYXdDYW52YXN9LGVudjp7bWVtb3J5Om1lbW9yeX19O1dlYkFzc2VtYmx5Lmluc3RhbnRpYXRlU3RyZWFtaW5nKGZldGNoKCJodHRwczovL21peW8ubG9sL2Rvb20ud2FzbSIpLGltcG9ydE9iamVjdCkudGhlbih0PT57dC5pbnN0YW5jZS5leHBvcnRzLm1haW4oKTtsZXQgZT1mdW5jdGlvbih0KXtzd2l0Y2godCl7Y2FzZSA4OnJldHVybiAxMjc7Y2FzZSAxNzpyZXR1cm4gMTU3O2Nhc2UgMTg6cmV0dXJuIDE4NDtjYXNlIDM3OnJldHVybiAxNzI7Y2FzZSAzODpyZXR1cm4gMTczO2Nhc2UgMzk6cmV0dXJuIDE3NDtjYXNlIDQwOnJldHVybiAxNzU7ZGVmYXVsdDppZih0Pj02NSYmdDw9OTApcmV0dXJuIHQrMzI7aWYodD49MTEyJiZ0PD0xMjMpcmV0dXJuIHQrNzU7cmV0dXJuIHR9fSxuPWZ1bmN0aW9uKGUpe3QuaW5zdGFuY2UuZXhwb3J0cy5hZGRfYnJvd3Nlcl9ldmVudCgwLGUpfSxzPWZ1bmN0aW9uKGUpe3QuaW5zdGFuY2UuZXhwb3J0cy5hZGRfYnJvd3Nlcl9ldmVudCgxLGUpfTtjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcigia2V5ZG93biIsZnVuY3Rpb24odCl7bihlKHQua2V5Q29kZSkpLHQucHJldmVudERlZmF1bHQoKX0sITEpLGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKCJrZXl1cCIsZnVuY3Rpb24odCl7cyhlKHQua2V5Q29kZSkpLHQucHJldmVudERlZmF1bHQoKX0sITEpLFtbImVudGVyQnV0dG9uIiwxM10sWyJsZWZ0QnV0dG9uIiwxNzJdLFsicmlnaHRCdXR0b24iLDE3NF0sWyJ1cEJ1dHRvbiIsMTczXSxbImRvd25CdXR0b24iLDE3NV0sWyJjdHJsQnV0dG9uIiwxNTddLFsic3BhY2VCdXR0b24iLDMyXSxbImFsdEJ1dHRvbiIsMTg0XV0uZm9yRWFjaCgoW3QsZV0pPT57Y29uc29sZS5sb2codCsiIGZvciAiK2UpO3ZhciBhPWRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHQpO2EuYWRkRXZlbnRMaXN0ZW5lcigidG91Y2hzdGFydCIsKCk9Pm4oZSkpLGEuYWRkRXZlbnRMaXN0ZW5lcigidG91Y2hlbmQiLCgpPT5zKGUpKSxhLmFkZEV2ZW50TGlzdGVuZXIoInRvdWNoY2FuY2VsIiwoKT0+cyhlKSl9KTtsZXQgYT1kb2N1bWVudC5nZXRFbGVtZW50QnlJZCgiZm9jdXNoaW50Iikscj1mdW5jdGlvbih0KXthLmlubmVyVGV4dD0iS2V5Ym9hcmQgZXZlbnRzIHdpbGwgYmUgY2FwdHVyZWQgYXMgbG9uZyBhcyB0aGUgdGhlIERPT00gY2FudmFzIGhhcyBmb2N1cy4iLGEuc3R5bGUuZm9udFdlaWdodD0ibm9ybWFsIn07Y2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoImZvY3VzaW4iLHIsITEpLGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKCJmb2N1c291dCIsZnVuY3Rpb24odCl7YS5pbm5lclRleHQ9IkNsaWNrIG9uIHRoZSBjYW52YXMgdG8gY2FwdXRlIGlucHV0IGFuZCBzdGFydCBwbGF5aW5nLiIsYS5zdHlsZS5mb250V2VpZ2h0PSJib2xkIn0sITEpLGNhbnZhcy5mb2N1cygpLHIoKTtsZXQgbz1kb2N1bWVudC5nZXRFbGVtZW50QnlJZCgiYW5pbWF0aW9uZnBzX3N0YXRzIik7dmFyIHU9MDtmdW5jdGlvbiBjKGUpeysrdSx0Lmluc3RhbmNlLmV4cG9ydHMuZG9vbV9sb29wX3N0ZXAoKSx3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKGMpfXdpbmRvdy5zZXRJbnRlcnZhbChmdW5jdGlvbigpe28uaW5uZXJUZXh0PXUsdT0wfSwxZTMpLHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoYyl9KTs8L3NjcmlwdD48L0RPT00+PC9ib2R5PjwvaHRtbD4=`);
        }
        }
        gotBlockly._registerFields();
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
      // https://github.com/TurboWarp/addons/blob/tw/addons/custom-block-shape/update-all-blocks.js
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
            name: 'Fake Windows v2',
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
                    xml: '<sep gap="46" />',
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
                opcode: 'getWindowPosition',
                blockType: Scratch.BlockType.REPORTER,
                text: 'get window [ID] position',
                arguments: {
                    ID: { type: Scratch.ArgumentType.STRING, defaultValue: "win1" },
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
        sprite: null
    };
}


    closeWindow(args) {
        const id = String(args.ID);
        const data = this.windows[id];
        if (!data) return;

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
    iframe.sandbox = 'allow-scripts allow-modals allow-same-origin';
    iframe.srcdoc = htmlCode;

    win.appendChild(titleBar);
    win.appendChild(iframe);
    document.body.appendChild(win);

    this.makeDraggable(win, titleBar); 

    this.activeHtmlFrame = iframe;
    this.windows[id] = {
        element: win,   
        canvas: null,
        sprite: null
    };
}

    makeDraggable(win, handle) {
        let isDown = false;
        let offsetX = 0;
        let offsetY = 0;

        handle.addEventListener('mousedown', (e) => {
            isDown = true;
            offsetX = e.clientX - win.offsetLeft;
            offsetY = e.clientY - win.offsetTop;
        });

        document.addEventListener('mouseup', () => isDown = false);

        document.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            win.style.left = (e.clientX - offsetX) + 'px';
            win.style.top = (e.clientY - offsetY) + 'px';
        });
    }

    Allwindows(){
        return (Object.keys(this.windows));
    }

    getWindowPosition(args){
        const data = this.windows[String(args.ID)];
        if (!data) return '';
        return `${"X: "+data.element.offsetLeft},${"Y: "+data.element.offsetTop}`;
    }
}
const inst = runtime[`ext_${extId}`] = new extension();
  Scratch.extensions.register(inst);
  vm._events['MOREFIELDS_REGISTERED'] = (() => {});
  vm.emit('MOREFIELDS_REGISTERED', inst, extension);
})(Scratch);