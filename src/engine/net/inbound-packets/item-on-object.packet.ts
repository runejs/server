import { logger } from '@runejs/common';
import { filestore } from '@server/game/game-server';
import { Position, activeWorld } from '@engine/world';
import { widgets } from '@engine/config';
import { getVarbitMorphIndex } from '@engine/util';
import { Player } from '@engine/world/actor';
import { PacketData } from '@engine/net';

const itemOnObjectPacket = (player: Player, packet: PacketData) => {
    const { buffer } = packet;
    const objectY = buffer.get('short', 'u', 'le');
    const itemId = buffer.get('short', 'u');
    const objectId = buffer.get('short', 'u', 'le');
    const itemSlot = buffer.get('short', 'u', 'le');
    const itemWidgetId = buffer.get('short', 's', 'le');
    const itemContainerId = buffer.get('short', 's', 'le');
    const objectX = buffer.get('short', 'u', 'le');

    let usedItem;
    if (itemWidgetId === widgets.inventory.widgetId && itemContainerId === widgets.inventory.containerId) {
        if (itemSlot < 0 || itemSlot > 27) {
            return;
        }

        usedItem = player.inventory.items[itemSlot];
        if (!usedItem) {
            return;
        }

        if (usedItem.itemId !== itemId) {
            return;
        }
    } else {
        logger.warn(`Unhandled item on object case using widget ${itemWidgetId}:${itemContainerId}`);
    }

    const level = player.position.level;
    const objectPosition = new Position(objectX, objectY, level);

    const { object: locationObject, cacheOriginal } = activeWorld.findObjectAtLocation(player, objectId, objectPosition);
    if(!locationObject) {
        return;
    }

    let objectConfig = filestore.configStore.objectStore.getObject(objectId);

    if (!objectConfig) {
        logger.error(`Could not find object config for object id ${objectId}!`);
    } else if (objectConfig.configChangeDest) {
        let morphIndex = -1;
        if(objectConfig.varbitId === -1) {
            if(objectConfig.configId !== -1) {
                const configValue = player.metadata.configs && player.metadata.configs[objectConfig.configId] ? player.metadata.configs[objectConfig.configId] : 0;
                morphIndex = configValue;

            }
        } else {
            morphIndex = getVarbitMorphIndex(objectConfig.varbitId, player.metadata.configs);
        }
        if(morphIndex !== -1) {
            objectConfig = filestore.configStore.objectStore.getObject(objectConfig.configChangeDest[morphIndex]);
        }
    }

    player.actionPipeline.call('item_on_object', player, locationObject, objectConfig, objectPosition, usedItem, itemWidgetId, itemContainerId, cacheOriginal);
};

export default {
    opcode: 24,
    size: 14,
    handler: itemOnObjectPacket
};
