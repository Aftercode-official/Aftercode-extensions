// Name: HyperSpace Math
// Description: Extension for complex numbers and quaternions
// ID: hyperspacemath
// By: Cunken <https://turbows.pages.dev/users/cunken_py>
// License: MIT

(function (Scratch) {
    'use strict';

    class HyperSpaceMathExtension {
        getInfo() {
            return {
                id: 'hyperspacemath',
                name: 'HyperSpace Math',
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
                            X: { type: Scratch.ArgumentType.STRING, defaultValue: '(1, 2, 3, 4)' },
                            OP4: {
                                type: Scratch.ArgumentType.STRING,
                                menu: 'op4Menu',
                                defaultValue: '+'
                            },
                            Y: { type: Scratch.ArgumentType.STRING, defaultValue: '(5, 6, 7, 8)' }
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
                        text: '[X] thuộc tập [SET]?',
                        arguments: {
                            X: { type: Scratch.ArgumentType.STRING, defaultValue: '5' },
                            SET: {
                                type: Scratch.ArgumentType.STRING,
                                menu: 'setMenu',
                                defaultValue: 'R'
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
                            { text: '* (nhân Quaternion)', value: '*' }
                        ]
                    },
                    setMenu: {
                        acceptReporters: false,
                        items: [
                            { text: 'N (Tự nhiên)', value: 'N' },
                            { text: 'Z (Nguyên)', value: 'Z' },
                            { text: 'P (Nguyên tố)', value: 'P' },
                            { text: 'Q (Hữu tỉ)', value: 'Q' },
                            { text: 'R (Thực)', value: 'R' },
                            { text: 'C (Phức)', value: 'C' },
                            { text: 'H (Quaternion 4D)', value: 'H' }
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

        _parseQuaternion(input) {
            if (!input || typeof input !== 'string') return { q: [0,0,0,0], valid: false };
            let s = input.trim();
            s = s.replace(/[()]/g, '');
            let parts = s.split(',').map(item => parseFloat(item.trim()));
            if (parts.length !== 4 || parts.some(isNaN)) {
                return { q: [0,0,0,0], valid: false };
            }
            return { q: parts, valid: true };
        }

        _formatQuaternion(q) {
            let r = q.map(val => Math.round(val * 1e10) / 1e10);
            return `(${r[0]}, ${r[1]}, ${r[2]}, ${r[3]})`;
        }

        _parse(input) {
            if (typeof input === 'number') {
                return { r: input, i: 0, valid: true, isH: false };
            }
            if (!input || typeof input !== 'string') {
                return { r: 0, i: 0, valid: false, isH: false };
            }

            let s = input.replace(/\s+/g, '');
            if (s === '') return { r: 0, i: 0, valid: false, isH: false };

            if (s.startsWith('(') && s.endsWith(')')) {
                let h4 = _parseQ_internal(s);
                return { r: h4.q[0], i: 0, q4: h4.q, valid: h4.valid, isH: true };
            }

            if (!/^[-+]?(\d+(\.\d*)?|\.\d+)?([-+](\d+(\.\d*)?|\.\d+)i)?$|^[-+]?(\d+(\.\d*)?|\.\d+)?i$|^[-+]?i$/.test(s)) {
                return { r: 0, i: 0, valid: false, isH: false };
            }

            if (!s.includes('i')) {
                const num = Number(s);
                return { r: isNaN(num) ? 0 : num, i: 0, valid: !isNaN(num), isH: false };
            }

            if (s === 'i') return { r: 0, i: 1, valid: true, isH: false };
            if (s === '-i') return { r: 0, i: -1, valid: true, isH: false };

            if (s.endsWith('i') && !s.slice(0, -1).includes('i') && !s.slice(0, -1).includes('+') && !s.slice(0, -1).slice(1).includes('-')) {
                const val = parseFloat(s.slice(0, -1));
                return { r: 0, i: isNaN(val) ? 1 : val, valid: true, isH: false };
            }

            let lastSignIdx = -1;
            for (let idx = 1; idx < s.length - 1; idx++) {
                if (s[idx] === '+' || s[idx] === '-') {
                    lastSignIdx = idx;
                }
            }

            let r = 0, i = 0;
            if (lastSignIdx !== -1) {
                const realPart = s.substring(0, lastSignIdx);
                const imagPart = s.substring(lastSignIdx);
                r = parseFloat(realPart) || 0;
                let imStr = imagPart.replace('i', '');
                if (imStr === '+' || imStr === '') i = 1;
                else if (imStr === '-') i = -1;
                else i = parseFloat(imStr) || 0;
            } else {
                if (s.endsWith('i')) {
                    let imStr = s.replace('i', '');
                    i = (imStr === '' || imStr === '+') ? 1 : (imStr === '-' ? -1 : parseFloat(imStr) || 0);
                } else {
                    r = parseFloat(s) || 0;
                }
            }

            return { r, i, valid: true, isH: false };
        }

        _format(r, i) {
            r = Math.round(r * 1e10) / 1e10;
            i = Math.round(i * 1e10) / 1e10;

            if (r === 0 && i === 0) return '0';
            if (r === 0) {
                if (i === 1) return 'i';
                if (i === -1) return '-i';
                return `${i}i`;
            }
            if (i === 0) return `${r}`;

            const sign = i >= 0 ? '+' : '-';
            const absI = Math.abs(i);
            const iStr = absI === 1 ? 'i' : `${absI}i`;
            return `${r} ${sign} ${iStr}`;
        }

        pureImaginary(args) {
            const n = Number(args.NUM) || 0;
            return this._format(0, n);
        }

        createQuaternion(args) {
            let w = Number(args.W) || 0;
            let x = Number(args.X) || 0;
            let y = Number(args.Y) || 0;
            let z = Number(args.Z) || 0;
            return this._formatQuaternion([w, x, y, z]);
        }

        calculateComplex(args) {
            const c1 = this._parse(args.X);
            const c2 = this._parse(args.Y);
            if (!c1.valid || !c2.valid) return '0';

            const op = args.OP;
            let r = 0, i = 0;

            switch (op) {
                case '+':
                    r = c1.r + c2.r;
                    i = c1.i + c2.i;
                    break;
                case '-':
                    r = c1.r - c2.r;
                    i = c1.i - c2.i;
                    break;
                case '*':
                    r = c1.r * c2.r - c1.i * c2.i;
                    i = c1.r * c2.i + c1.i * c2.r;
                    break;
                case '/':
                    const denom = c2.r * c2.r + c2.i * c2.i;
                    if (denom !== 0) {
                        r = (c1.r * c2.r + c1.i * c2.i) / denom;
                        i = (c1.i * c2.r - c1.r * c2.i) / denom;
                    }
                    break;
                case '^':
                    const n = c2.r;
                    const modulus = Math.hypot(c1.r, c1.i);
                    const theta = Math.atan2(c1.i, c1.r);
                    const modN = Math.pow(modulus, n);
                    r = modN * Math.cos(n * theta);
                    i = modN * Math.sin(n * theta);
                    break;
            }

            return this._format(r, i);
        }

        calculateQuaternion(args) {
            let h1 = this._parseQuaternion(args.X);
            let h2 = this._parseQuaternion(args.Y);
            if (!h1.valid || !h2.valid) return '(0, 0, 0, 0)';

            let a = h1.q;
            let b = h2.q;
            let op = args.OP4;

            if (op === '+') {
                return this._formatQuaternion([a[0]+b[0], a[1]+b[1], a[2]+b[2], a[3]+b[3]]);
            } else if (op === '-') {
                return this._formatQuaternion([a[0]-b[0], a[1]-b[1], a[2]-b[2], a[3]-b[3]]);
            } else if (op === '*') {
                let w = a[0]*b[0] - a[1]*b[1] - a[2]*b[2] - a[3]*b[3];
                let x = a[0]*b[1] + a[1]*b[0] + a[2]*b[3] - a[3]*b[2];
                let y = a[0]*b[2] - a[1]*b[3] + a[2]*b[0] + a[3]*b[1];
                let z = a[0]*b[3] + a[1]*b[2] - a[2]*b[1] + a[3]*b[0];
                return this._formatQuaternion([w, x, y, z]);
            }
            return '(0, 0, 0, 0)';
        }

        sqrtComplex(args) {
            const c = this._parse(args.X);
            if (!c.valid) return '0';

            if (c.isH) {
                let q = c.q4;
                let w = q[0], x = q[1], y = q[2], z = q[3];
                let vecNorm = Math.hypot(x, y, z);
                let normQ = Math.hypot(w, x, y, z);

                if (vecNorm === 0) {
                    if (w >= 0) return this._formatQuaternion([Math.sqrt(w), 0, 0, 0]);
                    else return this._formatQuaternion([0, Math.sqrt(-w), 0, 0]);
                }

                let factor = Math.sqrt((normQ + w) / 2);
                let vFactor = 1 / (2 * factor);
                return this._formatQuaternion([
                    factor,
                    x * vFactor,
                    y * vFactor,
                    z * vFactor
                ]);
            }

            const modulus = Math.hypot(c.r, c.i);
            const theta = Math.atan2(c.i, c.r);
            const sqrtMod = Math.sqrt(modulus);
            const halfTheta = theta / 2;

            let r = sqrtMod * Math.cos(halfTheta);
            let i = sqrtMod * Math.sin(halfTheta);

            return this._format(r, i);
        }

        swapComplex(args) {
            const c = this._parse(args.X);
            if (!c.valid) return '0';
            if (c.isH) {
                let q = c.q4;
                return this._formatQuaternion([q[0], -q[1], -q[2], -q[3]]);
            }
            return this._format(c.i, c.r);
        }

        checkSet(args) {
            const c = this._parse(args.X);
            if (!c.valid) return false;

            const setType = args.SET;
            if (setType === 'H') return c.isH;
            if (setType === 'C') return !c.isH;

            if (c.isH) return false;
            if (Math.abs(c.i) > 1e-9) return false;

            const val = c.r;
            const isInt = Math.abs(val - Math.round(val)) < 1e-9;

            switch (setType) {
                case 'R':
                    return true;
                case 'Q':
                    return !isNaN(val);
                case 'Z':
                    return isInt;
                case 'N':
                    return isInt && val >= 0;
                case 'P':
                    return this._isPrime(val);
                default:
                    return false;
            }
        }
    }

    function _parseQ_internal(input) {
        let s = input.replace(/[()]/g, '');
        let parts = s.split(',').map(item => parseFloat(item.trim()));
        if (parts.length !== 4 || parts.some(isNaN)) {
            return { q: [0,0,0,0], valid: false };
        }
        return { q: parts, valid: true };
    }

    Scratch.extensions.register(new HyperSpaceMathExtension());
})(Scratch);
