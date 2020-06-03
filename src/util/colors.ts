export function hexToRgb(hex: number): { r: number, b: number, g: number } {
    return {
        r: (hex >> 16) & 0xff,
        g: (hex >> 8) & 0xff,
        b: hex & 0xff
    };
}

export function rgbTo16Bit(r: number, g: number, b: number): number {
    return ((r & 0x1f) << 11) | ((g & 0x3f) << 5) | (b & 0x1f) << 0;
}

export const colors = {
    green: 0x00ff00,
    yellow: 0xffff00,
    red: 0xff0000,
    black: 0x000000
};
