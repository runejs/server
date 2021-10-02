import { longToString } from '@engine/util';
import { Player } from '@engine/world/actor';
import { PacketData } from '@engine/net';
import { world } from '@engine/world';

export default {
    opcode: 207,
    size: -3,
    handler: (player: Player, packet: PacketData) => {
        const { buffer } = packet;

        buffer.get('byte'); // junk
        const nameLong = BigInt(buffer.get('long'));
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
