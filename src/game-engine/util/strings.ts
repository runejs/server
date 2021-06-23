import { hexToHexString } from '@engine/util/colors';
import { filestore } from '@engine/game-server';
import { Font, FontName } from '@runejs/filestore';

export const startsWithVowel = (str: string): boolean => {
    str = str.trim().toLowerCase();

    const firstChar = str.charAt(0);

    return (firstChar === 'a' || firstChar === 'e' || firstChar === 'i' || firstChar === 'o' || firstChar === 'u');
};

export enum TextDecoration {
    Color,
    Decoration
}

function getStylingType(tag: string) {
    let _tag = tag;
    if (_tag.charAt(0) === '/') {
        _tag = _tag.substring(1);
    }

    if (_tag.startsWith('col')) {
        return TextDecoration.Color;
    } else {
        return TextDecoration.Decoration;
    }
}

// TODO refactor a bit
export function wrapText(text: string, maxWidth: number, font?: number | string): string[] {
    const lines = [];
    const selectedFont = getFont(font);
    const colorQueue: string[] = [];
    const decorationQueue: string[] = [];
    const remainingText = text.split('').reverse();
    let currentLine = '';
    let currentWidth = 0;
    let currentTagIndex = -1;

    while (remainingText.length > 0) {
        const char = remainingText.pop();

        let hidden = false;
        let rendered = true;

        switch (char) {
            case '<':
                hidden = true;
                currentTagIndex = currentLine.length + 1;
                break;
            case '>':
                hidden = true;
                // eslint-disable-next-line no-case-declarations
                const currentTag = currentLine.substring(currentTagIndex, currentLine.length);
                currentTagIndex = -1;
                // eslint-disable-next-line no-case-declarations
                const isClosing = currentTag.charAt(0) === '/';
                // eslint-disable-next-line no-case-declarations
                const type = getStylingType(currentTag);
                if (type === TextDecoration.Decoration) {
                    if (!isClosing) {
                        decorationQueue.push(currentTag);
                    } else {
                        decorationQueue.pop();
                    }
                } else {
                    if (!isClosing) {
                        colorQueue.push(currentTag);
                    } else {
                        colorQueue.pop();
                    }
                }
                break;
            case '@':
                break;
            case '\n':
                hidden = true;
                currentWidth = maxWidth;
                rendered = false;
                break;
            case ' ':
                if (currentLine[currentLine.length-1] === ' ' || currentWidth === 0){
                    hidden = true;
                    rendered = false;
                }
                break;
            default:
                break;
        }

        if (rendered) {
            currentLine += char;
        }

        if (!hidden && currentTagIndex == -1) {
            const charWidth = selectedFont.getCharWidth(char);
            currentWidth += charWidth;
        }

        if (currentWidth >= maxWidth) {
            let lastSpace = currentLine.lastIndexOf(' ');
            const lastTag = currentLine.lastIndexOf('<');
            if (lastTag > lastSpace && char !== '\n') {
                lastSpace = lastTag;
                const type = getStylingType(currentLine.substring(lastTag+1));
                if (type === TextDecoration.Decoration) {
                    decorationQueue.pop();
                } else {
                    colorQueue.pop();
                }
            }
            let lineToPush = currentLine;
            let remainder = '';
            if (lastSpace != -1 && char != '\n') {
                lineToPush = lineToPush.substring(0, lastSpace);
                remainder = currentLine.substring(lastSpace);

            }

            decorationQueue.slice(0).reverse().map(tag => lineToPush += `</${tag}>`);
            colorQueue.slice(0).reverse().map(tag => lineToPush += `</${tag}>`);
            lines.push(lineToPush.trim());
            currentLine = '';
            decorationQueue.slice(0).map(tag => currentLine += `<${tag}>`);
            colorQueue.slice(0).map(tag => currentLine += `<${tag}>`);
            remainingText.push(...remainder.split('').reverse())
            currentWidth = 0;
        }

    }

    if (currentLine !== '') {
        lines.push(currentLine);
    }

    return lines;
}

function getFont(font: number | string) {
    if (font && typeof font === 'number') {
        return filestore.fontStore.getFontById(font);
    } else if (font && typeof font === 'string') {
        return filestore.fontStore.getFontByName(FontName[font]);
    } else {
        // Default font, subject to change
        return filestore.fontStore.getFontByName(FontName.p12_full);
    }
}

const VALID_CHARS = ['_', 'a', 'b', 'c', 'd',
    'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q',
    'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '0', '1', '2', '3',
    '4', '5', '6', '7', '8', '9', '!', '@', '#', '$', '%', '^', '&',
    '*', '(', ')', '-', '+', '=', ':', ';', '.', '>', '<', ',', '"',
    '[', ']', '|', '?', '/', '`'];

export function longToString(nameLong: BigInt): string {
    let ac: string = '';
    while(nameLong !== BigInt(0)) {
        const l1 = nameLong;
        nameLong = BigInt(nameLong) / BigInt(37);
        ac += VALID_CHARS[parseInt(l1.toString()) - parseInt(nameLong.toString()) * 37];
    }

    return ac.split('').reverse().join('');
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

export const colorText = (s: string, hexColor: number): string => `<col=${hexToHexString(hexColor)}>${s}</col>`;
