import { widgets } from '../../world/config/widget';
import { logger } from '@runejs/core';
import { Position } from '../../world/position';
import { cache, world } from '../../game-server';
import { actionHandler } from '../../world/action';

const itemOnObjectPacket = (player, packet) => {
    const { buffer } = packet;
    const objectY = buffer.get('SHORT', 'UNSIGNED', 'LITTLE_ENDIAN');
    const itemId = buffer.get('SHORT', 'UNSIGNED');
    const objectId = buffer.get('SHORT', 'UNSIGNED', 'LITTLE_ENDIAN');
    const itemSlot = buffer.get('SHORT', 'UNSIGNED', 'LITTLE_ENDIAN');
    const itemWidgetId = buffer.get('SHORT', 'SIGNED', 'LITTLE_ENDIAN');
    const itemContainerId = buffer.get('SHORT', 'SIGNED', 'LITTLE_ENDIAN');
    const objectX = buffer.get('SHORT', 'UNSIGNED', 'LITTLE_ENDIAN');

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
    const objectChunk = world.chunkManager.getChunkForWorldPosition(objectPosition);
    let cacheOriginal = true;

    const chunkModifications = player.instance
        .getInstancedChunk(objectChunk.position.x, objectChunk.position.y, objectChunk.position.level);
    const personalChunkModifications = player.personalInstance?.getInstancedChunk(objectChunk.position.x,
        objectChunk.position.y, objectChunk.position.level) || null;

    const tileModifications = chunkModifications?.mods?.get(objectPosition.key) || {};
    const personalTileModifications = personalChunkModifications?.mods?.get(objectPosition.key) || {};

    if(!tileModifications.spawnedObjects) {
        tileModifications.spawnedObjects = [];
    }
    if(!personalTileModifications.spawnedObjects) {
        personalTileModifications.spawnedObjects = [];
    }
    if(!tileModifications.hiddenObjects) {
        tileModifications.hiddenObjects = [];
    }
    if(!personalTileModifications.hiddenObjects) {
        personalTileModifications.hiddenObjects = [];
    }

    let locationObject = objectChunk.getCacheObject(objectId, objectPosition);
    if (!locationObject) {
        const tileObjects = [ ...tileModifications.spawnedObjects,
            ...personalTileModifications.spawnedObjects ];

        locationObject = tileObjects.find(spawnedObject =>
            spawnedObject.objectId === objectId && spawnedObject.x === x && spawnedObject.y === y) || null;

        cacheOriginal = false;

        if(!locationObject) {
            return;
        }
    }

    const hiddenTileObjects = [ ...tileModifications.hiddenObjects,
        ...personalTileModifications.hiddenObjects ];

    if(hiddenTileObjects.findIndex(spawnedObject =>
        spawnedObject.objectId === objectId && spawnedObject.x === x && spawnedObject.y === y) !== -1) {
        return;
    }

    const locationObjectDefinition = cache.locationObjectDefinitions.get(objectId);

    actionHandler.call('item_on_object', player, locationObject, locationObjectDefinition, objectPosition, usedItem, itemWidgetId, itemContainerId, cacheOriginal);
};

export default {
    opcode: 24,
    size: 14,
    handler: itemOnObjectPacket
};
