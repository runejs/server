export class Isaac {

    private m: number[] = Array(256); // internal memory
    private acc = 0; // accumulator
    private brs = 0; // last result
    private cnt = 0; // counter
    private r: number[] = Array(256); // result array
    private gnt = 0; // generation counter

    public constructor(seed?: number[]) {
        this.seed(seed);
    }

    public getR(): number[] {
        return this.r;
    }

    public add(x: number, y: number): number {
        const lsb = (x & 0xffff) + (y & 0xffff);
        const msb = (x >>>   16) + (y >>>   16) + (lsb >>> 16);
        return (msb << 16) | (lsb & 0xffff);
    }

    public reset(): void {
        this.acc = this.brs = this.cnt = 0;
        for(let i = 0; i < 256; ++i)
            this.m[i] = this.r[i] = 0;
        this.gnt = 0;
    }

    public seed(s: number[]): void {
        let a, b, c, d, e, f, g, h, i;

        /* seeding the seeds of love */
        a = b = c = d =
            e = f = g = h = 0x9e3779b9; /* the golden ratio */

        this.reset();
        for(i = 0; i < s.length; i++)
            this.r[i & 0xff] += (typeof(s[i]) === 'number') ? s[i] : 0;

        /* private: seed mixer */
        const seed_mix = () => {
            a ^= b <<  11; d = this.add(d, a); b = this.add(b, c);
            b ^= c >>>  2; e = this.add(e, b); c = this.add(c, d);
            c ^= d <<   8; f = this.add(f, c); d = this.add(d, e);
            d ^= e >>> 16; g = this.add(g, d); e = this.add(e, f);
            e ^= f <<  10; h = this.add(h, e); f = this.add(f, g);
            f ^= g >>>  4; a = this.add(a, f); g = this.add(g, h);
            g ^= h <<   8; b = this.add(b, g); h = this.add(h, a);
            h ^= a >>>  9; c = this.add(c, h); a = this.add(a, b);
        };

        for(i = 0; i < 4; i++) /* scramble it */
            seed_mix();

        for(i = 0; i < 256; i += 8) {
            if(s) { /* use all the information in the seed */
                a = this.add(a, this.r[i + 0]); b = this.add(b, this.r[i + 1]);
                c = this.add(c, this.r[i + 2]); d = this.add(d, this.r[i + 3]);
                e = this.add(e, this.r[i + 4]); f = this.add(f, this.r[i + 5]);
                g = this.add(g, this.r[i + 6]); h = this.add(h, this.r[i + 7]);
            }
            seed_mix();
            /* fill in m[] with messy stuff */
            this.m[i + 0] = a; this.m[i + 1] = b; this.m[i + 2] = c; this.m[i + 3] = d;
            this.m[i + 4] = e; this.m[i + 5] = f; this.m[i + 6] = g; this.m[i + 7] = h;
        }
        if(s) {
            /* do a second pass to make all of the seed affect all of m[] */
            for(i = 0; i < 256; i += 8) {
                a = this.add(a, this.m[i + 0]); b = this.add(b, this.m[i + 1]);
                c = this.add(c, this.m[i + 2]); d = this.add(d, this.m[i + 3]);
                e = this.add(e, this.m[i + 4]); f = this.add(f, this.m[i + 5]);
                g = this.add(g, this.m[i + 6]); h = this.add(h, this.m[i + 7]);
                seed_mix();
                /* fill in m[] with messy stuff (again) */
                this.m[i + 0] = a; this.m[i + 1] = b; this.m[i + 2] = c; this.m[i + 3] = d;
                this.m[i + 4] = e; this.m[i + 5] = f; this.m[i + 6] = g; this.m[i + 7] = h;
            }
        }

        this.prng(); /* fill in the first set of results */
        this.gnt = 256;  /* prepare to use the first set of results */
    }

    public prng(n?: number): void {
        let i, x, y;

        n = (n && typeof(n) === 'number')
            ? Math.abs(Math.floor(n)) : 1;

        while(n--) {
            this.cnt = this.add(this.cnt,   1);
            this.brs = this.add(this.brs, this.cnt);

            for(i = 0; i < 256; i++) {
                switch(i & 3) {
                    case 0: this.acc ^= this.acc <<  13; break;
                    case 1: this.acc ^= this.acc >>>  6; break;
                    case 2: this.acc ^= this.acc <<   2; break;
                    case 3: this.acc ^= this.acc >>> 16; break;
                }
                this.acc             = this.add(this.m[(i +  128) & 0xff], this.acc); x = this.m[i];
                this.m[i] =   y      = this.add(this.m[(x >>>  2) & 0xff], this.add(this.acc, this.brs));
                this.r[i] = this.brs = this.add(this.m[(y >>> 10) & 0xff], x);
            }
        }
    }

    public rand(): number {
        if(!this.gnt--) {
            this.prng(); this.gnt = 255;
        }
        return this.r[this.gnt];
    }

    public internals(): { a: number, b: number, c: number, m: number[], r: number[] } {
        return { a: this.acc, b: this.brs, c: this.cnt, m: this.m, r: this.r };
    }
}
