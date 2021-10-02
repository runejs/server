import { Player } from '@engine/world/actor';
import { PacketData } from '@engine/net';

const chatPacket = (player: Player, packet: PacketData) => {
    const { buffer } = packet;
    buffer.get('byte');
    const color = buffer.get('byte');
    const effects = buffer.get('byte');
    const data = Buffer.from(buffer.getSlice(buffer.readerIndex, buffer.length - buffer.readerIndex));
    player.updateFlags.addChatMessage({ color, effects, data });
};

export default {
    opcode: 75,
    size: -3,
    handler: chatPacket
};
