// @ts-ignore -- kdbxweb has no type declarations
import * as kdbxweb from 'kdbxweb';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const PV: any = kdbxweb.ProtectedValue;

const ExpectedFieldRefChars: string[] = '{REF:0@I:00000000000000000000000000000000}'.split('');
const ExpectedFieldRefByteLength: number = ExpectedFieldRefChars.length;

PV.prototype.isProtected = true;

PV.prototype.forEachChar = function (fn: (charCode: number) => void | false): void {
    const value: Uint8Array = this.value;
    const salt: Uint8Array = this.salt;
    let b: number, b1: number, b2: number, b3: number;
    for (let i = 0, len = value.length; i < len; i++) {
        b = value[i] ^ salt[i];
        if (b < 128) {
            if (fn(b) === false) {
                return;
            }
            continue;
        }
        i++;
        b1 = value[i] ^ salt[i];
        if (i === len) {
            break;
        }
        if (b >= 192 && b < 224) {
            if (fn(((b & 0x1f) << 6) | (b1 & 0x3f)) === false) {
                return;
            }
            continue;
        }
        i++;
        b2 = value[i] ^ salt[i];
        if (i === len) {
            break;
        }
        if (b >= 224 && b < 240) {
            if (fn(((b & 0xf) << 12) | ((b1 & 0x3f) << 6) | (b2 & 0x3f)) === false) {
                return;
            }
            // The for-loop header will i++ again to advance past b2 to
            // the next codepoint's leading byte. Without this continue,
            // execution falls through into the 4-byte branch's pre-read
            // (i++; b3 = ...), which silently consumes a byte that
            // belongs to the NEXT codepoint — corrupting every character
            // that follows a 3-byte UTF-8 char. Inherited upstream bug
            // from keeweb; fixed here alongside multi-byte test coverage.
            continue;
        }
        i++;
        b3 = value[i] ^ salt[i];
        if (i === len) {
            break;
        }
        if (b >= 240 && b < 248) {
            let c = ((b & 7) << 18) | ((b1 & 0x3f) << 12) | ((b2 & 0x3f) << 6) | (b3 & 0x3f);
            if (c <= 0xffff) {
                if (fn(c) === false) {
                    return;
                }
            } else {
                c ^= 0x10000;
                if (fn(0xd800 | (c >> 10)) === false) {
                    return;
                }
                if (fn(0xdc00 | (c & 0x3ff)) === false) {
                    return;
                }
            }
        }
        // skip error
    }
};

Object.defineProperty(PV.prototype, 'length', {
    get(): number {
        return this.textLength;
    }
});

Object.defineProperty(PV.prototype, 'textLength', {
    get(): number {
        let textLength = 0;
        this.forEachChar(() => {
            textLength++;
        });
        return textLength;
    }
});

PV.prototype.includesLower = function (findLower: string): boolean {
    return this.indexOfLower(findLower) !== -1;
};

PV.prototype.indexOfLower = function (findLower: string): number {
    let index = -1;
    const foundSeqs: number[] = [];
    const len = findLower.length;
    let chIndex = -1;
    this.forEachChar((ch: number) => {
        chIndex++;
        const chLower = String.fromCharCode(ch).toLowerCase();
        if (index !== -1) {
            return;
        }
        for (let i = 0; i < foundSeqs.length; i++) {
            const seqIx = ++foundSeqs[i];
            if (findLower[seqIx] !== chLower) {
                foundSeqs.splice(i, 1);
                i--;
                continue;
            }
            if (seqIx === len - 1) {
                index = chIndex - len + 1;
                return;
            }
        }
        if (findLower[0] === chLower) {
            if (len === 1) {
                index = chIndex - len + 1;
            } else {
                foundSeqs.push(0);
            }
        }
    });
    return index;
};

PV.prototype.indexOfSelfInLower = function (targetLower: string): number {
    let firstCharIndex = -1;
    let found = false;
    do {
        let chIndex = -1;
        this.forEachChar((ch: number) => {
            chIndex++;
            const chLower = String.fromCharCode(ch).toLowerCase();
            if (chIndex === 0) {
                firstCharIndex = targetLower.indexOf(chLower, firstCharIndex + 1);
                found = firstCharIndex !== -1;
                return;
            }
            if (!found) {
                return;
            }
            found = targetLower[firstCharIndex + chIndex] === chLower;
        });
    } while (!found && firstCharIndex >= 0);
    return firstCharIndex;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
PV.prototype.equals = function (other: any): boolean {
    if (!other) {
        return false;
    }
    if (!other.isProtected) {
        return this.textLength === other.length && this.includes(other);
    }
    if (other === this) {
        return true;
    }
    const len: number = this.byteLength;
    if (len !== other.byteLength) {
        return false;
    }
    for (let i = 0; i < len; i++) {
        if ((this.value[i] ^ this.salt[i]) !== (other.value[i] ^ other.salt[i])) {
            return false;
        }
    }
    return true;
};

PV.prototype.isFieldReference = function (): boolean {
    if (this.byteLength !== ExpectedFieldRefByteLength) {
        return false;
    }
    let ix = 0;
    let matches = true;
    this.forEachChar((ch: number) => {
        const expected = ExpectedFieldRefChars[ix++];
        // '0' is the placeholder that stands for the UUID hex digits
        // and the REF type char; every other position must match the
        // fixed prefix/suffix literal character code.
        if (expected !== '0' && ch !== expected.charCodeAt(0)) {
            matches = false;
            return false;
        }
    });
    return matches;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const RandomSalt: any = (kdbxweb as any).CryptoEngine.random(128);

PV.prototype.saltedValue = function (): string | number {
    if (!this.byteLength) {
        return 0;
    }
    const value: Uint8Array = this.value;
    const salt: Uint8Array = this.salt;
    let salted = '';
    for (let i = 0, len = value.length; i < len; i++) {
        const byte = value[i] ^ salt[i];
        salted += String.fromCharCode(byte ^ RandomSalt[i % RandomSalt.length]);
    }
    return salted;
};

PV.prototype.dataAndSalt = function (): { data: number[]; salt: number[] } {
    return {
        data: [...this.value],
        salt: [...this.salt]
    };
};

PV.prototype.toBase64 = function (): string {
    const binary = this.getBinary();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const base64: string = (kdbxweb as any).ByteUtils.bytesToBase64(binary);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (kdbxweb as any).ByteUtils.zeroBuffer(binary);
    return base64;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
PV.fromBase64 = function (base64: string): any {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bytes = (kdbxweb as any).ByteUtils.base64ToBytes(base64);
    return PV.fromBinary(bytes);
};
