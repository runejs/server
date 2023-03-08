import { PacketData } from '@engine/net';
import { longToString } from '@engine/util';
import { Player } from '@engine/world/actor';


export default {
    opcode: 114,
    size: 8,
    handler: (player: Player, packet: PacketData) =>
        player.addFriend(longToString(BigInt(packet.buffer.get('LONG'))))
};
