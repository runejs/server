import {RsBuffer} from "@server/net/rs-buffer";

export class ChatEncoder {
    public static message: string[] = Array(100).fill(null);
    public static messageBuffer: Buffer = new Buffer(Array(100).fill(0));
    public static VALID_CHARACTERS: string[] = [
        " ",
        "e",
        "t",
        "a",
        "o",
        "i",
        "h",
        "n",
        "s",
        "r",
        "d",
        "l",
        "u",
        "m",
        "w",
        "c",
        "y",
        "f",
        "g",
        "p",
        "b",
        "v",
        "k",
        "x",
        "j",
        "q",
        "z",
        "0",
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        " ",
        "!",
        "?",
        ".",
        ",",
        ":",
        ";",
        "(",
        ")",
        "-",
        "&",
        "*",
        "\\",
        "'",
        "@",
        "#",
        "+",
        "=",
        "\u00a3",
        "$",
        "%",
        '"',
        "[",
        "]"
    ];

    public static decompress(length: number, buffer: RsBuffer): string {
        let count: number = 0;
        let validCharacterIndex: number = -1;
        for (let lengthCounter: number = 0; lengthCounter < length; lengthCounter++) {
            {
                const character: number = buffer.readUnsignedByte();
                let characterBit: number = (character >> 4) & 15;
                if (validCharacterIndex === -1) {
                    if (characterBit < 13) {
                        ChatEncoder.message[count++] = ChatEncoder.VALID_CHARACTERS[characterBit];
                    } else {
                        validCharacterIndex = characterBit;
                    }
                } else {
                    ChatEncoder.message[count++] = ChatEncoder.VALID_CHARACTERS[(validCharacterIndex << 4) + characterBit - 195];
                    validCharacterIndex = -1;
                }
                characterBit = character & 15;
                if (validCharacterIndex === -1) {
                    if (characterBit < 13) {
                        ChatEncoder.message[count++] = ChatEncoder.VALID_CHARACTERS[characterBit];
                    } else {
                        validCharacterIndex = characterBit;
                    }
                } else {
                    ChatEncoder.message[count++] = ChatEncoder.VALID_CHARACTERS[(validCharacterIndex << 4) + characterBit - 195];
                    validCharacterIndex = -1;
                }
            }
        }
        let isSymbol: boolean = true;
        for (let messageIndex: number = 0; messageIndex < count; messageIndex++) {
            {
                const c: string = ChatEncoder.message[messageIndex];
                if (
                    isSymbol &&
                    (c => (c.charCodeAt == null ? (c as any) : c.charCodeAt(0)))(c) >= "a".charCodeAt(0) &&
                    (c => (c.charCodeAt == null ? (c as any) : c.charCodeAt(0)))(c) <= "z".charCodeAt(0)
                ) {
                    ChatEncoder.message[messageIndex] = String.fromCharCode(
                        ChatEncoder.message[messageIndex].charCodeAt(0) + "\uffe0".charCodeAt(0)
                    );
                    isSymbol = false;
                }
                if (
                    (c => (c.charCodeAt == null ? (c as any) : c.charCodeAt(0)))(c) == ".".charCodeAt(0) ||
                    (c => (c.charCodeAt == null ? (c as any) : c.charCodeAt(0)))(c) == "!".charCodeAt(0) ||
                    (c => (c.charCodeAt == null ? (c as any) : c.charCodeAt(0)))(c) == "?".charCodeAt(0)
                ) {
                    isSymbol = true;
                }
            }
        }
        return ((str, index, len) => str.substring(index, index + len))(ChatEncoder.message.join(""), 0, count) as string;
    }

    public static compress(chatMessage: string, out: number[]) {
        if (chatMessage.length > 80) {
            chatMessage = chatMessage.substring(0, 80);
        }
        chatMessage = chatMessage.toLowerCase();

        let chatMessageCharacter: number = -1;
        let outPos = 0;
        for (let index: number = 0; index < chatMessage.length; index++) {
            {
                const character: string = chatMessage.charAt(index);
                let validCharacterIndex: number = 0;
                for (let validIndex: number = 0; validIndex < ChatEncoder.VALID_CHARACTERS.length; validIndex++) {
                    {
                        if (
                            (c => (c.charCodeAt == null ? (c as any) : c.charCodeAt(0)))(character) !=
                            (c => (c.charCodeAt == null ? (c as any) : c.charCodeAt(0)))(ChatEncoder.VALID_CHARACTERS[validIndex])
                        ) {
                            continue;
                        }
                        validCharacterIndex = validIndex;
                        break;
                    }
                }
                if (validCharacterIndex > 12) {
                    validCharacterIndex += 195;
                }
                if (chatMessageCharacter === -1) {
                    if (validCharacterIndex < 13) {
                        chatMessageCharacter = validCharacterIndex;
                    } else {
                        out[outPos++] = validCharacterIndex;
                    }
                } else if (validCharacterIndex < 13) {
                    out[outPos++] = (chatMessageCharacter << 4) + validCharacterIndex;
                    chatMessageCharacter = -1;
                } else {
                    out[outPos++] = (chatMessageCharacter << 4) + (validCharacterIndex >> 4);
                    chatMessageCharacter = validCharacterIndex & 15;
                }
            }
        }
        if (chatMessageCharacter !== -1) {
            out[outPos++] = chatMessageCharacter << 4;
        }
        return outPos;
    }

    /**
     * Filters invalid characters from the specified string.
     *
     * @param str The input string.
     * @return The filtered string.
     */
    public static filterInvalidCharacters(str: string): string {
        let outString = '';
        for (let char = 0; char < str.length; char++) {
            for (let validChar = 0; validChar < ChatEncoder.VALID_CHARACTERS.length; validChar++) {
                if (str.charAt(char) === ChatEncoder.VALID_CHARACTERS[validChar]) {
                    outString += str.charAt(char);
                }

            }
        }
        return outString;

    }

    /**
     * Capitalizes the string correctly.
     *
     * @param string The input string.
     * @return The string with correct capitalization.
     */
    public static capitalize(str: string): string {
        let capializa: boolean = true;
        let outString = str;
        const length: number = str.length;

        for (let index = 0; index < length; index++) {
            let character = str.charAt(index);

            if (character === '.' || character === '!' || character === '?') {
                capializa = true;
            } else if (capializa && !(character.trim() === '')) {
                ChatEncoder.setCharAt(outString, index, outString.charAt(index).toUpperCase());
                capializa = false;
            } else {
                ChatEncoder.setCharAt(outString, index, outString.charAt(index).toLowerCase());

            }
        }

        return outString;

    }

    public static setCharAt(str, index, chr): string {
        if (index > str.length - 1) return str;
        return str.substr(0, index) + chr + str.substr(index + 1);
    }


}
