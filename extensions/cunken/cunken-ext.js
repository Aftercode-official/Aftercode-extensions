// Name: Asset Downloader & Temp Vars
// ID: assetDownloaderTempVars
// Description: some stuff from cunken idk
// By: Cunken <https://turbows.pages.dev/users/cunken_py>
// License: MIT

(function (Scratch) {
  'use strict';

  if (!Scratch.extensions.unsandboxed) {
    throw new Error('This extension requires unsandboxed mode to run!');
  }

  class GeneratedExtension {
    constructor() {
      this._tempVars = new Map();
      this._tempLists = new Map();
    }

    getInfo() {
      return {
        id: 'assetDownloaderTempVars',
        name: 'Asset Downloader & Temp Vars',
        color1: '#ff8c00',
        color2: '#e57e00',
        color3: '#cc7000',
        blocks: [
          // ==========================================
          // SECTION 1: TEMP VARIABLES
          // ==========================================
          {
            blockType: Scratch.BlockType.LABEL,
            text: '--- TEMP VARIABLES ---'
          },
          {
            opcode: 'setTempVar',
            blockType: Scratch.BlockType.COMMAND,
            text: 'set temp var [NAME] to [VALUE]',
            arguments: {
              NAME: { type: Scratch.ArgumentType.STRING, defaultValue: 'temp1' },
              VALUE: { type: Scratch.ArgumentType.STRING, defaultValue: '0' }
            }
          },
          {
            opcode: 'getTempVar',
            blockType: Scratch.BlockType.REPORTER,
            text: 'temp var [NAME]',
            arguments: {
              NAME: { type: Scratch.ArgumentType.STRING, defaultValue: 'temp1' }
            }
          },
          {
            opcode: 'deleteTempVar',
            blockType: Scratch.BlockType.COMMAND,
            text: 'delete temp var [NAME]',
            arguments: {
              NAME: { type: Scratch.ArgumentType.STRING, defaultValue: 'temp1' }
            }
          },
          {
            opcode: 'clearAllTempVars',
            blockType: Scratch.BlockType.COMMAND,
            text: 'clear all temp vars',
            arguments: {}
          },
          {
            opcode: 'swapTempVariables',
            blockType: Scratch.BlockType.COMMAND,
            text: 'swap temp var [VAR1] with [VAR2]',
            arguments: {
              VAR1: { type: Scratch.ArgumentType.STRING, defaultValue: 'temp1' },
              VAR2: { type: Scratch.ArgumentType.STRING, defaultValue: 'temp2' }
            }
          },
          {
            opcode: 'getTempVarsJSON',
            blockType: Scratch.BlockType.REPORTER,
            text: 'all temp vars as JSON',
            arguments: {}
          },
          {
            opcode: 'swapRealVariables',
            blockType: Scratch.BlockType.COMMAND,
            text: 'swap real variable [VAR1] with [VAR2]',
            arguments: {
              VAR1: { type: Scratch.ArgumentType.STRING, defaultValue: 'variable1' },
              VAR2: { type: Scratch.ArgumentType.STRING, defaultValue: 'variable2' }
            }
          },

          '---',

          // ==========================================
          // SECTION 2: TEMP LISTS
          // ==========================================
          {
            blockType: Scratch.BlockType.LABEL,
            text: '--- TEMP LISTS ---'
          },
          {
            opcode: 'addTempListItem',
            blockType: Scratch.BlockType.COMMAND,
            text: 'add [ITEM] to temp list [LIST_NAME]',
            arguments: {
              ITEM: { type: Scratch.ArgumentType.STRING, defaultValue: 'thing' },
              LIST_NAME: { type: Scratch.ArgumentType.STRING, defaultValue: 'tempList1' }
            }
          },
          {
            opcode: 'deleteTempListItem',
            blockType: Scratch.BlockType.COMMAND,
            text: 'delete item [INDEX] of temp list [LIST_NAME]',
            arguments: {
              INDEX: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 },
              LIST_NAME: { type: Scratch.ArgumentType.STRING, defaultValue: 'tempList1' }
            }
          },
          {
            opcode: 'deleteAllTempListItems',
            blockType: Scratch.BlockType.COMMAND,
            text: 'delete all of temp list [LIST_NAME]',
            arguments: {
              LIST_NAME: { type: Scratch.ArgumentType.STRING, defaultValue: 'tempList1' }
            }
          },
          {
            opcode: 'insertTempListItem',
            blockType: Scratch.BlockType.COMMAND,
            text: 'insert [ITEM] at [INDEX] of temp list [LIST_NAME]',
            arguments: {
              ITEM: { type: Scratch.ArgumentType.STRING, defaultValue: 'thing' },
              INDEX: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 },
              LIST_NAME: { type: Scratch.ArgumentType.STRING, defaultValue: 'tempList1' }
            }
          },
          {
            opcode: 'replaceTempListItem',
            blockType: Scratch.BlockType.COMMAND,
            text: 'replace item [INDEX] of temp list [LIST_NAME] with [ITEM]',
            arguments: {
              INDEX: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 },
              LIST_NAME: { type: Scratch.ArgumentType.STRING, defaultValue: 'tempList1' },
              ITEM: { type: Scratch.ArgumentType.STRING, defaultValue: 'thing' }
            }
          },
          {
            opcode: 'getTempListItem',
            blockType: Scratch.BlockType.REPORTER,
            text: 'item [INDEX] of temp list [LIST_NAME]',
            arguments: {
              INDEX: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 },
              LIST_NAME: { type: Scratch.ArgumentType.STRING, defaultValue: 'tempList1' }
            }
          },
          {
            opcode: 'getTempListItemIndex',
            blockType: Scratch.BlockType.REPORTER,
            text: 'item # of [ITEM] in temp list [LIST_NAME]',
            arguments: {
              ITEM: { type: Scratch.ArgumentType.STRING, defaultValue: 'thing' },
              LIST_NAME: { type: Scratch.ArgumentType.STRING, defaultValue: 'tempList1' }
            }
          },
          {
            opcode: 'getTempListLength',
            blockType: Scratch.BlockType.REPORTER,
            text: 'length of temp list [LIST_NAME]',
            arguments: {
              LIST_NAME: { type: Scratch.ArgumentType.STRING, defaultValue: 'tempList1' }
            }
          },
          {
            opcode: 'tempListContainsItem',
            blockType: Scratch.BlockType.BOOLEAN,
            text: 'temp list [LIST_NAME] contains [ITEM]?',
            arguments: {
              LIST_NAME: { type: Scratch.ArgumentType.STRING, defaultValue: 'tempList1' },
              ITEM: { type: Scratch.ArgumentType.STRING, defaultValue: 'thing' }
            }
          },
          {
            opcode: 'getTempListJSON',
            blockType: Scratch.BlockType.REPORTER,
            text: 'temp list [LIST_NAME] as JSON',
            arguments: {
              LIST_NAME: { type: Scratch.ArgumentType.STRING, defaultValue: 'tempList1' }
            }
          },

          '---',

          // ==========================================
          // SECTION 3: ASSET DOWNLOADER & UTILS
          // ==========================================
          {
            blockType: Scratch.BlockType.LABEL,
            text: '--- ASSET DOWNLOADER & UTILS ---'
          },
          {
            opcode: 'downloadEntireSprite',
            blockType: Scratch.BlockType.COMMAND,
            text: 'download sprite [SPRITE_NAME] as [FORMAT]',
            arguments: {
              SPRITE_NAME: { type: Scratch.ArgumentType.STRING, defaultValue: 'Sprite1' },
              FORMAT: { type: Scratch.ArgumentType.STRING, menu: 'spriteFormatMenu', defaultValue: 'sb3' }
            }
          },
          {
            opcode: 'downloadSingleCostume',
            blockType: Scratch.BlockType.COMMAND,
            text: 'download costume [COSTUME_INDEX] for sprite [SPRITE_NAME] as [FORMAT]',
            arguments: {
              COSTUME_INDEX: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 },
              SPRITE_NAME: { type: Scratch.ArgumentType.STRING, defaultValue: 'Sprite1' },
              FORMAT: { type: Scratch.ArgumentType.STRING, menu: 'costumeFormatMenu', defaultValue: 'png' }
            }
          },
          {
            opcode: 'downloadSingleSound',
            blockType: Scratch.BlockType.COMMAND,
            text: 'download sound [SOUND_INDEX] for sprite [SPRITE_NAME]',
            arguments: {
              SOUND_INDEX: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 },
              SPRITE_NAME: { type: Scratch.ArgumentType.STRING, defaultValue: 'Sprite1' }
            }
          },
          {
            opcode: 'downloadBackdrop',
            blockType: Scratch.BlockType.COMMAND,
            text: 'download backdrop [BACKDROP_INDEX] as [FORMAT]',
            arguments: {
              BACKDROP_INDEX: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 },
              FORMAT: { type: Scratch.ArgumentType.STRING, menu: 'costumeFormatMenu', defaultValue: 'png' }
            }
          },
          {
            opcode: 'downloadAllProjectAssets',
            blockType: Scratch.BlockType.COMMAND,
            text: 'download all project assets as zip',
            arguments: {}
          },
          {
            opcode: 'captureStageScreenshot',
            blockType: Scratch.BlockType.COMMAND,
            text: 'capture stage screenshot as png',
            arguments: {}
          },
          {
            opcode: 'getProjectStats',
            blockType: Scratch.BlockType.REPORTER,
            text: 'count total [STAT_TYPE] for sprite [SPRITE_NAME]',
            arguments: {
              STAT_TYPE: { type: Scratch.ArgumentType.STRING, menu: 'statMenu', defaultValue: 'costumes' },
              SPRITE_NAME: { type: Scratch.ArgumentType.STRING, defaultValue: 'Sprite1' }
            }
          }
        ],
        menus: {
          spriteFormatMenu: {
            acceptReporters: true,
            items: [
              { text: 'SB3 (.sprite3)', value: 'sb3' },
              { text: 'ZIP Archive', value: 'zip' },
              { text: 'PNG Image', value: 'png' },
              { text: 'SVG Vector', value: 'svg' }
            ]
          },
          costumeFormatMenu: {
            acceptReporters: true,
            items: [
              { text: 'PNG', value: 'png' },
              { text: 'SVG', value: 'svg' },
              { text: 'JPG', value: 'jpg' },
              { text: 'BMP', value: 'bmp' }
            ]
          },
          statMenu: {
            acceptReporters: false,
            items: [
              { text: 'costumes', value: 'costumes' },
              { text: 'sounds', value: 'sounds' },
              { text: 'sprites', value: 'sprites' }
            ]
          }
        }
      };
    }

    async _loadJSZip() {
      if (window.JSZip) return window.JSZip;
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
        script.onload = () => resolve(window.JSZip);
        script.onerror = () => reject(new Error('Failed to load JSZip library!'));
        document.head.appendChild(script);
      });
    }

    _triggerDownload(url, filename) {
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }

    _exportCostumeAs(costume, targetFormat, fileName) {
      const asset = costume.asset;
      const rawFormat = asset.assetType.runtimeFormat;

      if (targetFormat === 'svg' || (targetFormat === rawFormat && !['jpg', 'bmp'].includes(targetFormat))) {
        const blob = new Blob([asset.data], { type: asset.assetType.contentType });
        const url = URL.createObjectURL(blob);
        this._triggerDownload(url, `${fileName}.${targetFormat === 'svg' ? 'svg' : rawFormat}`);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        return;
      }

      const blob = new Blob([asset.data], { type: asset.assetType.contentType });
      const url = URL.createObjectURL(blob);
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width || 480;
        canvas.height = img.height || 360;
        const ctx = canvas.getContext('2d');

        if (['jpg', 'jpeg', 'bmp'].includes(targetFormat)) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.drawImage(img, 0, 0);
        let mime = 'image/png';
        if (['jpg', 'jpeg'].includes(targetFormat)) mime = 'image/jpeg';
        if (targetFormat === 'bmp') mime = 'image/bmp';

        const convertedUrl = canvas.toDataURL(mime, 0.95);
        this._triggerDownload(convertedUrl, `${fileName}.${targetFormat}`);
        URL.revokeObjectURL(url);
      };

      img.src = url;
    }

    // ==========================================
    // SECTION 1 LOGIC: TEMP VARIABLES
    // ==========================================
    setTempVar(args) {
      const key = String(args.NAME).trim();
      if (key) this._tempVars.set(key, args.VALUE);
    }

    getTempVar(args) {
      const key = String(args.NAME).trim();
      return this._tempVars.has(key) ? this._tempVars.get(key) : '';
    }

    deleteTempVar(args) {
      this._tempVars.delete(String(args.NAME).trim());
    }

    clearAllTempVars() {
      this._tempVars.clear();
    }

    swapTempVariables(args) {
      const key1 = String(args.VAR1).trim();
      const key2 = String(args.VAR2).trim();
      const val1 = this._tempVars.has(key1) ? this._tempVars.get(key1) : '';
      const val2 = this._tempVars.has(key2) ? this._tempVars.get(key2) : '';
      this._tempVars.set(key1, val2);
      this._tempVars.set(key2, val1);
    }

    getTempVarsJSON() {
      const obj = Object.fromEntries(this._tempVars);
      return JSON.stringify(obj);
    }

    _getOrCreateRealVariable(name, util) {
      const nameStr = String(name).trim();
      if (!nameStr) return null;
      const target = util.target;
      const stage = util.runtime.getTargetForStage();
      const stageVariables = stage ? stage.variables : {};
      const targetVariables = target ? target.variables : {};

      for (const id in targetVariables) {
        if (targetVariables[id].name === nameStr && targetVariables[id].type === '') {
          return targetVariables[id];
        }
      }
      for (const id in stageVariables) {
        if (stageVariables[id].name === nameStr && stageVariables[id].type === '') {
          return stageVariables[id];
        }
      }
      if (stage && typeof stage.createVariable === 'function') {
        const varId = 'var_' + Math.random().toString(36).substr(2, 9);
        stage.createVariable(varId, nameStr, '', false);
        return stage.variables[varId];
      }
      return null;
    }

    swapRealVariables(args, util) {
      const var1Name = String(args.VAR1).trim();
      const var2Name = String(args.VAR2).trim();
      if (!var1Name || !var2Name) return;
      const v1 = this._getOrCreateRealVariable(var1Name, util);
      const v2 = this._getOrCreateRealVariable(var2Name, util);
      if (v1 && v2) {
        const tmp = v1.value;
        v1.value = v2.value;
        v2.value = tmp;
        if (util.runtime && typeof util.runtime.requestRedraw === 'function') {
          util.runtime.requestRedraw();
        }
      }
    }

    // ==========================================
    // SECTION 2 LOGIC: TEMP LISTS
    // ==========================================
    _getList(listName) {
      const name = String(listName).trim();
      if (!this._tempLists.has(name)) {
        this._tempLists.set(name, []);
      }
      return this._tempLists.get(name);
    }

    addTempListItem(args) {
      const list = this._getList(args.LIST_NAME);
      list.push(args.ITEM);
    }

    deleteTempListItem(args) {
      const list = this._getList(args.LIST_NAME);
      const index = parseInt(args.INDEX) - 1;
      if (index >= 0 && index < list.length) {
        list.splice(index, 1);
      }
    }

    deleteAllTempListItems(args) {
      const name = String(args.LIST_NAME).trim();
      if (this._tempLists.has(name)) {
        this._tempLists.set(name, []);
      }
    }

    insertTempListItem(args) {
      const list = this._getList(args.LIST_NAME);
      const index = parseInt(args.INDEX) - 1;
      if (index >= 0 && index <= list.length) {
        list.splice(index, 0, args.ITEM);
      } else {
        list.push(args.ITEM);
      }
    }

    replaceTempListItem(args) {
      const list = this._getList(args.LIST_NAME);
      const index = parseInt(args.INDEX) - 1;
      if (index >= 0 && index < list.length) {
        list[index] = args.ITEM;
      }
    }

    getTempListItem(args) {
      const list = this._getList(args.LIST_NAME);
      const index = parseInt(args.INDEX) - 1;
      if (index >= 0 && index < list.length) {
        return list[index];
      }
      return '';
    }

    getTempListItemIndex(args) {
      const list = this._getList(args.LIST_NAME);
      const targetItem = String(args.ITEM);
      for (let i = 0; i < list.length; i++) {
        if (String(list[i]) === targetItem) {
          return i + 1;
        }
      }
      return 0;
    }

    getTempListLength(args) {
      const list = this._getList(args.LIST_NAME);
      return list.length;
    }

    tempListContainsItem(args) {
      const list = this._getList(args.LIST_NAME);
      const targetItem = String(args.ITEM);
      return list.some(item => String(item) === targetItem);
    }

    getTempListJSON(args) {
      const name = String(args.LIST_NAME).trim();
      if (!this._tempLists.has(name)) return '[]';
      return JSON.stringify(this._tempLists.get(name));
    }

    // ==========================================
    // SECTION 3 LOGIC: ASSET DOWNLOADER & UTILS
    // ==========================================
    async downloadEntireSprite(args, util) {
      const format = (args.FORMAT || 'sb3').toLowerCase();
      const target = util.runtime.getSpriteTargetByName(args.SPRITE_NAME);
      if (!target) return;

      if (['sb3', 'zip'].includes(format)) {
        try {
          const JSZip = await this._loadJSZip();
          const zip = new JSZip();

          target.getCostumes().forEach(c => {
            zip.file(`${c.assetId}.${c.asset.assetType.runtimeFormat}`, c.asset.data);
          });

          (target.getSounds ? target.getSounds() : []).forEach(s => {
            zip.file(`${s.assetId}.${s.asset.assetType.runtimeFormat}`, s.asset.data);
          });

          if (format === 'sb3') {
            zip.file('sprite.json', JSON.stringify(target.toJSON(), null, 2));
          }

          const content = await zip.generateAsync({ type: 'blob' });
          const url = URL.createObjectURL(content);
          this._triggerDownload(url, `${target.getName()}.${format === 'sb3' ? 'sprite3' : 'zip'}`);
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch (err) {
          console.error(err);
        }
        return;
      }

      target.getCostumes().forEach((c, idx) => {
        setTimeout(() => {
          this._exportCostumeAs(c, format, `${target.getName()}_costume${idx + 1}_${c.name}`);
        }, idx * 300);
      });
    }

    downloadSingleCostume(args, util) {
      const target = util.runtime.getSpriteTargetByName(args.SPRITE_NAME);
      if (!target) return;

      const costumes = target.getCostumes();
      const idx = Math.max(1, parseInt(args.COSTUME_INDEX) || 1) - 1;
      const costume = costumes[Math.min(costumes.length - 1, idx)];

      if (costume) {
        this._exportCostumeAs(costume, (args.FORMAT || 'png').toLowerCase(), `${target.getName()}_costume${idx + 1}_${costume.name}`);
      }
    }

    downloadSingleSound(args, util) {
      const target = util.runtime.getSpriteTargetByName(args.SPRITE_NAME);
      if (!target) return;

      const sounds = target.getSounds ? target.getSounds() : [];
      const idx = Math.max(1, parseInt(args.SOUND_INDEX) || 1) - 1;
      const sound = sounds[Math.min(sounds.length - 1, idx)];

      if (sound && sound.asset) {
        const asset = sound.asset;
        const blob = new Blob([asset.data], { type: asset.assetType.contentType });
        const url = URL.createObjectURL(blob);
        this._triggerDownload(url, `${target.getName()}_sound${idx + 1}_${sound.name}.${asset.assetType.runtimeFormat}`);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    }

    downloadBackdrop(args, util) {
      const stage = util.runtime.getTargetForStage();
      if (!stage) return;

      const costumes = stage.getCostumes();
      const idx = Math.max(1, parseInt(args.BACKDROP_INDEX) || 1) - 1;
      const backdrop = costumes[Math.min(costumes.length - 1, idx)];

      if (backdrop) {
        this._exportCostumeAs(backdrop, (args.FORMAT || 'png').toLowerCase(), `Stage_backdrop${idx + 1}_${backdrop.name}`);
      }
    }

    async downloadAllProjectAssets(args, util) {
      try {
        const JSZip = await this._loadJSZip();
        const zip = new JSZip();

        util.runtime.targets.forEach(target => {
          const folderName = target.isStage ? 'Stage' : target.getName();
          const folder = zip.folder(folderName);

          target.getCostumes().forEach((c, idx) => {
            folder.file(`costumes/${idx + 1}_${c.name}.${c.asset.assetType.runtimeFormat}`, c.asset.data);
          });

          (target.getSounds ? target.getSounds() : []).forEach((s, idx) => {
            folder.file(`sounds/${idx + 1}_${s.name}.${s.asset.assetType.runtimeFormat}`, s.asset.data);
          });
        });

        const content = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(content);
        this._triggerDownload(url, `Project_Assets_Backup.zip`);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } catch (err) {
        console.error(err);
      }
    }

    captureStageScreenshot() {
      const canvas = document.querySelector('canvas');
      if (!canvas) return;
      const url = canvas.toDataURL('image/png');
      this._triggerDownload(url, `Stage_Screenshot.png`);
    }

    getProjectStats(args, util) {
      const type = args.STAT_TYPE;
      if (type === 'sprites') {
        return util.runtime.targets.filter(t => !t.isStage).length;
      }
      const target = util.runtime.getSpriteTargetByName(args.SPRITE_NAME);
      if (!target) return 0;

      if (type === 'costumes') {
        return target.getCostumes().length;
      }
      if (type === 'sounds') {
        return target.getSounds ? target.getSounds().length : 0;
      }
      return 0;
    }
  }

  Scratch.extensions.register(new GeneratedExtension());
})(Scratch);