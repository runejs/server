import { Player } from '../world/actor/player/player';
import { logger } from '@runejs/logger';
import { ByteBuffer } from '@runejs/byte-buffer';

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
import { itemOnObjectPacket } from '@server/net/incoming-packets/item-on-object-packet';
import { numberInputPacket } from '@server/net/incoming-packets/number-input-packet';
import { itemOnNpcPacket } from '@server/net/incoming-packets/item-on-npc-packet';

const ignore = [ 234, 160, 216, 13, 58 /* camera move */ ];

const packets: { [key: number]: incomingPacket } = {
    75:  chatPacket,
    248: commandPacket,
    246: commandPacket,

    73:  walkPacket,
    236: walkPacket,
    89:  walkPacket,

    64:  buttonClickPacket,
    132: widgetInteractionPacket,
    176: widgetsClosedPacket,
    231: characterDesignPacket,
    238: numberInputPacket,
    //86:  stringInputPacket, @TODO

    83:  itemSwapPacket,
    40:  itemOnItemPacket,
    24:  itemOnObjectPacket,
    208: itemOnNpcPacket,
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
