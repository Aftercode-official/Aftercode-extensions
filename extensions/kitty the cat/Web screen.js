// Name: Web Screen beta
// ID: webscreen
// Description: Extension Web Screen allows an Aftercode project to display text and characters over the entire web page.
// By: _kitty-the-cat_ <https://scratch.mit.edu/users/_kitty-the-cat_/>
// License: MIT

(function (Scratch) {
    "use strict";

    if (!Scratch.extensions.unsandboxed) {
        throw new Error(
            "Web Screen must be run with 'Run without sandbox'."
        );
    }

    class WebScreen {
        constructor() {
            this.overlay = null;
            this.textElement = null;
            this.characterElement = null;
            this.text = "ĐÂY LÀ EXTENSION";
            this.size = 100;
            this.textColor = "#ffffff";
            this.rainbow = true;
            this.currentSprite = null;
            this.spriteTimer = null;
            this.characterCanvas = null;
        }

        getInfo() {
            return {
                id: "webscreen",
                name: "Web Screen",

                color1: "#2196F3",
                color2: "#1976D2",
                color3: "#0D47A1",

                blocks: [
                    {
                        opcode: "showText",
                        blockType: Scratch.BlockType.COMMAND,
                        text: "show text"
                    },
                    {
                        opcode: "hide",
                        blockType: Scratch.BlockType.COMMAND,
                        text: "hide"
                    },
                    {
                        opcode: "setText",
                        blockType: Scratch.BlockType.COMMAND,
                        text: "set text [TEXT]",
                        arguments: {
                            TEXT: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: "TEXT"
                            }
                        }
                    },
                    {
                        opcode: "setSize",
                        blockType: Scratch.BlockType.COMMAND,
                        text: "set side [SIZE] %",
                        arguments: {
                            SIZE: {
                                type: Scratch.ArgumentType.NUMBER,
                                defaultValue: 100
                            }
                        }
                    },
                    {
                        opcode: "setColor",
                        blockType: Scratch.BlockType.COMMAND,
                        text: "set color [COLOR]",
                        arguments: {
                            COLOR: {
                                type: Scratch.ArgumentType.COLOR,
                                defaultValue: "#ffffff"
                            }
                        }
                    },
                    {
                        opcode: "setRainbow",
                        blockType: Scratch.BlockType.COMMAND,
                        text: "rainbow mode"
                    },
                    {
                        opcode: "showCharacter",
                        blockType: Scratch.BlockType.COMMAND,
                        text: "show character [SPRITE]",
                        arguments: {
                            SPRITE: {
                                type: Scratch.ArgumentType.STRING,
                                menu: "getSpriteMenu"
                            }
                        }
                    }
                ],

                menus: {
                    getSpriteMenu: {
                        acceptReporters: false,
                        items: "getSpriteMenu"
                    }
                }
            };
        }

        get vm() {
            return Scratch.vm;
        }

        getSpriteMenu() {
            const vm = this.vm;

            if (!vm || !vm.runtime) {
                return [
                    {
                        text: "no characters",
                        value: ""
                    }
                ];
            }

            const targets = vm.runtime.targets || [];

            const sprites = targets.filter(target => {
                return (
                    target &&
                    !target.isStage &&
                    target.isOriginal &&
                    target.id
                );
            });

            if (sprites.length === 0) {
                return [
                    {
                        text: "no characters",
                        value: ""
                    }
                ];
            }

            return sprites.map(target => ({
                text: target.getName(),
                value: target.id
            }));
        }

        createOverlay() {
            if (this.overlay) {
                return;
            }

            this.overlay = document.createElement("div");

            this.overlay.style.position = "fixed";
            this.overlay.style.left = "0";
            this.overlay.style.top = "0";
            this.overlay.style.width = "100vw";
            this.overlay.style.height = "100vh";
            this.overlay.style.background = "rgba(0, 0, 0, 0.5)";
            this.overlay.style.zIndex = "2147483647";
            this.overlay.style.opacity = "0";
            this.overlay.style.transition = "opacity 0.6s ease";
            this.overlay.style.pointerEvents = "none";

            document.body.appendChild(this.overlay);

            this.textElement = document.createElement("div");

            this.textElement.textContent = this.text;
            this.textElement.style.position = "absolute";
            this.textElement.style.left = "50%";
            this.textElement.style.top = "50%";
            this.textElement.style.transform =
                "translate(-50%, -50%) scale(0.7)";
            this.textElement.style.transformOrigin = "center center";
            this.textElement.style.fontFamily =
                "Arial, Helvetica, sans-serif";
            this.textElement.style.fontWeight = "900";
            this.textElement.style.textAlign = "center";
            this.textElement.style.whiteSpace = "pre-wrap";
            this.textElement.style.userSelect = "none";
            this.textElement.style.opacity = "0";
            this.textElement.style.transition =
                "transform 0.7s cubic-bezier(.2,.8,.2,1), opacity 0.7s ease";

            this.overlay.appendChild(this.textElement);

            this.updateSize();
            this.updateColor();
        }

        updateSize() {
            if (!this.textElement) {
                return;
            }

            let percent = Number(this.size);

            if (!Number.isFinite(percent)) {
                percent = 100;
            }

            if (percent < 0) {
                percent = 0;
            }

            const px = 100 * 0.75 * (percent / 100);

            this.textElement.style.fontSize = `${px}px`;
        }

        updateCharacterSize() {
            if (!this.characterElement || !this.characterCanvas) {
                return;
            }

            let percent = Number(this.size);

            if (!Number.isFinite(percent)) {
                percent = 100;
            }

            if (percent < 0) {
                percent = 0;
            }

            const scale = percent / 100;

            const width = this.characterCanvas.width * scale;
            const height = this.characterCanvas.height * scale;

            this.characterElement.style.width = `${width}px`;
            this.characterElement.style.height = `${height}px`;
            this.characterElement.style.left = "50%";
            this.characterElement.style.top = "50%";
        }

        updateColor() {
            if (!this.textElement) {
                return;
            }

            if (this.rainbow) {
                this.textElement.style.background =
                    "linear-gradient(90deg, red, orange, yellow, lime, cyan, blue, violet, red)";

                this.textElement.style.backgroundSize = "400% 100%";
                this.textElement.style.backgroundClip = "text";
                this.textElement.style.webkitBackgroundClip = "text";
                this.textElement.style.color = "transparent";
                this.textElement.style.webkitTextFillColor = "transparent";

                this.textElement.style.animation =
                    "webscreenRainbow 3s linear infinite";
            } else {
                this.textElement.style.background = "none";
                this.textElement.style.backgroundClip = "initial";
                this.textElement.style.webkitBackgroundClip = "initial";
                this.textElement.style.color = this.textColor;
                this.textElement.style.webkitTextFillColor = "initial";
                this.textElement.style.animation = "none";
            }
        }

        addRainbowCSS() {
            if (document.getElementById("webscreen-rainbow-style")) {
                return;
            }

            const style = document.createElement("style");

            style.id = "webscreen-rainbow-style";

            style.textContent = `
                @keyframes webscreenRainbow {
                    0% {
                        background-position: 0% 50%;
                    }

                    100% {
                        background-position: 400% 50%;
                    }
                }
            `;

            document.head.appendChild(style);
        }

        showText() {
            this.stopCharacter();
            this.createOverlay();
            this.addRainbowCSS();

            this.textElement.style.display = "block";
            this.textElement.textContent = this.text;
            this.overlay.style.opacity = "1";

            requestAnimationFrame(() => {
                this.textElement.style.opacity = "1";
                this.textElement.style.transform =
                    "translate(-50%, -50%) scale(1)";
            });
        }

        hide() {
            if (!this.overlay) {
                return;
            }

            this.stopCharacter();

            this.overlay.style.opacity = "0";

            if (this.textElement) {
                this.textElement.style.opacity = "0";
                this.textElement.style.transform =
                    "translate(-50%, -50%) scale(0.7)";
            }

            const oldOverlay = this.overlay;

            setTimeout(() => {
                if (oldOverlay.parentNode) {
                    oldOverlay.parentNode.removeChild(oldOverlay);
                }

                if (this.overlay === oldOverlay) {
                    this.overlay = null;
                    this.textElement = null;
                    this.characterElement = null;
                    this.characterCanvas = null;
                }
            }, 750);
        }

        setText(args) {
            this.text = String(args.TEXT ?? "");

            this.createOverlay();

            if (this.textElement) {
                this.textElement.textContent = this.text;
            }
        }

        setSize(args) {
            this.size = Number(args.SIZE);

            if (!Number.isFinite(this.size)) {
                this.size = 100;
            }

            if (this.size < 0) {
                this.size = 0;
            }

            this.createOverlay();
            this.updateSize();
            this.updateCharacterSize();
        }

        setColor(args) {
            this.textColor = String(args.COLOR || "#ffffff");
            this.rainbow = false;

            this.createOverlay();
            this.updateColor();
        }

        setRainbow() {
            this.rainbow = true;

            this.createOverlay();
            this.updateColor();
        }

        findSprite(id) {
            const vm = this.vm;

            if (!vm || !vm.runtime) {
                return null;
            }

            const targets = vm.runtime.targets || [];

            let target = targets.find(t => t && t.id === id);

            if (target) {
                return target;
            }

            target = targets.find(
                t =>
                    t &&
                    !t.isStage &&
                    t.getName &&
                    t.getName() === id
            );

            return target || null;
        }

        getRenderedSpriteImage(target) {
            const vm = this.vm;

            if (!vm || !vm.renderer || !target) {
                return null;
            }

            try {
                const drawable =
                    vm.renderer._allDrawables[target.drawableID];

                if (!drawable) {
                    return null;
                }

                const skin = drawable.skin;

                if (!skin) {
                    return null;
                }

                if (skin._canvas) {
                    return skin._canvas;
                }

                if (skin.canvas) {
                    return skin.canvas;
                }

                if (skin._texture && skin._texture._canvas) {
                    return skin._texture._canvas;
                }
            } catch (e) {
                console.warn(
                    "Could not get rendered character:",
                    e
                );
            }

            return null;
        }

        showCharacter(args) {
            const spriteId = String(args.SPRITE || "");
            const target = this.findSprite(spriteId);

            if (!target) {
                console.warn(
                    "Character not found:",
                    spriteId
                );
                return;
            }

            this.stopCharacter();
            this.createOverlay();
            this.addRainbowCSS();

            if (this.textElement) {
                this.textElement.style.opacity = "0";
            }

            const canvas = this.getRenderedSpriteImage(target);

            if (!canvas) {
                console.warn(
                    "Could not get rendered character image."
                );
                return;
            }

            this.characterCanvas = canvas;

            const img = document.createElement("img");

            img.src = canvas.toDataURL("image/png");

            img.style.position = "absolute";
            img.style.left = "50%";
            img.style.top = "50%";
            img.style.transform =
                "translate(-50%, -50%) scale(0.7)";
            img.style.transformOrigin = "center center";
            img.style.objectFit = "contain";
            img.style.display = "block";
            img.style.maxWidth = "none";
            img.style.maxHeight = "none";
            img.style.margin = "0";
            img.style.padding = "0";
            img.style.border = "0";
            img.style.userSelect = "none";
            img.style.pointerEvents = "none";
            img.style.opacity = "0";

            img.style.transition =
                "opacity 0.7s ease, transform 0.7s cubic-bezier(.2,.8,.2,1)";

            this.characterElement = img;
            this.currentSprite = target;

            this.overlay.appendChild(img);

            this.updateCharacterSize();

            this.overlay.style.opacity = "1";

            requestAnimationFrame(() => {
                img.style.opacity = "1";
                img.style.transform =
                    "translate(-50%, -50%) scale(1)";
            });

            this.spriteTimer = setInterval(() => {
                if (!this.characterElement || !this.currentSprite) {
                    return;
                }

                const currentCanvas =
                    this.getRenderedSpriteImage(this.currentSprite);

                if (!currentCanvas) {
                    return;
                }

                try {
                    this.characterCanvas = currentCanvas;

                    this.characterElement.src =
                        currentCanvas.toDataURL("image/png");

                    this.updateCharacterSize();
                } catch (e) {}
            }, 100);
        }

        stopCharacter() {
            if (this.spriteTimer) {
                clearInterval(this.spriteTimer);
                this.spriteTimer = null;
            }

            this.currentSprite = null;
            this.characterCanvas = null;

            if (this.characterElement) {
                this.characterElement.remove();
                this.characterElement = null;
            }
        }
    }

    Scratch.extensions.register(new WebScreen());
})(Scratch);
