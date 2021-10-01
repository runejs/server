import { longToString } from '@engine/util';
import { Player } from '@engine/world/actor';
import { PacketData } from '@engine/net';

export default {
    opcode: 251,
    size: 8,
    handler: (player: Player, packet: PacketData) =>
        player.addIgnoredPlayer(longToString(BigInt(packet.buffer.get('LONG'))))
};
