import { longToString } from '../../util/strings';

export default {
    opcode: 114,
    size: 8,
    handler: (player, packet) => player.addFriend(longToString(packet.buffer.get('LONG')))
};
