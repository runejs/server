import { longToString } from '@engine/util';
import { Player, PrivateMessaging } from '@engine/world/actor';
import { PacketData } from '@engine/net';

export default {
    opcode: 255,
    size: 8,
    handler: (player: Player, packet: PacketData) => {
        const friendName = longToString(BigInt(packet.buffer.get('long')));
        if(!friendName) {
            return;
        }

        player.removeFriend(friendName);
        PrivateMessaging.friendRemoved(player, friendName);
    }
};
