import { Player } from '../player';
import { RsBuffer } from '../../../../../net/rs-buffer';
import { logger } from '@runejs/logger';

import { incomingPacket } from './incoming-packet';
import { characterDesignPacket } from './impl/character-design-packet';
import { itemEquipPacket } from './impl/item-equip-packet';
import { interfaceClickPacket } from './impl/interface-click-packet';
import { cameraTurnPacket } from './impl/camera-turn-packet';
import { buttonClickPacket } from './impl/button-click-packet';
import { walkPacket } from './impl/walk-packet';

const packets: { [key: number]: incomingPacket } = {
    19:  interfaceClickPacket,
    140: cameraTurnPacket,

    79:  buttonClickPacket,

    28:  walkPacket,
    213: walkPacket,
    247: walkPacket,

    163: characterDesignPacket,

    24: itemEquipPacket
};

export function handlePacket(player: Player, packetId: number, packetSize: number, buffer: Buffer): void {
    const packetFunction = packets[packetId];

    if(!packetFunction) {
        logger.info(`Unknown packet ${packetId} with size ${packetSize} received.`);
        return;
    }

    packetFunction(player, packetId, packetSize, new RsBuffer(buffer));
}
