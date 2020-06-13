import { hexToHexString } from '@server/util/colors';

export const startsWithVowel = (str: string): boolean => {
    str = str.trim().toLowerCase();

    const firstChar = str.charAt(0);

    return (firstChar === 'a' || firstChar === 'e' || firstChar === 'i' || firstChar === 'o' || firstChar === 'u');
};

// Thank you to the Apollo team for these values. :)
const charWidths = [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3,
    3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 4, 4, 7, 14, 9, 12, 12, 4, 5,
    5, 10, 8, 4, 8, 4, 7, 9, 7, 9, 8, 8, 8, 9, 7, 9, 9, 4, 5, 7,
    9, 7, 9, 14, 9, 8, 8, 8, 7, 7, 9, 8, 6, 8, 8, 7, 10, 9, 9, 8,
    9, 8, 8, 6, 9, 8, 10, 8, 8, 8, 6, 7, 6, 9, 10, 5, 8, 8, 7, 8,
    8, 7, 8, 8, 4, 7, 7, 4, 10, 8, 8, 8, 8, 6, 8, 6, 8, 8, 9, 8,
    8, 8, 6, 4, 6, 12, 3, 10, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3,
    3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3,
    4, 8, 11, 8, 8, 4, 8, 7, 12, 6, 7, 9, 5, 12, 5, 6, 10, 6, 6, 6,
    8, 8, 4, 5, 5, 6, 7, 11, 11, 11, 9, 9, 9, 9, 9, 9, 9, 13, 8, 8,
    8, 8, 8, 4, 4, 5, 4, 8, 9, 9, 9, 9, 9, 9, 8, 10, 9, 9, 9, 9,
    8, 8, 8, 8, 8, 8, 8, 8, 8, 13, 6, 8, 8, 8, 8, 4, 4, 5, 4, 8,
    8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8];

export function wrapText(text: string, maxWidth: number): string[] {
    const lines = [];

    let lineStartIdx = 0;
    let width = 0;
    let lastSpace = 0;
    let widthAfterSpace = 0;
    let lastSpaceChar = '';

    for (let i = 0; i < text.length; i++) {
        const char = text.charAt(i);

        // Ignore <col=> and </col> strings...
        if (char === '<' && (text.charAt(i + 1) === '/' || text.charAt(i + 1) === 'c' && text.charAt(i + 2) === 'o' && text.charAt(i + 3) === 'l')) {
            const tagCloseIndex = text.indexOf('>', i);
            i = tagCloseIndex;
            continue;
        }

        const charWidth = charWidths[text.charCodeAt(i)];
        width += charWidth;
        widthAfterSpace += charWidth;

        if (char === ' ' || char === '\n' || char === '-') {
            lastSpaceChar = char;
            lastSpace = i;
            widthAfterSpace = 0;
        }

        if (width >= maxWidth || char === '\n') {
            lines.push(text.substring(lineStartIdx, lastSpaceChar === '-' ? lastSpace + 1 : lastSpace));
            lineStartIdx = lastSpace + 1;
            width = widthAfterSpace;
        }
    }

    if (lineStartIdx !== text.length - 1) {
        lines.push(text.substring(lineStartIdx, text.length));
    }

    return lines;
}

export function stringToLong(s: string): bigint {
    let l: bigint = BigInt(0);

    for (let i = 0; i < s.length && i < 12; i++) {
        const c = s.charAt(i);
        const cc = s.charCodeAt(i);
        l *= BigInt(37);
        if (c >= 'A' && c <= 'Z') l += BigInt((1 + cc) - 65);
        else if (c >= 'a' && c <= 'z') l += BigInt((1 + cc) - 97);
        else if (c >= '0' && c <= '9') l += BigInt((27 + cc) - 48);
    }
    while (l % BigInt(37) == BigInt(0) && l != BigInt(0)) l /= BigInt(37);
    return l;
}

export function colorText(s: string, hexColor: number): string {
    console.log(hexToHexString(hexColor));
    return `<col=${hexToHexString(hexColor)}>${s}</col>`;
}
