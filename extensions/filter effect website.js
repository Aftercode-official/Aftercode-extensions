// name: filter effect website
// description: filter effect website
// license: MIT
(function(scratch) {

  'use strict';
  if (!scratch.extensions.unsandboxed) {
    throw new Error('This extension must be run unsandboxed');
  }

class custompageeffect {

  constructor() {
    this.value = 1;
    // Danh sách các filter mặc định
    this.customFiltersList = [
      { text: "filter: contrast", value: "filter: contrast" },
      { text: "filter: brightness", value: "filter: brightness" }
    ];
  }

  getInfo() {
    return {
      id: 'katprojectpage',
      name: 'custom project page effect',
      color1: '#ffd900',
      color2: '#c0ad00',
      blocks: [
        {
          opcode: 'effect',
          blockType: Scratch.BlockType.COMMAND,
          text: 'set effect [STR] to [VALUE]',
          disableMonitor: true,
          arguments: {
            STR: {
              type: Scratch.ArgumentType.STRING,
              menu: 'STR'
            },
            VALUE: {
              type: Scratch.ArgumentType.NUMBER,
              defaultValue: 2
            }
          }
        },
        {
          opcode: 'changeEffect',
          blockType: Scratch.BlockType.COMMAND,
          text: 'change effect [STR] by [CHANGE]',
          disableMonitor: true,
          arguments: {
            STR: {
              type: Scratch.ArgumentType.STRING,
              menu: 'STR'
            },
            CHANGE: {
              type: Scratch.ArgumentType.NUMBER,
              defaultValue: 1
            }
          }
        },
        {
          opcode: 'customfilter',
          blockType: Scratch.BlockType.COMMAND,
          text: 'set custom filter to [CUSTOM]',
          disableMonitor: true,
          arguments: {
            CUSTOM: {
              type: Scratch.ArgumentType.STRING,
              defaultValue: 'grayscale'
            }
          }
        },
        {
          opcode: 'clearEffect',
          blockType: Scratch.BlockType.COMMAND,
          text: 'clear effect',
          disableMonitor: true
        }
      ],
      menus: {
        STR: {
          acceptReporters: true,
          items: 'getDynamicMenu' // Trỏ tới hàm tạo menu động
        }
      }
    };
  }

  // Hàm trả về danh sách menu động
  getDynamicMenu() {
    return this.customFiltersList;
  }

  effect(args) {
    this.value = Scratch.Cast.toNumber(args.VALUE);
    document.body.setAttribute('style', "width:100%;position:absolute!important;" + args.STR + "(" + this.value + ")");
  }

  changeEffect(args) {
    this.value += Scratch.Cast.toNumber(args.CHANGE);
    document.body.setAttribute('style', "width:100%;position:absolute!important;" + args.STR + "(" + this.value + ")");
  }

  clearEffect() {
    this.value = 1;
    document.body.setAttribute('style', "width:100%;position:absolute!important;");
  }

  customfilter(args) {
    const filterName = Scratch.Cast.toString(args.CUSTOM).trim();
    if (!filterName) return;

    // Chuẩn hóa chuỗi filter (ví dụ: 'invert' -> 'filter: invert')
    const formattedValue = filterName.startsWith('filter:') ? filterName : "filter: " + filterName;

    // Kiểm tra nếu chưa có trong danh sách thì tự động thêm vào dropdown
    const exists = this.customFiltersList.some(item => item.value === formattedValue);
    if (!exists) {
      this.customFiltersList.push({
        text: formattedValue,
        value: formattedValue
      });
    }

    // Áp dụng filter lên trang
    document.body.setAttribute('style', "width:100%;position:absolute!important;" + formattedValue);
  }
}

Scratch.extensions.register(new custompageeffect());

}(Scratch));