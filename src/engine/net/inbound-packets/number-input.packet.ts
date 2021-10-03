import { Player } from '@engine/world/actor';
import { PacketData } from '@engine/net';

export default {
    opcode: 238,
    size: 4,
    handler: (player: Player, packet: PacketData) =>
        player.numericInputEvent.next(packet.buffer.get('int', 'u'))
};
