// Name: fish
// ID: twaquarium
// Description: Aquarium Extension for TurboWarp
// By: _Kitty-the-cat_ <https://scratch.mit.edu/users/_kitty-the-cat_/>
// License: MIT
(function (Scratch) {
    "use strict";

    if (!Scratch.extensions.unsandboxed) {
        throw new Error("TurboWrap Aquarium requires unsandboxed mode!");
    }

    const EXTENSION_ID = "twaquarium";

    class TurboWrapAquarium {
        constructor() {
            this.active = true;

            this.fish = [];
            this.bubbles = [];
            this.grid = new Map();
            this.gridSize = 110;

            this.fishCount = 150;
this.speed = 20;

// Cài đặt thuật toán Boids
this.boidSeparation = 5;
this.boidAlignment = 0.15;
this.boidCohesion = 0.4;
this.boidNeighborRadius = 60;
this.boidSeparationRadius = 100;

this.gridSize = 90;

this.followEnabled = true;
this.followDistance = 160;

this.avoidEnabled = true;
this.avoidDistance = 140;

this.bubblesEnabled = true;

            this.width = 1;
            this.height = 1;

            this.root = null;
            this.canvas = null;
            this.ctx = null;

            this.toolbar = null;
            this.editPanel = null;

            this.animation = null;
            this.lastTime = 0;

            this.dragging = false;
            this.dragMoved = false;
            this.dragOffsetX = 0;
            this.dragOffsetY = 0;
            this.dragStartX = 0;
            this.dragStartY = 0;

            this.mouse = {
                x: -1000,
                y: -1000,
                active: false
            };

            this.resizeHandler = () => this.resize();

            this.pointerHandler = (e) => {
                if (!this.root) return;

                const rect = this.root.getBoundingClientRect();

                this.mouse.x = e.clientX - rect.left;
                this.mouse.y = e.clientY - rect.top;
                this.mouse.active = true;
            };

            this.pointerLeaveHandler = () => {
                this.mouse.active = false;
            };

            this.createInterface();
            this.setFishCount(this.fishCount);
            this.start();
        }

        getInfo() {
            return {
                id: EXTENSION_ID,
                name: "Bể cá",
                color1: "#1599CE",
                color2: "#0875A8",
                color3: "#07567C",
                blocks: []
            };
        }

        // =====================================
        // GIAO DIỆN
        // =====================================

        createInterface() {
            if (document.getElementById("twa-aquarium-root")) {
                throw new Error("Aquarium is already loaded!");
            }

            this.root = document.createElement("div");
            this.root.id = "twa-aquarium-root";

            Object.assign(this.root.style, {
                position: "fixed",
                top: "0",
                left: "0",
                width: "100vw",
                height: "100dvh",
                zIndex: "999999",
                display: "block",
                overflow: "hidden",
                pointerEvents: "none",
                background: "transparent",
                fontFamily: "Arial, sans-serif",
                boxSizing: "border-box"
            });

            this.canvas = document.createElement("canvas");

            Object.assign(this.canvas.style, {
                position: "absolute",
                top: "0",
                left: "0",
                width: "100%",
                height: "100%",
                display: "block",
                pointerEvents: "none"
            });

            this.ctx = this.canvas.getContext("2d");

            this.createToolbar();
            this.createEditPanel();

            this.root.appendChild(this.canvas);
            this.root.appendChild(this.toolbar);
            this.root.appendChild(this.editPanel);

            document.body.appendChild(this.root);

            window.addEventListener("resize", this.resizeHandler);
            window.addEventListener("orientationchange", this.resizeHandler);
            window.addEventListener("pointermove", this.pointerHandler);
            window.addEventListener("blur", this.pointerLeaveHandler);

            document.addEventListener(
                "pointerleave",
                this.pointerLeaveHandler
            );

            if (window.visualViewport) {
                window.visualViewport.addEventListener(
                    "resize",
                    this.resizeHandler
                );

                window.visualViewport.addEventListener(
                    "scroll",
                    this.resizeHandler
                );
            }

            this.resize();
        }

        // =====================================
        // NÚT CÀI ĐẶT CÓ THỂ KÉO
        // =====================================

        createToolbar() {
            this.toolbar = document.createElement("div");

            Object.assign(this.toolbar.style, {
                position: "absolute",
                top: "12px",
                left: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "3px",
                borderRadius: "11px",
                background: "rgba(0, 35, 60, 0.82)",
                pointerEvents: "auto",
                boxShadow: "0 3px 12px rgba(0,0,0,0.2)",
                backdropFilter: "blur(8px)",
                boxSizing: "border-box",
                touchAction: "none",
                cursor: "grab",
                userSelect: "none",
                zIndex: "10"
            });

            const edit = document.createElement("button");
            edit.textContent = "⚙";

            Object.assign(edit.style, {
                width: "34px",
                height: "34px",
                padding: "0",
                border: "none",
                borderRadius: "8px",
                background: "#1599ce",
                color: "white",
                fontSize: "17px",
                cursor: "pointer",
                touchAction: "none",
                userSelect: "none"
            });

            this.toolbar.appendChild(edit);

            this.toolbar.addEventListener("pointerdown", (e) => {
                if (e.button !== undefined && e.button !== 0) return;

                this.dragging = true;
                this.dragMoved = false;

                const rect = this.toolbar.getBoundingClientRect();

                this.dragOffsetX = e.clientX - rect.left;
                this.dragOffsetY = e.clientY - rect.top;

                this.dragStartX = e.clientX;
                this.dragStartY = e.clientY;

                this.toolbar.style.cursor = "grabbing";

                try {
                    this.toolbar.setPointerCapture(e.pointerId);
                } catch (_) {}

                e.preventDefault();
            });

            this.toolbar.addEventListener("pointermove", (e) => {
                if (!this.dragging) return;

                const dx = e.clientX - this.dragStartX;
                const dy = e.clientY - this.dragStartY;

                if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
                    this.dragMoved = true;
                }

                if (!this.dragMoved) return;

                const rect = this.toolbar.getBoundingClientRect();

                let x = e.clientX - this.dragOffsetX;
                let y = e.clientY - this.dragOffsetY;

                x = Math.max(0, Math.min(this.width - rect.width, x));
                y = Math.max(0, Math.min(this.height - rect.height, y));

                this.toolbar.style.left = x + "px";
                this.toolbar.style.top = y + "px";
                this.toolbar.style.right = "auto";
                this.toolbar.style.bottom = "auto";

                this.updatePanelPosition();
            });

            this.toolbar.addEventListener("pointerup", (e) => {
                if (!this.dragging) return;

                const wasDragged = this.dragMoved;

                this.dragging = false;
                this.toolbar.style.cursor = "grab";

                if (!wasDragged) {
                    const isHidden =
                        this.editPanel.style.display === "none";

                    this.editPanel.style.display =
                        isHidden ? "block" : "none";

                    if (isHidden) {
                        this.updatePanelPosition();
                    }
                }

                try {
                    this.toolbar.releasePointerCapture(e.pointerId);
                } catch (_) {}
            });

            this.toolbar.addEventListener("pointercancel", () => {
                this.dragging = false;
                this.dragMoved = false;
                this.toolbar.style.cursor = "grab";
            });
        }

        // =====================================
        // VỊ TRÍ BẢNG CÀI ĐẶT
        // =====================================

        updatePanelPosition() {
            if (!this.toolbar || !this.editPanel) return;

            const rect = this.toolbar.getBoundingClientRect();
            const rootRect = this.root.getBoundingClientRect();

            const panelWidth = Math.max(
                1,
                Math.min(280, this.width - 24)
            );

            const panelHeight = this.editPanel.offsetHeight || 400;

            let x = rect.left - rootRect.left;
            let y = rect.bottom - rootRect.top + 8;

            if (x + panelWidth > this.width - 8) {
                x = this.width - panelWidth - 8;
            }

            if (y + panelHeight > this.height - 8) {
                y = rect.top - rootRect.top - panelHeight - 8;
            }

            x = Math.max(8, x);
            y = Math.max(8, y);

            this.editPanel.style.left = x + "px";
            this.editPanel.style.top = y + "px";
            this.editPanel.style.right = "auto";
            this.editPanel.style.bottom = "auto";
        }

        // =====================================
        // BẢNG CÀI ĐẶT
        // =====================================

        createEditPanel() {
            this.editPanel = document.createElement("div");

            Object.assign(this.editPanel.style, {
                position: "absolute",
                top: "65px",
                left: "12px",
                width: "min(280px, calc(100% - 24px))",
                maxHeight: "calc(100% - 85px)",
                overflowY: "auto",
                padding: "15px",
                borderRadius: "16px",
                background: "rgba(0, 35, 60, 0.92)",
                color: "white",
                pointerEvents: "auto",
                boxSizing: "border-box",
                display: "none",
                backdropFilter: "blur(12px)",
                boxShadow: "0 5px 25px rgba(0,0,0,0.25)",
                zIndex: "11"
            });

            const heading = document.createElement("div");
            heading.textContent = "Cài đặt bể cá";

            Object.assign(heading.style, {
                fontSize: "16px",
                fontWeight: "bold",
                marginBottom: "15px"
            });

            this.editPanel.appendChild(heading);

            // Số lượng cá
            this.addSlider(
                "Số lượng cá",
                0,
                200,
                1,
                this.fishCount,
                value => {
                    this.fishCount = value;
                    this.setFishCount(value);
                }
            );

            // Tốc độ bơi
            this.addSlider(
                "Tốc độ bơi",
                0.1,
                20,
                0.1,
                this.speed,
                value => {
                    this.speed = value;
                }
            );

            // Đi theo con trỏ
            this.addToggle(
                "Cá đi theo con trỏ",
                this.followEnabled,
                value => {
                    this.followEnabled = value;
                }
            );

            this.addSlider(
                "Khoảng cách đi theo",
                50,
                800,
                10,
                this.followDistance,
                value => {
                    this.followDistance = value;
                }
            );

            // Né con trỏ
            this.addToggle(
                "Cá né con trỏ",
                this.avoidEnabled,
                value => {
                    this.avoidEnabled = value;
                }
            );

            this.addSlider(
                "Khoảng cách né",
                0,
                250,
                5,
                this.avoidDistance,
                value => {
                    this.avoidDistance = value;
                }
            );

            // Bong bóng
            this.addToggle(
                "Bong bóng",
                this.bubblesEnabled,
                value => {
                    this.bubblesEnabled = value;
                }
            );

            // =====================================
            // CÀI ĐẶT BOIDS
            // =====================================

            const boidHeading = document.createElement("div");
            boidHeading.textContent = "Điều khiển đàn cá (Boids)";

            Object.assign(boidHeading.style, {
                fontSize: "14px",
                fontWeight: "bold",
                marginTop: "20px",
                marginBottom: "13px",
                paddingTop: "12px",
                borderTop: "1px solid rgba(255,255,255,0.2)"
            });

            this.editPanel.appendChild(boidHeading);

            // Lực tách đàn
            this.addSlider(
                "Tách đàn",
                0,
                5,
                0.1,
                this.boidSeparation,
                value => {
                    this.boidSeparation = value;
                }
            );

            // Lực căn hướng
            this.addSlider(
                "Căn hướng",
                0,
                3,
                0.05,
                this.boidAlignment,
                value => {
                    this.boidAlignment = value;
                }
            );

            // Lực tụ đàn
            this.addSlider(
                "Tụ đàn",
                0,
                3,
                0.05,
                this.boidCohesion,
                value => {
                    this.boidCohesion = value;
                }
            );

            // Khoảng cách nhận biết
            this.addSlider(
                "Khoảng cách nhận biết",
                40,
                250,
                5,
                this.boidNeighborRadius,
                value => {
                    this.boidNeighborRadius = value;
                    this.gridSize = Math.max(40, value);
                }
            );

            // Khoảng cách tách đàn
            this.addSlider(
                "Khoảng cách tách đàn",
                10,
                100,
                2,
                this.boidSeparationRadius,
                value => {
                    this.boidSeparationRadius = value;
                }
            );

            // Nút đóng
            const close = document.createElement("button");
            close.textContent = "Đóng cài đặt";

            Object.assign(close.style, {
                width: "100%",
                marginTop: "14px",
                padding: "10px",
                border: "none",
                borderRadius: "9px",
                background: "#1599ce",
                color: "white",
                cursor: "pointer"
            });

            close.onclick = () => {
                this.editPanel.style.display = "none";
            };

            this.editPanel.appendChild(close);
        }

        // =====================================
        // TẠO THANH TRƯỢT
        // =====================================

        addSlider(label, min, max, step, initial, callback) {
            const wrapper = document.createElement("div");
            wrapper.style.marginBottom = "15px";

            const title = document.createElement("div");
            title.textContent = label;

            Object.assign(title.style, {
                fontSize: "13px",
                marginBottom: "7px"
            });

            const valueText = document.createElement("span");
            valueText.textContent = " " + initial;
            title.appendChild(valueText);

            const input = document.createElement("input");
            input.type = "range";
            input.min = min;
            input.max = max;
            input.step = step;
            input.value = initial;

            Object.assign(input.style, {
                width: "100%",
                cursor: "pointer"
            });

            input.oninput = () => {
                const value = Number(input.value);
                valueText.textContent = " " + value;
                callback(value);
            };

            wrapper.append(title, input);
            this.editPanel.appendChild(wrapper);
        }

        // =====================================
        // TẠO CÔNG TẮC
        // =====================================

        addToggle(label, initial, callback) {
            const wrapper = document.createElement("label");

            Object.assign(wrapper.style, {
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "10px",
                marginBottom: "13px",
                fontSize: "13px",
                cursor: "pointer"
            });

            const text = document.createElement("span");
            text.textContent = label;

            const input = document.createElement("input");
            input.type = "checkbox";
            input.checked = initial;

            input.onchange = () => {
                callback(input.checked);
            };

            wrapper.append(text, input);
            this.editPanel.appendChild(wrapper);
        }

        // =====================================
        // THAY ĐỔI KÍCH THƯỚC
        // =====================================

        resize() {
            const viewport = window.visualViewport;

            this.width = Math.max(
                1,
                Math.round(viewport ? viewport.width : window.innerWidth)
            );

            this.height = Math.max(
                1,
                Math.round(viewport ? viewport.height : window.innerHeight)
            );

            if (viewport) {
                this.root.style.width = this.width + "px";
                this.root.style.height = this.height + "px";
                this.root.style.left = viewport.offsetLeft + "px";
                this.root.style.top = viewport.offsetTop + "px";
            } else {
                this.root.style.width = "100vw";
                this.root.style.height = "100vh";
                this.root.style.left = "0";
                this.root.style.top = "0";
            }

            const dpr = Math.min(window.devicePixelRatio || 1, 2);

            this.canvas.width = Math.round(this.width * dpr);
            this.canvas.height = Math.round(this.height * dpr);

            this.canvas.style.width = this.width + "px";
            this.canvas.style.height = this.height + "px";

            this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            for (const fish of this.fish) {
                fish.x = Math.max(
                    fish.size * 2,
                    Math.min(this.width - fish.size * 2, fish.x)
                );

                fish.y = Math.max(
                    fish.size * 2,
                    Math.min(this.height - fish.size * 2, fish.y)
                );
            }

            if (this.toolbar) {
                const rect = this.toolbar.getBoundingClientRect();

                let x = parseFloat(this.toolbar.style.left);
                let y = parseFloat(this.toolbar.style.top);

                if (!Number.isFinite(x)) x = 12;
                if (!Number.isFinite(y)) y = 12;

                x = Math.max(0, Math.min(this.width - rect.width, x));
                y = Math.max(0, Math.min(this.height - rect.height, y));

                this.toolbar.style.left = x + "px";
                this.toolbar.style.top = y + "px";

                this.updatePanelPosition();
            }
        }

        // =====================================
        // HÀM NGẪU NHIÊN
        // =====================================

        random(min, max) {
            return min + Math.random() * (max - min);
        }

        // =====================================
        // TẠO CÁ
        // =====================================

        createFish() {
            const colors = [
                "#F5A45D",
                "#E8C85B",
                "#78C9D5",
                "#B99BD6",
                "#E88FA7",
                "#8BC49B",
                "#82AEDD",
                "#D99B78"
            ];

            const size = this.random(13, 23);

            return {
                x: this.random(
                    size * 2,
                    Math.max(size * 2 + 1, this.width - size * 2)
                ),

                y: this.random(
                    size * 2,
                    Math.max(size * 2 + 1, this.height - size * 2)
                ),

                vx: this.random(-1, 1),
                vy: this.random(-0.5, 0.5),

                size,

                color: colors[
                    Math.floor(Math.random() * colors.length)
                ],

                direction: Math.random() < 0.5 ? -1 : 1,
                phase: this.random(0, Math.PI * 2),
                speedVariation: this.random(0.7, 1.3)
            };
        }

        // =====================================
        // ĐIỀU CHỈNH SỐ LƯỢNG CÁ
        // =====================================

        setFishCount(count) {
            count = Math.max(
                0,
                Math.min(200, Math.floor(Number(count) || 0))
            );

            while (this.fish.length < count) {
                this.fish.push(this.createFish());
            }

            this.fish.length = count;
        }

        // =====================================
        // TẠO BONG BÓNG
        // =====================================

        createBubble() {
            return {
                x: this.random(0, this.width),
                y: this.random(0, this.height),
                radius: this.random(2, 5),
                speed: this.random(0.5, 1.5),
                drift: this.random(-0.3, 0.3),
                alpha: this.random(0.25, 0.55)
            };
        }

        // =====================================
        // BOIDS - TẠO LƯỚI TÌM CÁ LÂN CẬN
        // =====================================

        buildFishGrid() {
            this.grid.clear();

            const cellSize = this.gridSize;

            for (const fish of this.fish) {
                const gx = Math.floor(fish.x / cellSize);
                const gy = Math.floor(fish.y / cellSize);
                const key = gx + "," + gy;

                let cell = this.grid.get(key);

                if (!cell) {
                    cell = [];
                    this.grid.set(key, cell);
                }

                // Lưu trạng thái đầu khung hình để mọi cá
                // cùng tính toán dựa trên một dữ liệu ổn định.
                cell.push({
                    fish,
                    x: fish.x,
                    y: fish.y,
                    vx: fish.vx,
                    vy: fish.vy
                });
            }
        }

        getNearbyFish(fish, radius) {
            const nearby = [];
            const cellSize = this.gridSize;

            const minX = Math.floor((fish.x - radius) / cellSize);
            const maxX = Math.floor((fish.x + radius) / cellSize);
            const minY = Math.floor((fish.y - radius) / cellSize);
            const maxY = Math.floor((fish.y + radius) / cellSize);

            for (let gy = minY; gy <= maxY; gy++) {
                for (let gx = minX; gx <= maxX; gx++) {
                    const cell = this.grid.get(gx + "," + gy);
                    if (!cell) continue;

                    for (const other of cell) {
                        if (other.fish !== fish) {
                            nearby.push(other);
                        }
                    }
                }
            }

            return nearby;
        }

        limitVector(x, y, max) {
            const length = Math.sqrt(x * x + y * y);

            if (length > max && length > 0) {
                const scale = max / length;

                return {
                    x: x * scale,
                    y: y * scale
                };
            }

            return { x, y };
        }

        // =====================================
        // BOIDS - ĐIỀU KHIỂN ĐÀN CÁ
        // =====================================

        updateFish(fish, dt, time) {
            const frame = Math.min(
                Math.max(dt / 16.67, 0),
                2.4
            );

            fish.phase += 0.012 * frame;

            const neighborRadius = this.boidNeighborRadius;
            const separationRadius = this.boidSeparationRadius;

            const neighbors = this.getNearbyFish(
                fish,
                neighborRadius
            );

            let separationX = 0;
            let separationY = 0;

            let alignmentX = 0;
            let alignmentY = 0;

            let cohesionX = 0;
            let cohesionY = 0;

            let separationCount = 0;
            let neighborCount = 0;

            for (const other of neighbors) {
                const dx = fish.x - other.x;
                const dy = fish.y - other.y;

                const distanceSq = dx * dx + dy * dy;

                if (distanceSq < 0.001) continue;

                const distance = Math.sqrt(distanceSq);

                // Separation: tránh cá khác.
                if (distance < separationRadius) {
                    const strength =
                        (separationRadius - distance) /
                        separationRadius;

                    separationX += dx / distance * strength;
                    separationY += dy / distance * strength;

                    separationCount++;
                }

                // Alignment và Cohesion.
                if (distance < neighborRadius) {
                    alignmentX += other.vx;
                    alignmentY += other.vy;

                    cohesionX += other.x;
                    cohesionY += other.y;

                    neighborCount++;
                }
            }

            let steerX = 0;
            let steerY = 0;

            // Separation - Lực tách đàn.
            if (separationCount > 0) {
                separationX /= separationCount;
                separationY /= separationCount;

                const force = this.limitVector(
                    separationX,
                    separationY,
                    1
                );

                steerX += force.x * this.boidSeparation;
                steerY += force.y * this.boidSeparation;
            }

            // Alignment - Lực căn hướng.
            if (neighborCount > 0) {
                alignmentX /= neighborCount;
                alignmentY /= neighborCount;

                const force = this.limitVector(
                    alignmentX - fish.vx,
                    alignmentY - fish.vy,
                    1
                );

                steerX += force.x * this.boidAlignment;
                steerY += force.y * this.boidAlignment;

                // Cohesion - Lực tụ đàn.
                cohesionX =
                    cohesionX / neighborCount - fish.x;

                cohesionY =
                    cohesionY / neighborCount - fish.y;

                const cohesion = this.limitVector(
                    cohesionX,
                    cohesionY,
                    1
                );

                steerX += cohesion.x * this.boidCohesion;
                steerY += cohesion.y * this.boidCohesion;
            }

            // Chuyển động tự nhiên.
            steerX += Math.sin(
                time * 0.00032 + fish.phase
            ) * 0.12;

            steerY += Math.cos(
                time * 0.00037 + fish.phase
            ) * 0.10;

            // Đi theo con trỏ.
            if (this.mouse.active && this.followEnabled) {
                const dx = this.mouse.x - fish.x;
                const dy = this.mouse.y - fish.y;

                const distance = Math.sqrt(dx * dx + dy * dy);

                if (
                    distance > 1 &&
                    distance < this.followDistance &&
                    distance > this.avoidDistance
                ) {
                    const strength =
                        1 - distance / this.followDistance;

                    steerX += dx / distance * strength * 1.15;
                    steerY += dy / distance * strength * 1.15;
                }
            }

            // Né con trỏ.
            if (
                this.mouse.active &&
                this.avoidEnabled &&
                this.avoidDistance > 0
            ) {
                const dx = fish.x - this.mouse.x;
                const dy = fish.y - this.mouse.y;

                const distance = Math.sqrt(dx * dx + dy * dy);

                if (
                    distance > 0.001 &&
                    distance < this.avoidDistance
                ) {
                    const strength =
                        1 - distance / this.avoidDistance;

                    steerX += dx / distance * strength * 3.2;
                    steerY += dy / distance * strength * 3.2;
                }
            }

            // Tránh mép màn hình.
            const margin = Math.max(35, fish.size * 2.2);
            const edgeRange = 95;

            if (fish.x < margin + edgeRange) {
                steerX +=
                    (1 - (fish.x - margin) / edgeRange) * 1.5;
            } else if (
                fish.x > this.width - margin - edgeRange
            ) {
                steerX -=
                    (1 - (this.width - margin - fish.x) / edgeRange) * 1.5;
            }

            if (fish.y < margin + edgeRange) {
                steerY +=
                    (1 - (fish.y - margin) / edgeRange) * 1.5;
            } else if (
                fish.y > this.height - margin - edgeRange
            ) {
                steerY -=
                    (1 - (this.height - margin - fish.y) / edgeRange) * 1.5;
            }

            // Giới hạn tốc độ.
            const maxSpeed = Math.max(
                0.1,
                Math.min(20, this.speed * fish.speedVariation)
            );

            const acceleration = this.limitVector(
                steerX,
                steerY,
                2
            );

            fish.vx += acceleration.x * 0.055 * frame;
            fish.vy += acceleration.y * 0.055 * frame;

            // Giới hạn vận tốc trước khi di chuyển.
            let velocity = Math.sqrt(
                fish.vx * fish.vx +
                fish.vy * fish.vy
            );

            if (velocity > maxSpeed && velocity > 0) {
                fish.vx = fish.vx / velocity * maxSpeed;
                fish.vy = fish.vy / velocity * maxSpeed;
            }

            const friction = Math.pow(0.992, frame);

            fish.vx *= friction;
            fish.vy *= friction;

            fish.x += fish.vx * frame;
            fish.y += fish.vy * frame;

            // Giữ cá trong màn hình.
            const minX = margin;
            const maxX = Math.max(minX, this.width - margin);

            const minY = margin;
            const maxY = Math.max(minY, this.height - margin);

            if (fish.x < minX) {
                fish.x = minX;
                fish.vx = Math.abs(fish.vx) * 0.65;
            } else if (fish.x > maxX) {
                fish.x = maxX;
                fish.vx = -Math.abs(fish.vx) * 0.65;
            }

            if (fish.y < minY) {
                fish.y = minY;
                fish.vy = Math.abs(fish.vy) * 0.65;
            } else if (fish.y > maxY) {
                fish.y = maxY;
                fish.vy = -Math.abs(fish.vy) * 0.65;
            }

            if (Math.abs(fish.vx) > 0.03) {
                fish.direction = fish.vx >= 0 ? 1 : -1;
            }
        }

        // =====================================
        // VẼ NỀN NƯỚC
        // =====================================

        drawBackground(ctx) {
            ctx.clearRect(0, 0, this.width, this.height);

            ctx.fillStyle = "rgba(15,145,190,0.075)";
            ctx.fillRect(0, 0, this.width, this.height);

            const light = ctx.createRadialGradient(
                this.width * 0.5,
                0,
                10,
                this.width * 0.5,
                this.height * 0.3,
                this.height * 0.9
            );

            light.addColorStop(0, "rgba(160,240,255,0.09)");
            light.addColorStop(0.5, "rgba(80,200,230,0.025)");
            light.addColorStop(1, "rgba(0,70,120,0)");

            ctx.fillStyle = light;
            ctx.fillRect(0, 0, this.width, this.height);
        }

// =====================================
// GỢN SÓNG NƯỚC NHẸ
// =====================================

drawWaterRipples(ctx, time) {
    ctx.save();

    const spacing = 85;
    const speed = time * 0.00035;

    for (let i = 0; i < 6; i++) {
        const baseY = (i + 1) * spacing;

        ctx.beginPath();

        for (let x = -10; x <= this.width + 10; x += 12) {
            const wave =
                Math.sin(x * 0.009 + speed + i * 1.7) * 2.2 +
                Math.sin(x * 0.018 - speed * 0.7 + i) * 1.1;

            const y = baseY + wave;

            if (x === -10) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }

        ctx.strokeStyle = "rgba(190,245,255,0)";
        ctx.lineWidth = 1.2;
        ctx.stroke();
    }

    // Một vài gợn sóng tròn mờ
    for (let i = 0; i < 3; i++) {
        const cycle = (time * 0.00012 + i / 3) % 1;

        const x = this.width * (0.2 + i * 0.3);
        const y = this.height * (0.3 + (i % 2) * 0.35);
        const radius = 8 + cycle * 32;
        const alpha = (1 - cycle) * 0;

        ctx.beginPath();
        ctx.ellipse(
            x,
            y,
            radius * 1.8,
            radius * 0.45,
            0,
            0,
            Math.PI * 2
        );

        ctx.strokeStyle = `rgba(190,245,255,${alpha})`;
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    ctx.restore();
}

        // =====================================
        // VẼ CÁ
        // =====================================

        drawFish(ctx, fish) {
            const s = fish.size;

            if (!fish.sprite) {
                const sprite = document.createElement("canvas");
                const scale = 2;

                sprite.width = Math.ceil(s * 3.4 * scale);
                sprite.height = Math.ceil(s * 2.2 * scale);

                const g = sprite.getContext("2d");
                const w = sprite.width;
                const h = sprite.height;

                g.scale(scale, scale);
                g.translate(w / scale / 2, h / scale / 2);

                // Bóng thân.
                g.fillStyle = "rgba(0,20,35,0.16)";
                g.beginPath();
                g.ellipse(
                    -s * 0.02,
                    s * 0.16,
                    s * 0.79,
                    s * 0.34,
                    0,
                    0,
                    Math.PI * 2
                );
                g.fill();

                // Đuôi cá.
                const tail = g.createLinearGradient(
                    -s * 1.35,
                    0,
                    -s * 0.45,
                    0
                );

                tail.addColorStop(0, fish.color);
                tail.addColorStop(1, "rgba(255,255,255,0.65)");

                g.fillStyle = tail;
                g.beginPath();

                g.moveTo(-s * 0.58, 0);
                g.bezierCurveTo(
                    -s * 0.85, -s * 0.12,
                    -s * 1.12, -s * 0.62,
                    -s * 1.42, -s * 0.52
                );

                g.quadraticCurveTo(
                    -s * 1.30,
                    -s * 0.08,
                    -s * 1.12,
                    0
                );

                g.quadraticCurveTo(
                    -s * 1.30,
                    s * 0.08,
                    -s * 1.42,
                    s * 0.52
                );

                g.bezierCurveTo(
                    -s * 1.05, s * 0.48,
                    -s * 0.82, s * 0.12,
                    -s * 0.58, 0
                );

                g.closePath();
                g.fill();

                // Vây đuôi.
                g.strokeStyle = "rgba(255,255,255,0.42)";
                g.lineWidth = 0.7;

                g.beginPath();
                g.moveTo(-s * 0.65, 0);
                g.lineTo(-s * 1.30, -s * 0.34);

                g.moveTo(-s * 0.65, 0);
                g.lineTo(-s * 1.30, s * 0.34);

                g.stroke();

                // Vây lưng.
                g.fillStyle = "rgba(255,255,255,0.32)";
                g.beginPath();

                g.moveTo(-s * 0.38, -s * 0.30);
                g.bezierCurveTo(
                    -s * 0.12, -s * 0.82,
                    s * 0.25, -s * 0.65,
                    s * 0.48, -s * 0.30
                );

                g.closePath();
                g.fill();

                // Thân cá.
                const body = g.createLinearGradient(
                    0,
                    -s * 0.52,
                    0,
                    s * 0.48
                );

                body.addColorStop(0, "#FFF8E9");
                body.addColorStop(0.18, fish.color);
                body.addColorStop(0.65, fish.color);
                body.addColorStop(1, "rgba(25,35,50,0.58)");

                g.fillStyle = body;
                g.beginPath();

                g.moveTo(s * 0.86, -s * 0.02);

                g.bezierCurveTo(
                    s * 0.73, -s * 0.37,
                    s * 0.20, -s * 0.53,
                    -s * 0.34, -s * 0.40
                );

                g.bezierCurveTo(
                    -s * 0.62, -s * 0.34,
                    -s * 0.75, -s * 0.15,
                    -s * 0.76, 0
                );

                g.bezierCurveTo(
                    -s * 0.70, s * 0.30,
                    -s * 0.22, s * 0.49,
                    s * 0.35, s * 0.38
                );

                g.bezierCurveTo(
                    s * 0.66, s * 0.29,
                    s * 0.82, s * 0.12,
                    s * 0.86, -s * 0.02
                );

                g.closePath();
                g.fill();

                g.strokeStyle = "rgba(20,45,55,0.22)";
                g.lineWidth = 0.8;
                g.stroke();

                // Vây ngực.
                g.fillStyle = "rgba(255,255,255,0.38)";
                g.beginPath();

                g.moveTo(-s * 0.12, s * 0.08);
                g.bezierCurveTo(
                    s * 0.04, s * 0.10,
                    s * 0.28, s * 0.42,
                    s * 0.10, s * 0.43
                );

                g.bezierCurveTo(
                    -s * 0.04, s * 0.34,
                    -s * 0.12, s * 0.19,
                    -s * 0.12, s * 0.08
                );

                g.fill();

                // Mang cá.
                g.strokeStyle = "rgba(35,45,50,0.34)";
                g.lineWidth = 0.8;

                g.beginPath();
                g.arc(
                    s * 0.35,
                    0,
                    s * 0.22,
                    Math.PI * 0.42,
                    Math.PI * 1.55
                );
                g.stroke();

                // Ánh sáng.
                g.fillStyle = "rgba(255,255,255,0.20)";
                g.beginPath();

                g.ellipse(
                    s * 0.22,
                    -s * 0.22,
                    s * 0.34,
                    s * 0.075,
                    -0.12,
                    0,
                    Math.PI * 2
                );

                g.fill();

                // Mắt.
                g.fillStyle = "rgba(255,255,255,0.96)";
                g.beginPath();
                g.arc(s * 0.62, -s * 0.12, s * 0.105, 0, Math.PI * 2);
                g.fill();

                g.fillStyle = "#182B35";
                g.beginPath();
                g.arc(s * 0.65, -s * 0.12, s * 0.055, 0, Math.PI * 2);
                g.fill();

                g.fillStyle = "rgba(255,255,255,0.95)";
                g.beginPath();
                g.arc(s * 0.67, -s * 0.145, s * 0.018, 0, Math.PI * 2);
                g.fill();

                fish.sprite = sprite;
            }

            ctx.save();
            ctx.translate(fish.x, fish.y);
            ctx.scale(fish.direction, 1);

            ctx.drawImage(
                fish.sprite,
                -fish.sprite.width / 4,
                -fish.sprite.height / 4,
                fish.sprite.width / 2,
                fish.sprite.height / 2
            );

            ctx.restore();
        }

        // =====================================
        // VẼ BONG BÓNG
        // =====================================

        drawBubbles(ctx, dt) {
            if (!this.bubblesEnabled) return;

            while (this.bubbles.length < 30) {
                this.bubbles.push(this.createBubble());
            }

            ctx.save();

            for (const bubble of this.bubbles) {
                bubble.y -= bubble.speed * dt / 16.67;
                bubble.x += bubble.drift * dt / 16.67;

                if (bubble.y < -10) {
                    Object.assign(bubble, this.createBubble());
                    bubble.y = this.height + 5;
                }

                ctx.strokeStyle =
                    `rgba(220,250,255,${bubble.alpha})`;

                ctx.lineWidth = 1.2;

                ctx.beginPath();
                ctx.arc(
                    bubble.x,
                    bubble.y,
                    bubble.radius,
                    0,
                    Math.PI * 2
                );

                ctx.stroke();
            }

            ctx.restore();
        }

        // =====================================
        // VÒNG LẶP ANIMATION
        // =====================================

        loop(time) {
            if (!this.active) return;

            const dt = Math.min(
                Math.max(time - this.lastTime, 0),
                40
            );

            this.lastTime = time;

            const ctx = this.ctx;

            this.drawBackground(ctx);

// Hiệu ứng gợn sóng nước
this.drawWaterRipples(ctx, time);

// Dựng lưới trước khi cập nhật tất cả cá.
this.buildFishGrid();

            for (const fish of this.fish) {
                this.updateFish(fish, dt, time);
                this.drawFish(ctx, fish);
            }

            this.drawBubbles(ctx, dt);

            this.animation = requestAnimationFrame(
                t => this.loop(t)
            );
        }

        // =====================================
        // KHỞI ĐỘNG
        // =====================================

        start() {
            if (this.animation !== null) return;

            this.active = true;
            this.bubbles = [];

            for (let i = 0; i < 30; i++) {
                this.bubbles.push(this.createBubble());
            }

            this.lastTime = performance.now();

            this.animation = requestAnimationFrame(
                t => this.loop(t)
            );
        }
    }

    const extension = new TurboWrapAquarium();

    Scratch.extensions.register(extension);

})(Scratch);
