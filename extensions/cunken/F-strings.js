// Name: Escape & F-String
// ID: textEscapeAndFString
// Description: Cung cấp các ký tự đặc biệt và f-string (chuỗi định dạng) cho Scratch.
// By: Cunken <https://scratch.mit.edu/users/cunken/>
// License: MIT

(function (Scratch) {
  'use strict';

  if (!Scratch.extensions.unsandboxed) {
    throw new Error('Extension này cần chạy ở chế độ Unsandboxed (không hộp cát).');
  }

  class TextEscapeAndFString {
    constructor() {
      this.customVars = Object.create(null);
    }

    getInfo() {
      return {
        id: 'textEscapeAndFString',
        name: 'Escape & F-String',
        color1: '#6E3AFF',
        color2: '#5424D6',
        color3: '#3D16A8',
        blocks: [
          {
            opcode: 'newlineChar',
            blockType: Scratch.BlockType.REPORTER,
            text: '"\\n"',
            disableMonitor: false
          },
          {
            opcode: 'tabChar',
            blockType: Scratch.BlockType.REPORTER,
            text: '"\\t"',
            disableMonitor: false
          },
          {
            opcode: 'crChar',
            blockType: Scratch.BlockType.REPORTER,
            text: '"\\r"',
            disableMonitor: false
          },
          {
            opcode: 'backslashChar',
            blockType: Scratch.BlockType.REPORTER,
            text: '"\\\\"',
            disableMonitor: false
          },
          '---',
          {
            opcode: 'fString',
            blockType: Scratch.BlockType.REPORTER,
            text: 'f"[TEMPLATE]"',
            arguments: {
              TEMPLATE: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'Chào {con khỉ nhà mày}, 2 + 3 = {2 + 3}'
              }
            }
          },
          {
            opcode: 'fStringWithVar',
            blockType: Scratch.BlockType.REPORTER,
            text: 'f"[TEMPLATE]" với [VAR_NAME] = [VAR_VAL]',
            arguments: {
              TEMPLATE: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'Độ gey của {user}: {score}'
              },
              VAR_NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'user'
              },
              VAR_VAL: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'kat gey'
              }
            }
          },
          '---',
          {
            opcode: 'setCustomVar',
            blockType: Scratch.BlockType.COMMAND,
            text: 'đặt biến f-string [NAME] thành [VAL]',
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'x'
              },
              VAL: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: '10'
              }
            }
          },
          {
            opcode: 'unescapeString',
            blockType: Scratch.BlockType.REPORTER,
            text: 'giải mã \\n \\t trong [TEXT]',
            arguments: {
              TEXT: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'Dòng 1\\n\\tDòng 2'
              }
            }
          }
        ]
      };
    }

    newlineChar() {
      return '\n';
    }

    tabChar() {
      return '\t';
    }

    crChar() {
      return '\r';
    }

    backslashChar() {
      return '\\';
    }

    setCustomVar(args) {
      const name = String(args.NAME ?? '').trim();
      if (!name) return;
      this.customVars[name] = args.VAL;
    }

    unescapeString(args) {
      const raw = String(args.TEXT ?? '');
      return this._unescape(raw);
    }

    fString(args) {
      const template = String(args.TEMPLATE ?? '');
      return this._evalFString(template, this.customVars);
    }

    fStringWithVar(args) {
      const template = String(args.TEMPLATE ?? '');
      const localScope = Object.assign(Object.create(null), this.customVars);
      const varName = String(args.VAR_NAME ?? '').trim();
      if (varName) {
        localScope[varName] = args.VAR_VAL;
      }
      return this._evalFString(template, localScope);
    }

    _unescape(str) {
      let result = '';
      for (let i = 0; i < str.length; i++) {
        const ch = str[i];
        if (ch === '\\' && i + 1 < str.length) {
          const next = str[i + 1];
          if (next === 'n') {
            result += '\n';
            i++;
          } else if (next === 't') {
            result += '\t';
            i++;
          } else if (next === 'r') {
            result += '\r';
            i++;
          } else if (next === '\\') {
            result += '\\';
            i++;
          } else if (next === '{') {
            result += '\\{';
            i++;
          } else if (next === '}') {
            result += '\\}';
            i++;
          } else {
            result += ch;
          }
        } else {
          result += ch;
        }
      }
      return result;
    }

    _evalFString(template, scope) {
      let output = '';
      let i = 0;

      while (i < template.length) {
        if (template[i] === '\\' && i + 1 < template.length) {
          const next = template[i + 1];
          if (next === '{' || next === '}') {
            output += next;
            i += 2;
            continue;
          }
          if (next === 'n') {
            output += '\n';
            i += 2;
            continue;
          }
          if (next === 't') {
            output += '\t';
            i += 2;
            continue;
          }
          if (next === 'r') {
            output += '\r';
            i += 2;
            continue;
          }
          if (next === '\\') {
            output += '\\';
            i += 2;
            continue;
          }
        }

        if (template[i] === '{') {
          let depth = 1;
          let j = i + 1;
          let expr = '';
          let closed = false;

          while (j < template.length) {
            const c = template[j];
            if (c === '\\' && j + 1 < template.length) {
              expr += c + template[j + 1];
              j += 2;
              continue;
            }
            if (c === '{') {
              depth++;
            } else if (c === '}') {
              depth--;
              if (depth === 0) {
                closed = true;
                break;
              }
            }
            expr += c;
            j++;
          }

          if (closed) {
            output += this._evaluateExpression(expr.trim(), scope);
            i = j + 1;
            continue;
          }
        }

        output += template[i];
        i++;
      }

      return output;
    }

    _evaluateExpression(expr, scope) {
      if (!expr) return '';

      if (Object.prototype.hasOwnProperty.call(scope, expr)) {
        const val = scope[expr];
        return val === undefined || val === null ? '' : String(val);
      }

      try {
        const keys = Object.keys(scope);
        const values = keys.map((k) => {
          const v = scope[k];
          if (v === '' || Number.isNaN(Number(v))) return v;
          return Number(v);
        });

        const forbidden = /\b(window|document|globalThis|process|eval|Function|fetch|XMLHttpRequest|import|require)\b/;
        if (forbidden.test(expr)) {
          return `{${expr}}`;
        }

        // eslint-disable-next-line no-new-func
        const fn = new Function(...keys, `"use strict"; return (${expr});`);
        const res = fn(...values);
        return res === undefined || res === null ? '' : String(res);
      } catch (_) {
        return `{${expr}}`;
      }
    }
  }

  Scratch.extensions.register(new TextEscapeAndFString());
})(Scratch);
