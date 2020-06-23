import { Player } from '../world/actor/player/player';
import { logger } from '@runejs/logger';
import { getFiles } from '../util/files';
import { ByteBuffer } from '@runejs/byte-buffer';

const ignore = [ 234, 160, 216, 13, 58 /* camera move */ ];

interface InboundPacket {
    opcode: number;
    size: number;
    handler: (player: Player, packet: { packetId: number, packetSize: number, buffer: ByteBuffer }) => void;
}

export const incomingPackets = new Map<number, InboundPacket>();

export const PACKET_DIRECTORY = './dist/net/inbound-packets';

export async function loadPackets(): Promise<Map<number, InboundPacket>> {
    incomingPackets.clear();

    for await(const path of getFiles(PACKET_DIRECTORY, [ '.' ])) {
        const location = './inbound-packets' + path.substring(PACKET_DIRECTORY.length).replace('.js', '');
        const packet = require(location).default;
        if(Array.isArray(packet)) {
            packet.forEach(p => incomingPackets.set(p.opcode, p));
        } else {
            incomingPackets.set(packet.opcode, packet);
        }
    }

    return incomingPackets;
}

export function handlePacket(player: Player, packetId: number, packetSize: number, buffer: ByteBuffer): void {
    if(ignore.indexOf(packetId) !== -1) {
        return;
    }

    // const packetFunction = packets[packetId];
    const incomingPacket = incomingPackets.get(packetId);

    if(!incomingPacket) {
        logger.info(`Unknown packet ${packetId} with size ${packetSize} received.`);
        return;
    }

    new Promise(resolve => {
        incomingPacket.handler(player, { packetId, packetSize, buffer });
        resolve();
    }).catch(error => logger.error(`Error handling inbound packet: ${error}`));
}
