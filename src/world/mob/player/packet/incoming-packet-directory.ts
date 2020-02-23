import { Player } from '../player';
import { RsBuffer } from '@server/net/rs-buffer';
import { logger } from '@runejs/logger';

import { incomingPacket } from './incoming-packet';
import { characterDesignPacket } from './impl/character-design-packet';
import { itemEquipPacket } from './impl/item-equip-packet';
import { interfaceClickPacket } from './impl/interface-click-packet';
import { cameraTurnPacket } from './impl/camera-turn-packet';
import { buttonClickPacket } from './impl/button-click-packet';
import { walkPacket } from './impl/walk-packet';
import { itemOption1Packet } from './impl/item-option-1-packet';
import { commandPacket } from './impl/command-packet';
import { itemSwapPacket } from './impl/item-swap-packet';
import { dialogueInteractionPacket } from '@server/world/mob/player/packet/impl/dialogue-interaction-packet';
import { npcInteractionPacket } from '@server/world/mob/player/packet/impl/npc-interaction-packet';
import { objectInteractionPacket } from '@server/world/mob/player/packet/impl/object-interaction-packet';
import { chatPacket } from '@server/world/mob/player/packet/impl/chat-packet';
import { dropItemPacket } from '@server/world/mob/player/packet/impl/drop-item-packet';
import { itemOnItemPacket } from '@server/world/mob/player/packet/impl/item-on-item-packet';
import { buyItemPacket } from '@server/world/mob/player/packet/impl/buy-item-packet';

const ignore = [ 234, 160, 58 /* camera move */ ];

const packets: { [key: number]: incomingPacket } = {
    75:  chatPacket,
    248: commandPacket,

    73:  walkPacket,
    236: walkPacket,
    89:  walkPacket,
    64:  buttonClickPacket,


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
