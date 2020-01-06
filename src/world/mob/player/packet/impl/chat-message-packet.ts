import {incomingPacket} from "../incoming-packet";
import {logger} from "@runejs/logger/dist/logger";
import {Player} from "@server/world/mob/player/player";
import {RsBuffer} from "@server/net/rs-buffer";
import {ChatEncoder} from "@server/net/data-parser/chat-encoder";
import {PublicChatMessage} from "@server/world/mob/player/message/impl/public-chat-message";

export const chatMessagePacket: incomingPacket = (player: Player, packetId: number, packetSize: number, packet: RsBuffer): void => {
    // const input = packet.readString();
    //
    // if(!input || input.trim().length === 0) {
    //     return;
    // }

    const colour: number = packet.readUnsignedByte();
    const effects: number = packet.readUnsignedByte();

    const length: number = packetSize - 2;

    let originalCompressed: RsBuffer = packet.getSlice(2, length);
    let uncompressed: string = ChatEncoder.decompress(length, originalCompressed);
    uncompressed = ChatEncoder.filterInvalidCharacters(uncompressed);
    uncompressed = ChatEncoder.capitalize(uncompressed);

    let recompressed: number[] = new Array(length);
    ChatEncoder.compress(uncompressed,recompressed);
    return new PublicChatMessage(uncompressed, recompressed, color, effects);

}
