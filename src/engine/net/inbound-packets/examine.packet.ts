import { Player } from '@engine/world/actor';
import { PacketData } from '@engine/net';
import { world } from '@engine/world';

const examinePacket = (player: Player, packet: PacketData) => {
    const { packetId, buffer } = packet;
    const id = buffer.get('short', 's', 'le');

    let message;

    if(packetId === 151) {
        message = world.examine.getItem(id);
    } else if(packetId === 148) {
        message = world.examine.getObject(id);
    } else if(packetId === 247) {
        message = world.examine.getNpc(id);
    }

    if(message) {
        player.sendMessage(message);
    }
};

export default [ {
    opcode: 148,
    size: 2,
    handler: examinePacket
}, {
    opcode: 151,
    size: 2,
    handler: examinePacket
}, {
    opcode: 247,
    size: 2,
    handler: examinePacket
} ];

