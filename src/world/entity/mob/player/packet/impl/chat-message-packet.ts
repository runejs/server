import {incomingPacket} from "../incoming-packet";
import {Player} from "../../player";
import {RsBuffer} from "../../../../../../net/rs-buffer";
import {logger} from "@runejs/logger/dist/logger";

export const chatMessagePacket: incomingPacket = (player: Player, packetId: number, packetSize: number, packet: RsBuffer): void => {
    // const input = packet.readString();
    //
    // if(!input || input.trim().length === 0) {
    //     return;
    // }

    const colour: number = packet.readUnsignedByte();
    const effects: number = packet.readUnsignedByte();

    const length: number = packetSize - 2;


    logger.info(`${colour}`);
    let textdec = new TextDecoder();
    decompressString(packet.readBytesToByteArray(length), length)


};

export const FREQUENCY_ORDERED_CHARS = [ ' ', 'e', 't', 'a', 'o', 'i', 'h', 'n', 's', 'r', 'd', 'l',
    'u', 'm', 'w', 'c', 'y', 'f', 'g', 'p', 'b', 'v', 'k', 'x', 'j', 'q', 'z', '0', '1', '2', '3', '4', '5',
    '6', '7', '8', '9', ' ', '!', '?', '.', ',', ':', ';', '(', ')', '-', '&', '*', '\\', '\'', '@', '#', '+',
    '=', '£', '$', '%', '"', '[', ']' ];

function decompressString(inArr: number[], length: number) {
    const outArr:string[] = new Array(4096);
    let outPos = 0;
    let carry = -1;

    for (let i = 0; i < length * 2; i++) {
        let tblPos = inArr[i/2] >>  4 - 4 * (i % 2) & 0xF;
        if(carry == -1) {
            if (tblPos < 13) {
                outArr[outPos++] = FREQUENCY_ORDERED_CHARS[tblPos];
            } else {
                carry = tblPos;
            }
        } else {
            outArr[outPos++] = FREQUENCY_ORDERED_CHARS[(carry << 4) + tblPos - 195];
            carry = -1;
        }
    }
    logger.info(outArr[1]);


}
