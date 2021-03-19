import { longToString } from '../../util/strings';

export default {
    opcode: 251,
    size: 8,
    handler: (player, packet) => player.addIgnoredPlayer(longToString(packet.buffer.get('LONG')))
};
