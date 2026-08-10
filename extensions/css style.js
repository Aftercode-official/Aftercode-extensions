// name: css style
// description: custom css for page project
// license: MIT
(function(scratch) {

  'use strict';
  if (!scratch.extensions.unsandboxed) {
    throw new Error('This extension must be run unsandboxed');
  }

class katcss {

  constructor() {
    this.value = 1;
    
    this.customFiltersList = [
      { text: "filter: contrast", value: "filter: contrast" },
      { text: "filter: brightness", value: "filter: brightness" }
    ];
  }

  getInfo() {
    return {
      id: 'katcss',
      name: 'css style',
      color1: '#00aeff',
      color2: '#00a6ac',
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
          opcode: 'customcss',
          blockType: Scratch.BlockType.COMMAND,
          text: 'create custom css [CUSTOM]',
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
          items: 'getDynamicMenu'
        }
      }
    };
  }

  
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

  customcss(args) {
    const filterName = Scratch.Cast.toString(args.CUSTOM).trim();
    if (!filterName) return;

    
    const formattedValue = filterName.startsWith('filter:') ? filterName : "filter: " + filterName;

    
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

Scratch.extensions.register(new katcss());

}(Scratch));