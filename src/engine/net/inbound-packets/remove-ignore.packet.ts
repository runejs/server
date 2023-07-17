import { longToString } from '@engine/util';
import { Player } from '@engine/world/actor';
import { PacketData } from '@engine/net';

export default {
    opcode: 28,
    size: 8,
    handler: (player: Player, packet: PacketData) =>
        player.removeIgnoredPlayer(longToString(BigInt(packet.buffer.get('long'))))
};
