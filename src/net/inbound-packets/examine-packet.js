import { world } from '../../game-server';

const examinePacket = (player, packet) => {
    const { packetId, buffer } = packet;
    const id = buffer.get('SHORT', 'SIGNED', 'LITTLE_ENDIAN');

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

