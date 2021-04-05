import { Player } from '../world/actor/player/player';
import { ByteBuffer, logger } from '@runejs/core';
import { getFiles } from '../util/files';
import { gameEngineDist } from '@engine/util/directories';

interface InboundPacket {
    opcode: number;
    size: number;
    handler: (player: Player, packet: PacketData) => void;
}

export interface PacketData {
    packetId: number;
    packetSize: number;
    buffer: ByteBuffer;
}

export const incomingPackets = new Map<number, InboundPacket>();

export const PACKET_DIRECTORY = `${gameEngineDist}/net/inbound-packets`;

export async function loadPackets(): Promise<Map<number, InboundPacket>> {
    incomingPackets.clear();

    for await(const path of getFiles(PACKET_DIRECTORY, ['.js'], true)) {
        const location = './inbound-packets' + path.substring(PACKET_DIRECTORY.length).replace('.js', '');
        const packet = require(location).default;
        if (Array.isArray(packet)) {
            packet.forEach(p => incomingPackets.set(p.opcode, p));
        } else {
            incomingPackets.set(packet.opcode, packet);
        }
    }

    return incomingPackets;
}

export function handlePacket(player: Player, packetId: number, packetSize: number, buffer: ByteBuffer): void {
    const incomingPacket = incomingPackets.get(packetId);

    if (!incomingPacket) {
        logger.info(`Unknown packet ${packetId} with size ${packetSize} received.`);
        return;
    }

    new Promise(resolve => {
        incomingPacket.handler(player, { packetId, packetSize, buffer });
        resolve();
    }).catch(error => logger.error(`Error handling inbound packet ${packetId} with size ${packetSize}: ${error}`));
}
