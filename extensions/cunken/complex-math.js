// Name: Complex number
// Description: Extension for complex numbers and quaternions
// ID: hyperspacemath
// By: Cunken <https://scratch.mit.edu/users/cunken/>
// License: MIT

(function(Scratch) {
'use strict';

class HyperSpaceMathExtension {
    getInfo() {
        return {
            id: 'hyperspacemath',
            name: 'Complex number v3',
            color1: '#9cb3ff',
            color2: '#7f9be6',
            color3: '#6882d1',
            blocks: [
                { blockType: Scratch.BlockType.LABEL, text: '── Complex & 4D Space ──' },
                { opcode:'pureImaginary', blockType:Scratch.BlockType.REPORTER, text:'i [NUM]', arguments:{NUM:{type:Scratch.ArgumentType.NUMBER,defaultValue:5}} },
                { opcode:'pureImaginaryJ', blockType:Scratch.BlockType.REPORTER, text:'j [NUM]', arguments:{NUM:{type:Scratch.ArgumentType.NUMBER,defaultValue:3}} },
                { opcode:'pureImaginaryK', blockType:Scratch.BlockType.REPORTER, text:'k [NUM]', arguments:{NUM:{type:Scratch.ArgumentType.NUMBER,defaultValue:4}} },
                { opcode:'calculateComplex', blockType:Scratch.BlockType.REPORTER, text:'[X] [OP] [Y]', arguments:{X:{type:Scratch.ArgumentType.STRING,defaultValue:'3 + 4i'},OP:{type:Scratch.ArgumentType.STRING,menu:'opMenu',defaultValue:'+'},Y:{type:Scratch.ArgumentType.STRING,defaultValue:'1 + 2i'}} },
                { opcode:'sqrtComplex', blockType:Scratch.BlockType.REPORTER, text:'√ [X]', arguments:{X:{type:Scratch.ArgumentType.STRING,defaultValue:'-4'}} },

                { blockType: Scratch.BlockType.LABEL, text: '── Hyperreal Numbers (ε & ω) ──' },
                { opcode:'createHyperreal', blockType:Scratch.BlockType.REPORTER, text:'Hyperreal [R] + [EPS]ε + [INF]ω', arguments:{R:{type:Scratch.ArgumentType.NUMBER,defaultValue:1},EPS:{type:Scratch.ArgumentType.NUMBER,defaultValue:2},INF:{type:Scratch.ArgumentType.NUMBER,defaultValue:3}} },
                { opcode:'trigHyperreal', blockType:Scratch.BlockType.REPORTER, text:'[TRIG] [X]', arguments:{TRIG:{type:Scratch.ArgumentType.STRING,menu:'trigMenu',defaultValue:'sin'},X:{type:Scratch.ArgumentType.STRING,defaultValue:'π/2 + i'}} },
                { opcode:'compareHyperreal', blockType:Scratch.BlockType.BOOLEAN, text:'[X] [CMP] [Y]', arguments:{X:{type:Scratch.ArgumentType.STRING,defaultValue:'5 + ε'},CMP:{type:Scratch.ArgumentType.STRING,menu:'cmpMenu',defaultValue:'<'},Y:{type:Scratch.ArgumentType.STRING,defaultValue:'5 + 2ε'}} },
                { opcode:'checkSet', blockType:Scratch.BlockType.BOOLEAN, text:'[X] ∈ [SET]?', arguments:{X:{type:Scratch.ArgumentType.STRING,defaultValue:'ε'},SET:{type:Scratch.ArgumentType.STRING,menu:'setMenu',defaultValue:'HPR'}} }
            ],
            menus: {
                opMenu:{acceptReporters:false,items:['+','-','*','/','^'].map(x=>({text:x,value:x}))},
                trigMenu:{acceptReporters:false,items:['sin','cos','tan'].map(x=>({text:x,value:x}))},
                cmpMenu:{acceptReporters:false,items:['<','>','=','<=','>='].map(x=>({text:x,value:x}))},
                setMenu:{acceptReporters:false,items:[
                    {text:'ℕ',value:'N'},{text:'𝕎',value:'W'},
                    {text:'ℤ',value:'Z'},{text:'ℙ',value:'P'},
                    {text:'ℚ',value:'Q'},{text:'ℝ',value:'R'},
                    {text:'*ℝ',value:'HPR'},{text:'ℂ',value:'C'},
                    {text:'ℍ',value:'H'}
                ]}
            }
        };
    }

    _zero() {
        return {r:0,i:0,j:0,k:0,eps:0,inf:0,pi:0,e:0,valid:true};
    }

    _coefficient(raw) {
        if (raw === '') return {value:1,pi:0,e:0};

        const m = raw.match(/^((?:\d+(?:\.\d*)?|\.\d+)?)(π|e)?(?:\/((?:\d+(?:\.\d*)?|\.\d+)))?$/);
        if (!m || (!m[1] && !m[2])) return null;

        const n = m[1] === '' ? 1 : Number(m[1]);
        const d = m[3] === undefined ? 1 : Number(m[3]);

        if (!Number.isFinite(n) || !Number.isFinite(d) || d === 0) return null;

        if (m[2] === 'π') {
            return {value:n*Math.PI/d,pi:n/d,e:0};
        }

        if (m[2] === 'e') {
            return {value:n*Math.E/d,pi:0,e:n/d};
        }

        return {value:n/d,pi:0,e:0};
    }

    _parse(input) {
        if (typeof input === 'number') {
            const h = this._zero();
            h.r = input;
            h.valid = Number.isFinite(input);
            return h;
        }

        if (typeof input !== 'string' || !input.trim()) {
            return {...this._zero(),valid:false};
        }

        const s = input.replace(/\s+/g,'');
        const h = this._zero();

        const re = /^((?:(?:\d+(?:\.\d*)?|\.\d+)?(?:π|e)?(?:\/(?:\d+(?:\.\d*)?|\.\d+))?))([ijkεω]?)/;

        let p = 0;
        let count = 0;

        while (p < s.length) {
            let sign = 1;

            if (s[p] === '+') p++;
            else if (s[p] === '-') {
                sign = -1;
                p++;
            } else if (count > 0) {
                return {...this._zero(),valid:false};
            }

            const m = s.slice(p).match(re);

            if (!m || (!m[1] && !m[2])) {
                return {...this._zero(),valid:false};
            }

            const c = this._coefficient(m[1]);
            if (!c) return {...this._zero(),valid:false};

            const v = sign*c.value;
            const unit = m[2];

            if (unit === 'i') h.i += v;
            else if (unit === 'j') h.j += v;
            else if (unit === 'k') h.k += v;
            else if (unit === 'ε') h.eps += v;
            else if (unit === 'ω') h.inf += v;
            else {
                h.r += v;
                h.pi += sign*c.pi;
                h.e += sign*c.e;
            }

            p += m[0].length;
            count++;
        }

        h.valid = count > 0 &&
            [h.r,h.i,h.j,h.k,h.eps,h.inf,h.pi,h.e].every(Number.isFinite);

        return h;
    }

    _clean(x) {
        if (!Number.isFinite(x)) return x;
        if (x === 0 || Math.abs(x) < 1e-12) return x;
        const n = Math.round(x*1e12)/1e12;
        return Object.is(n,-0) ? 0 : n;
    }

    _format(h) {
        const out = [];

        const add = (v,u) => {
            v = this._clean(v);
            if (v === 0) return;

            const abs = Math.abs(v);
            const t = u ? (abs === 1 ? u : String(abs)+u) : String(abs);

            out.push(
                out.length
                    ? (v < 0 ? '- ' : '+ ')+t
                    : (v < 0 ? '-' : '')+t
            );
        };

        add(h.r,'');
        add(h.i,'i');
        add(h.j,'j');
        add(h.k,'k');
        add(h.eps,'ε');
        add(h.inf,'ω');

        return out.join(' ') || '0';
    }

    _number(v) {
        v = Number(v);
        return Number.isFinite(v) ? v : 0;
    }

    _isPrime(n) {
        if (!Number.isFinite(n) || !Number.isInteger(n)) return false;
        if (n < 2) return false;
        if (n % 2 === 0) return n === 2;

        for (let d=3; d<=Math.sqrt(n); d+=2) {
            if (n%d === 0) return false;
        }
        return true;
    }

    pureImaginary(a) {
        return this._format({...this._zero(),i:this._number(a.NUM)});
    }

    pureImaginaryJ(a) {
        return this._format({...this._zero(),j:this._number(a.NUM)});
    }

    pureImaginaryK(a) {
        return this._format({...this._zero(),k:this._number(a.NUM)});
    }

    createHyperreal(a) {
        return this._format({
            ...this._zero(),
            r:this._number(a.R),
            eps:this._number(a.EPS),
            inf:this._number(a.INF)
        });
    }

    calculateComplex(a) {
        const x = this._parse(a.X);
        const y = this._parse(a.Y);

        if (!x.valid || !y.valid) return 'Invalid input';

        if (x.j || x.k || x.eps || x.inf ||
            y.j || y.k || y.eps || y.inf) {
            return 'Complex numbers only (a + bi)';
        }

        let r=0, i=0;

        switch(a.OP) {
            case '+':
                r=x.r+y.r;
                i=x.i+y.i;
                break;

            case '-':
                r=x.r-y.r;
                i=x.i-y.i;
                break;

            case '*':
                r=x.r*y.r-x.i*y.i;
                i=x.r*y.i+x.i*y.r;
                break;

            case '/': {
                const d=y.r*y.r+y.i*y.i;
                if (d === 0) return 'Error: division by zero';
                r=(x.r*y.r+x.i*y.i)/d;
                i=(x.i*y.r-x.r*y.i)/d;
                break;
            }

            case '^': {
                if (y.i !== 0) return 'Real exponent only';

                const n=y.r;
                const mag=Math.hypot(x.r,x.i);

                if (mag === 0 && n < 0) return 'Undefined result';

                if (mag === 0 && n === 0) {
                    r=1;
                    i=0;
                    break;
                }

                const t=Math.atan2(x.i,x.r);
                const power=Math.pow(mag,n);

                r=power*Math.cos(n*t);
                i=power*Math.sin(n*t);
                break;
            }

            default:
                return 'Invalid operator';
        }

        if (!Number.isFinite(r) || !Number.isFinite(i)) {
            return 'Undefined result';
        }

        return this._format({...this._zero(),r,i});
    }

    _mul(a,b) {
        return {
            r:a.r*b.r-a.i*b.i,
            i:a.r*b.i+a.i*b.r
        };
    }

    _div(a,b) {
        const d=b.r*b.r+b.i*b.i;
        if (d === 0) return null;

        return {
            r:(a.r*b.r+a.i*b.i)/d,
            i:(a.i*b.r-a.r*b.i)/d
        };
    }

    trigHyperreal(a) {
        const x=this._parse(a.X);
        if (!x.valid) return 'Invalid input';

        if (x.j || x.k || x.inf) {
            return 'Trig supports finite a + bi + cε only';
        }

        const s={
            r:Math.sin(x.r)*Math.cosh(x.i),
            i:Math.cos(x.r)*Math.sinh(x.i)
        };

        const c={
            r:Math.cos(x.r)*Math.cosh(x.i),
            i:-Math.sin(x.r)*Math.sinh(x.i)
        };

        let base, derivative;

        if (a.TRIG === 'sin') {
            base=s;
            derivative=c;
        } else if (a.TRIG === 'cos') {
            base=c;
            derivative={r:-s.r,i:-s.i};
        } else if (a.TRIG === 'tan') {
            base=this._div(s,c);
            if (!base) return 'Undefined (tan pole)';

            derivative=this._div(
                {r:1,i:0},
                this._mul(c,c)
            );

            if (!derivative) return 'Undefined (tan pole)';
        } else {
            return 'Invalid trig function';
        }

        const eps=this._mul(derivative,{r:x.eps,i:0});

        if (Math.abs(eps.i)>1e-9) {
            return 'Complex ε coefficient is not supported';
        }

        if (![base.r,base.i,eps.r].every(Number.isFinite)) {
            return 'Undefined result';
        }

        return this._format({
            ...this._zero(),
            r:base.r,
            i:base.i,
            eps:eps.r
        });
    }

    compareHyperreal(a) {
        const x=this._parse(a.X);
        const y=this._parse(a.Y);

        if (!x.valid || !y.valid ||
            x.i || x.j || x.k ||
            y.i || y.j || y.k) {
            return false;
        }

        // ω >> 1 >> ε > 0
        let cmp=0;

        for (const d of [
            x.inf-y.inf,
            x.r-y.r,
            x.eps-y.eps
        ]) {
            if (d !== 0) {
                cmp=d<0 ? -1 : 1;
                break;
            }
        }

        switch(a.CMP) {
            case '<': return cmp<0;
            case '>': return cmp>0;
            case '=': return cmp===0;
            case '<=': return cmp<=0;
            case '>=': return cmp>=0;
            default: return false;
        }
    }

    sqrtComplex(a) {
        const x=this._parse(a.X);

        if (!x.valid) return 'Invalid input';

        if (x.j || x.k || x.eps || x.inf) {
            return 'Square root supports complex numbers only';
        }

        const m=Math.hypot(x.r,x.i);

        if (m === 0) return '0';

        const t=Math.atan2(x.i,x.r);
        const sm=Math.sqrt(m);

        return this._format({
            ...this._zero(),
            r:sm*Math.cos(t/2),
            i:sm*Math.sin(t/2)
        });
    }

    checkSet(a) {
        const x=this._parse(a.X);
        if (!x.valid) return false;

        const real=!x.i&&!x.j&&!x.k&&!x.eps&&!x.inf;
        const complex=!x.j&&!x.k&&!x.eps&&!x.inf;
        const quaternion=!x.eps&&!x.inf;
        const hyperreal=!x.i&&!x.j&&!x.k;

        switch(a.SET) {
            case 'HPR':
                return hyperreal;

            case 'H':
                return quaternion;

            case 'C':
                return complex;

            case 'R':
                return real;

            default:
                if (!real) return false;

                const integer=Number.isInteger(x.r);
                const rational=integer || (x.pi===0 && x.e===0);

                switch(a.SET) {
                    case 'Q': return rational;
                    case 'Z': return integer;
                    case 'W': return integer && x.r>=0;
                    case 'N': return integer && x.r>0;
                    case 'P': return this._isPrime(x.r);
                    default: return false;
                }
        }
    }
}

Scratch.extensions.register(new HyperSpaceMathExtension());

})(Scratch);
