import { longToString } from '../../util/strings';
import { world } from '../../game-server';

export default {
    opcode: 207,
    size: -3,
    handler: (player, packet) => {
        const { buffer } = packet;

        buffer.get('BYTE'); // junk
        const nameLong = buffer.get('LONG');
        const username = longToString(nameLong).toLowerCase();
        const messageLength = buffer.length - 9;
        const messageBytes = new Array(messageLength);
        for(let i = 0; i < messageLength; i++) {
            messageBytes[i] = buffer[buffer.readerIndex + i];
        }

        const otherPlayer = world.findActivePlayerByUsername(username);
        if(otherPlayer) {
            otherPlayer.privateMessageReceived(player, messageBytes);
        }
    }
};
