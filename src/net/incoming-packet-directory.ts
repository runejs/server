import { Player } from '../world/actor/player/player';
import { logger } from '@runejs/logger';
import { ByteBuffer } from '@runejs/byte-buffer';

import { incomingPacket } from './incoming-packet';
import { walkPacket } from './incoming-packets/walk-packet';
import { widgetInteractionPacket } from '@server/net/incoming-packets/widget-interaction-packet';
import { widgetsClosedPacket } from '@server/net/incoming-packets/widgets-closed-packet';
import { playerInteractionPacket } from '@server/net/incoming-packets/player-interaction-packet';

const ignore = [ 234, 160, 216, 13, 58 /* camera move */ ];

const packets: { [key: number]: incomingPacket } = {
    73:  walkPacket,
    236: walkPacket,
    89:  walkPacket,

    132: widgetInteractionPacket,
    176: widgetsClosedPacket,
    //86:  stringInputPacket, @TODO

    68:  playerInteractionPacket,
    211: playerInteractionPacket,

};

export function handlePacket(player: Player, packetId: number, packetSize: number, buffer: Buffer): void {
    if(ignore.indexOf(packetId) !== -1) {
        return;
    }

    const packetFunction = packets[packetId];

    if(!packetFunction) {
        logger.info(`Unknown packet ${packetId} with size ${packetSize} received.`);
        return;
    }

    new Promise(resolve => {
        packetFunction(player, packetId, packetSize, new ByteBuffer(buffer));
        resolve();
    }).catch(error => logger.error(`Error handling inbound packet: ${error}`));
}
