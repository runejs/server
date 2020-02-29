import { Player } from '../world/actor/player/player';
import { RsBuffer } from '@server/net/rs-buffer';
import { logger } from '@runejs/logger';

import { incomingPacket } from './incoming-packet';
import { characterDesignPacket } from './incoming-packets/character-design-packet';
import { itemEquipPacket } from './incoming-packets/item-equip-packet';
import { buttonClickPacket } from './incoming-packets/button-click-packet';
import { walkPacket } from './incoming-packets/walk-packet';
import { commandPacket } from './incoming-packets/command-packet';
import { itemSwapPacket } from './incoming-packets/item-swap-packet';
import { widgetInteractionPacket } from '@server/net/incoming-packets/widget-interaction-packet';
import { npcInteractionPacket } from '@server/net/incoming-packets/npc-interaction-packet';
import { objectInteractionPacket } from '@server/net/incoming-packets/object-interaction-packet';
import { chatPacket } from '@server/net/incoming-packets/chat-packet';
import { dropItemPacket } from '@server/net/incoming-packets/drop-item-packet';
import { itemOnItemPacket } from '@server/net/incoming-packets/item-on-item-packet';
import { widgetsClosedPacket } from '@server/net/incoming-packets/widgets-closed-packet';
import { pickupItemPacket } from '@server/net/incoming-packets/pickup-item-packet';
import { itemInteractionPacket } from '@server/net/incoming-packets/item-interaction-packet';

const ignore = [ 234, 160, 58 /* camera move */ ];

const packets: { [key: number]: incomingPacket } = {
    75:  chatPacket,
    248: commandPacket,

    73:  walkPacket,
    236: walkPacket,
    89:  walkPacket,

    64:  buttonClickPacket,
    132: widgetInteractionPacket,
    176: widgetsClosedPacket,
    231: characterDesignPacket,

    83:  itemSwapPacket,
    40:  itemOnItemPacket,
    102: itemEquipPacket,
    38:  itemInteractionPacket,
    98:  itemInteractionPacket,
    228: itemInteractionPacket,
    26:  itemInteractionPacket,
    147: itemInteractionPacket,
    29:  dropItemPacket,
    85:  pickupItemPacket,

    63:  npcInteractionPacket,
    116: npcInteractionPacket,

    30:  objectInteractionPacket,
    164: objectInteractionPacket,
    183: objectInteractionPacket,

    /*19:  interfaceClickPacket,
    140: cameraTurnPacket,

    79:  buttonClickPacket,
    226: dialogueInteractionPacket,

    112: npcInteractionPacket,
    13:  npcInteractionPacket,
    42:  npcInteractionPacket,
    8:   npcInteractionPacket,
    67:  npcInteractionPacket,

    181: objectInteractionPacket,
    241: objectInteractionPacket,
    50:  objectInteractionPacket,
    136: objectInteractionPacket,
    55:  objectInteractionPacket,

    28:  walkPacket,
    213: walkPacket,
    247: walkPacket,

    163: characterDesignPacket,

    24:  itemEquipPacket,
    3:   itemOption1Packet,
    123: itemSwapPacket,
    4:   dropItemPacket,
    1:   itemOnItemPacket,

    49:  chatPacket,
    56:  commandPacket,

    177: buyItemPacket,
    91:  buyItemPacket,
    231: buyItemPacket*/
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
        packetFunction(player, packetId, packetSize, new RsBuffer(buffer));
        resolve();
    });
}
