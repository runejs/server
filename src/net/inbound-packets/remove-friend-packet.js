import { longToString } from '../../util/strings';
import { PrivateMessaging } from '../../world/actor/player/private-messaging';

export default {
    opcode: 255,
    size: 8,
    handler: (player, packet) => {
        const friendName = longToString(packet.buffer.get('LONG'));
        if(!friendName) {
            return;
        }

        player.removeFriend(friendName);
        PrivateMessaging.friendRemoved(player, friendName);
    }
};
