// Name: HyperSpace Math v2
// Description: Extension for complex numbers and quaternions
// ID: hyperspacemath
// By: Cunken <https://turbows.pages.dev/users/cunken_py>
// License: MIT

(function(Scratch) {
    'use strict';

    class HyperSpaceMathExtension {
        getInfo() {
            return {
                id: 'hyperspacemath',
                name: 'HyperSpace Math v2',
                color1: '#9cb3ff',
                color2: '#7f9be6',
                color3: '#6882d1',
                blocks: [
                    {
                        opcode: 'pureImaginary',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'i [NUM]',
                        arguments: {
                            NUM: { type: Scratch.ArgumentType.NUMBER, defaultValue: 5 }
                        }
                    },
                    {
                        opcode: 'pureImaginaryJ',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'j [NUM]',
                        arguments: {
                            NUM: { type: Scratch.ArgumentType.NUMBER, defaultValue: 3 }
                        }
                    },
                    {
                        opcode: 'pureImaginaryK',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'k [NUM]',
                        arguments: {
                            NUM: { type: Scratch.ArgumentType.NUMBER, defaultValue: 4 }
                        }
                    },
                    {
                        opcode: 'createQuaternion',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'Quaternion [W] + [X]i + [Y]j + [Z]k',
                        arguments: {
                            W: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 },
                            X: { type: Scratch.ArgumentType.NUMBER, defaultValue: 2 },
                            Y: { type: Scratch.ArgumentType.NUMBER, defaultValue: 3 },
                            Z: { type: Scratch.ArgumentType.NUMBER, defaultValue: 4 }
                        }
                    },
                    {
                        opcode: 'calculateComplex',
                        blockType: Scratch.BlockType.REPORTER,
                        text: '[X] [OP] [Y]',
                        arguments: {
                            X: { type: Scratch.ArgumentType.STRING, defaultValue: '3 + 4i' },
                            OP: {
                                type: Scratch.ArgumentType.STRING,
                                menu: 'opMenu',
                                defaultValue: '+'
                            },
                            Y: { type: Scratch.ArgumentType.STRING, defaultValue: '1 + 2i' }
                        }
                    },
                    {
                        opcode: 'calculateQuaternion',
                        blockType: Scratch.BlockType.REPORTER,
                        text: '4D [X] [OP4] [Y]',
                        arguments: {
                            X: { type: Scratch.ArgumentType.STRING, defaultValue: '5j' },
                            OP4: {
                                type: Scratch.ArgumentType.STRING,
                                menu: 'op4Menu',
                                defaultValue: '+'
                            },
                            Y: { type: Scratch.ArgumentType.STRING, defaultValue: '6k' }
                        }
                    },
                    {
                        opcode: 'sqrtComplex',
                        blockType: Scratch.BlockType.REPORTER,
                        text: '√ [X]',
                        arguments: {
                            X: { type: Scratch.ArgumentType.STRING, defaultValue: '-4' }
                        }
                    },
                    {
                        opcode: 'swapComplex',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'đổi chiều [X]',
                        arguments: {
                            X: { type: Scratch.ArgumentType.STRING, defaultValue: '3 + 4i' }
                        }
                    },
                    {
                        opcode: 'checkSet',
                        blockType: Scratch.BlockType.BOOLEAN,
                        text: '[X] ∈ [SET]?',
                        arguments: {
                            X: { type: Scratch.ArgumentType.STRING, defaultValue: '5' },
                            SET: {
                                type: Scratch.ArgumentType.STRING,
                                menu: 'setMenu',
                                defaultValue: 'ℝ'
                            }
                        }
                    }
                ],
                menus: {
                    opMenu: {
                        acceptReporters: false,
                        items: [
                            { text: '+', value: '+' },
                            { text: '-', value: '-' },
                            { text: '*', value: '*' },
                            { text: '/', value: '/' },
                            { text: '^', value: '^' }
                        ]
                    },
                    op4Menu: {
                        acceptReporters: false,
                        items: [
                            { text: '+', value: '+' },
                            { text: '-', value: '-' },
                            { text: '*', value: '*' }
                        ]
                    },
                    setMenu: {
                        acceptReporters: false,
                        items: [
                            { text: 'ℕ', value: 'N' },
                            { text: '𝕎', value: 'W' },
                            { text: 'ℤ', value: 'Z' },
                            { text: 'ℙ', value: 'P' },
                            { text: 'ℚ', value: 'Q' },
                            { text: 'ℝ', value: 'R' },
                            { text: 'ℂ', value: 'C' },
                            { text: 'ℍ', value: 'H' }
                        ]
                    }
                }
            };
        }

        _isPrime(n) {
            if (Math.abs(n - Math.round(n)) > 1e-9) return false;
            let num = Math.round(n);
            if (num < 2) return false;
            for (let i = 2; i <= Math.sqrt(num); i++) {
                if (num % i === 0) return false;
            }
            return true;
        }

        _formatQuaternion(q) {
            let r = q.map(val => Math.round(val * 1e10) / 1e10);
            let w = r[0], x = r[1], y = r[2], z = r[3];
            let terms = [];

            if (w !== 0) terms.push(w.toString());
            if (x !== 0) {
                let absX = Math.abs(x);
                let xStr = absX === 1 ? 'i' : `${absX}i`;
                terms.push(terms.length > 0 ? (x > 0 ? `+ ${xStr}` : `- ${xStr}`) : (x < 0 ? `-${xStr}` : xStr));
            }
            if (y !== 0) {
                let absY = Math.abs(y);
                let yStr = absY === 1 ? 'j' : `${absY}j`;
                terms.push(terms.length > 0 ? (y > 0 ? `+ ${yStr}` : `- ${yStr}`) : (y < 0 ? `-${yStr}` : yStr));
            }
            if (z !== 0) {
                let absZ = Math.abs(z);
                let zStr = absZ === 1 ? 'k' : `${absZ}k`;
                terms.push(terms.length > 0 ? (z > 0 ? `+ ${zStr}` : `- ${zStr}`) : (z < 0 ? `-${zStr}` : zStr));
            }
            return terms.length > 0 ? terms.join(' ') : '0';
        }

        _parse(input) {
            if (typeof input === 'number') return { q4: [input, 0, 0, 0], valid: true };
            if (!input || typeof input !== 'string') return { q4: [0, 0, 0, 0], valid: false };

            let s = input.replace(/\s+/g, '');
            if (s === '') return { q4: [0, 0, 0, 0], valid: false };

            if (s.startsWith('(') && s.endsWith(')')) {
                let parts = s.slice(1, -1).split(',').map(item => parseFloat(item.trim()));
                if (parts.length === 4 && !parts.some(isNaN)) return { q4: parts, valid: true };
            }

            let q = [0, 0, 0, 0];
            let tokens = s.match(/[+-]?[^+-]+/g);
            if (!tokens) return { q4: q, valid: false };

            let valid = true;
            for (let token of tokens) {
                if (token.endsWith('i') && !token.includes('j') && !token.includes('k')) {
                    let val = parseFloat(token.replace('i', '')) || (token.includes('-') ? -1 : 1);
                    q[1] += val;
                } else if (token.endsWith('j')) {
                    let val = parseFloat(token.replace('j', '')) || (token.includes('-') ? -1 : 1);
                    q[2] += val;
                } else if (token.endsWith('k')) {
                    let val = parseFloat(token.replace('k', '')) || (token.includes('-') ? -1 : 1);
                    q[3] += val;
                } else {
                    let val = parseFloat(token);
                    if (isNaN(val)) valid = false;
                    else q[0] += val;
                }
            }
            return { q4: q, valid: valid };
        }

        pureImaginary(args) { return this._formatQuaternion([0, Number(args.NUM) || 0, 0, 0]); }
        pureImaginaryJ(args) { return this._formatQuaternion([0, 0, Number(args.NUM) || 0, 0]); }
        pureImaginaryK(args) { return this._formatQuaternion([0, 0, 0, Number(args.NUM) || 0]); }

        createQuaternion(args) {
            return this._formatQuaternion([Number(args.W) || 0, Number(args.X) || 0, Number(args.Y) || 0, Number(args.Z) || 0]);
        }

        calculateComplex(args) {
            const c1 = this._parse(args.X);
            const c2 = this._parse(args.Y);
            if (!c1.valid || !c2.valid) return '0';

            let r = c1.q4[0], i = c1.q4[1];
            let r2 = c2.q4[0], i2 = c2.q4[1];
            let resR = 0, resI = 0;

            switch (args.OP) {
                case '+': resR = r + r2; resI = i + i2; break;
                case '-': resR = r - r2; resI = i - i2; break;
                case '*': resR = r * r2 - i * i2; resI = r * i2 + i * r2; break;
                case '/':
                    let denom = r2 * r2 + i2 * i2;
                    if (denom !== 0) { resR = (r * r2 + i * i2) / denom; resI = (i * r2 - r * i2) / denom; }
                    break;
                case '^':
                    let mod = Math.hypot(r, i), th = Math.atan2(i, r), n = r2;
                    resR = Math.pow(mod, n) * Math.cos(n * th);
                    resI = Math.pow(mod, n) * Math.sin(n * th);
                    break;
            }
            return this._formatQuaternion([resR, resI, 0, 0]);
        }

        calculateQuaternion(args) {
            let h1 = this._parse(args.X);
            let h2 = this._parse(args.Y);
            if (!h1.valid || !h2.valid) return '0';

            let a = h1.q4, b = h2.q4;
            if (args.OP4 === '+') return this._formatQuaternion([a[0]+b[0], a[1]+b[1], a[2]+b[2], a[3]+b[3]]);
            if (args.OP4 === '-') return this._formatQuaternion([a[0]-b[0], a[1]-b[1], a[2]-b[2], a[3]-b[3]]);
            if (args.OP4 === '*') {
                let w = a[0]*b[0] - a[1]*b[1] - a[2]*b[2] - a[3]*b[3];
                let x = a[0]*b[1] + a[1]*b[0] + a[2]*b[3] - a[3]*b[2];
                let y = a[0]*b[2] - a[1]*b[3] + a[2]*b[0] + a[3]*b[1];
                let z = a[0]*b[3] + a[1]*b[2] - a[2]*b[1] + a[3]*b[0];
                return this._formatQuaternion([w, x, y, z]);
            }
            return '0';
        }

        sqrtComplex(args) {
            let c = this._parse(args.X);
            if (!c.valid) return '0';
            let [w, x, y, z] = c.q4;
            let vecNorm = Math.hypot(x, y, z), normQ = Math.hypot(w, x, y, z);
            if (vecNorm === 0) return w >= 0 ? this._formatQuaternion([Math.sqrt(w), 0, 0, 0]) : this._formatQuaternion([0, Math.sqrt(-w), 0, 0]);
            let f = Math.sqrt((normQ + w) / 2), vf = 1 / (2 * f);
            return this._formatQuaternion([f, x * vf, y * vf, z * vf]);
        }

        swapComplex(args) {
            let c = this._parse(args.X);
            if (!c.valid) return '0';
            let q = c.q4;
            return this._formatQuaternion([q[0], -q[1], -q[2], -q[3]]);
        }

        checkSet(args) {
            let c = this._parse(args.X);
            if (!c.valid) return false;
            let [val, i, j, k] = c.q4;
            let isReal = Math.abs(i) < 1e-9 && Math.abs(j) < 1e-9 && Math.abs(k) < 1e-9;
            let isCplx = Math.abs(j) < 1e-9 && Math.abs(k) < 1e-9;

            if (args.SET === 'H') return true;
            if (args.SET === 'C') return isCplx;
            if (!isReal) return false;

            let isInt = Math.abs(val - Math.round(val)) < 1e-9;
            switch (args.SET) {
                case 'R': return true;
                case 'Q': return !isNaN(val);
                case 'Z': return isInt;
                case 'W': return isInt && val >= 0;
                case 'N': return isInt && val > 0;
                case 'P': return this._isPrime(val);
                default: return false;
            }
        }
    }

    Scratch.extensions.register(new HyperSpaceMathExtension());
})(Scratch);
