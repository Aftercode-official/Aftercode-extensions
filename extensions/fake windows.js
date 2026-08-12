// Name: Fake windows
// Description: create a fake window in your project page
// By: katboizz <https://scratch.mit.edu/users/katboizz/>
// License: MIT
class FakeWindowExtension {
    constructor() {
    this.windows = {};
    this.zIndexCounter = 9999;

    this.updateLoop = this.updateLoop.bind(this);
    requestAnimationFrame(this.updateLoop);
}


    getInfo() {
        return {
            id: 'fakewindows',
            name: 'Fake Windows',
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
                opcode: 'Allwindows',
                blockType: Scratch.BlockType.REPORTER,
                text: 'All windows',
                }
            ],

            menus: {
                frameMenu: {
                    acceptReporters: true,
                    items: [
                        { text: 'normal', value: 'normal' },
                        { text: 'frameless', value: 'frameless' }
                    ]
                }
            }
        };
    }

    createWindow(args) {
    const id = String(args.ID);
    if (this.windows[id]) return;

    const win = document.createElement('div');
    win.style.position = 'fixed';
    win.style.left = '150px';
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
    // hook render scratch sprite
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
}

Scratch.extensions.register(new FakeWindowExtension());