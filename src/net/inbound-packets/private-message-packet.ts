import { longToString } from '../../util/strings';
import { world } from '@server/game-server';

export default {
    opcode: 207,
    size: -3,
    handler: (player, packet) => {
        const { buffer, packetSize } = packet;

        /*
        final long usernameLong = packet.readLong();
        final String username = StringUtil.longToUsername(usernameLong);
        final int messageLength = packet.getLength() - 8;
        final byte[] messageBytes = new byte[messageLength];
        packet.getPayload().readBytes(messageBytes, 0, messageLength);
         */

        buffer.get('BYTE');
        const nameLong = buffer.get('LONG');
        const username = longToString(nameLong).toLowerCase();
        const messageLength = packetSize - 8;
        const messageBytes = new Array(messageLength);
        messageBytes.forEach((item, index) => messageBytes[index] = buffer.get('BYTE'));

        const otherPlayer = world.playerList.find(p => p && p.username.toLowerCase() === username);
        if(otherPlayer) {
            otherPlayer.outgoingPackets.sendPrivateMessage(1, player.username, messageBytes);
        }
    }
};
