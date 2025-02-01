import 'json5/lib/register';
import type { ItemPresetConfiguration } from '@engine/config/item-config';
import { ItemDetails, loadItemConfigurations } from '@engine/config/item-config';
import type { ItemSpawn } from '@engine/config/item-spawn-config';
import { loadItemSpawnConfigurations } from '@engine/config/item-spawn-config';
import type { MusicTrack } from '@engine/config/music-regions-config';
import { loadMusicRegionConfigurations } from '@engine/config/music-regions-config';
import type { NpcDetails, NpcPresetConfiguration } from '@engine/config/npc-config';
import { loadNpcConfigurations, translateNpcServerConfig } from '@engine/config/npc-config';
import type { NpcSpawn } from '@engine/config/npc-spawn-config';
import { loadNpcSpawnConfigurations } from '@engine/config/npc-spawn-config';
import type { Shop } from '@engine/config/shop-config';
import { loadShopConfigurations } from '@engine/config/shop-config';
import { questMap } from '@engine/plugins/loader';
import type { Quest } from '@engine/world/actor/player/quest';
import { logger } from '@runejs/common';
import type { ObjectConfig, XteaRegion } from '@runejs/filestore';
import { loadXteaRegionFiles } from '@runejs/filestore';
import { filestore } from '@server/game/game-server';
import _ from 'lodash';

export let itemMap: { [key: string]: ItemDetails };
export let itemGroupMap: Record<string, Record<string, boolean>>;
export let itemIdMap: { [key: number]: string };
export let objectMap: { [key: number]: ObjectConfig };
export let itemPresetMap: ItemPresetConfiguration;
export let npcMap: { [key: string]: NpcDetails };
export let npcIdMap: { [key: number]: string };
export let npcPresetMap: NpcPresetConfiguration;
export let npcSpawns: NpcSpawn[] = [];
export let musicRegions: MusicTrack[] = [];
export let itemSpawns: ItemSpawn[] = [];
export let shopMap: { [key: string]: Shop };
export let xteaRegions: { [key: number]: XteaRegion };

export const musicRegionMap = new Map<number, number>();
export const widgets: { [key: string]: any } = require('../../../data/config/widgets.json');

export async function loadCoreConfigurations(): Promise<void> {
    xteaRegions = await loadXteaRegionFiles('data/config/xteas');
}

export async function loadGameConfigurations(): Promise<void> {
    logger.info('Loading server configurations...');

    const { items, itemIds, itemPresets, itemGroups } = await loadItemConfigurations('data/config/items/');
    itemMap = items;
    itemGroupMap = itemGroups;
    itemIdMap = itemIds;
    itemPresetMap = itemPresets;

    const { npcs, npcIds, npcPresets } = await loadNpcConfigurations('data/config/npcs/');
    npcMap = npcs;
    npcIdMap = npcIds;
    npcPresetMap = npcPresets;

    npcSpawns = await loadNpcSpawnConfigurations('data/config/npc-spawns/');
    musicRegions = await loadMusicRegionConfigurations();
    musicRegions.forEach(song => song.regionIds.forEach(region => musicRegionMap.set(region, song.songId)));
    itemSpawns = await loadItemSpawnConfigurations('data/config/item-spawns/');

    shopMap = await loadShopConfigurations('data/config/shops/');

    objectMap = {};

    logger.info(
        `Loaded ${musicRegions.length} music regions, ${Object.keys(itemMap).length} items, ${itemSpawns.length} item spawns, ` +
            `${Object.keys(npcMap).length} npcs, ${npcSpawns.length} npc spawns, and ${Object.keys(shopMap).length} shops.`,
    );
}

/**
 * find all items in all select groups
 * @param groupKeys array of string of which to find items connected with
 * @return itemsKeys array of itemkeys in all select groups
 */
export const findItemTagsInGroups = (groupKeys: string[]): string[] => {
    return Object.keys(
        groupKeys.reduce<Record<string, boolean>>((all, groupKey) => {
            const items = itemGroupMap[groupKey] || {};
            return { ...all, ...items };
        }, {}),
    );
};

/**
 * find all items which are shared by all the groups, and discard items not in all groups
 * @param groupKeys groups keys which to find items shared by
 * @return itemKeys of items shared by all groups
 */
export const findItemTagsInGroupFilter = (groupKeys: string[]): string[] => {
    if (!groupKeys || groupKeys.length === 0) {
        return [];
    }
    let collection: Record<string, boolean> | undefined = undefined;
    groupKeys.forEach(groupKey => {
        if (!collection) {
            collection = { ...(itemGroupMap[groupKey] || {}) };
            return;
        }
        const current = itemGroupMap[groupKey] || {};

        Object.keys(collection).forEach(existingItemKey => {
            if (!(existingItemKey in current) && collection) {
                delete collection[existingItemKey];
            }
        });
    });

    return Object.keys(collection || {});
};

export const findItem = (itemKey: number | string): ItemDetails | null => {
    if (!itemKey) {
        return null;
    }

    let gameId: number | null = null;
    if (typeof itemKey === 'number') {
        gameId = itemKey;
        itemKey = itemIdMap[gameId];

        if (!itemKey) {
            logger.warn(`Item ${gameId} is not yet registered on the server.`);
        }
    }

    let item;

    if (itemKey) {
        item = itemMap[itemKey];
        if (!item) {
            // Try fetching variation with suffix 0
            item = itemMap[`${itemKey}:0`];
        }
        if (item?.gameId) {
            gameId = item.gameId;
        }
    }

    if (gameId) {
        const cacheItem = filestore.configStore.itemStore.getItem(gameId);
        item = _.merge(item, cacheItem);
    }

    return item ? new ItemDetails(item) : null;
};

export const findNpc = (inputKey: number | string): NpcDetails => {
    if (!inputKey) {
        throw new Error('No NPC was provided to findNpc.');
    }

    // Pathway for finding an NPC by its game id
    if (typeof inputKey === 'number') {
        const gameId = inputKey;
        const npcKey = npcIdMap[gameId];

        // If we can't find a config in the project for this NPC - we fallback
        // to the cache which is the basic info loaded by `fileserver`.
        if (!npcKey) {
            const cacheNpc = filestore.configStore.npcStore.getNpc(gameId);
            if (cacheNpc) {
                return cacheNpc;
            } else {
                logger.warn(`NPC ${gameId} is not yet configured on the server and a matching cache NPC was not found.`);
                throw new Error(`NPC ${gameId} is not yet configured on the server and a matching cache NPC was not found.`);
            }
        }
    }

    // Otherwise we got a string identifier for the npcs
    let npc = npcMap[inputKey];
    if (!npc) {
        // Try fetching variation with suffix 0
        npc = npcMap[`${npc}:0`];
    }

    if (!npc) {
        logger.warn(`NPC ${inputKey} is not yet configured on the server and a matching cache NPC was not provided.`);
        throw new Error(`NPC ${inputKey} is not yet configured on the server and a matching cache NPC was not provided.`);
    }

    if (npc.extends) {
        let extensions = npc.extends;
        if (typeof extensions === 'string') {
            extensions = [extensions];
        }

        extensions.forEach(extKey => {
            const extensionNpc = npcPresetMap[extKey];
            if (extensionNpc) {
                npc = _.merge(npc, translateNpcServerConfig(undefined, extensionNpc));
            }
        });
    }

    return npc;
};

export const findObject = (objectId: number): ObjectConfig | null => {
    if (!objectMap[objectId]) {
        const object = filestore.objectStore.getObject(objectId);
        if (!object) {
            return null;
        }

        objectMap[objectId] = object;
        return object;
    } else {
        return objectMap[objectId];
    }
};

export const findShop = (shopKey: string): Shop | null => {
    if (!shopKey) {
        return null;
    }

    return shopMap[shopKey] || null;
};

export const findQuest = (questId: string): Quest | null => {
    const questKey = Object.keys(questMap).find(quest => quest.toLocaleLowerCase() === questId.toLocaleLowerCase());

    return questKey ? questMap[questKey] : null;
};

export const findMusicTrack = (trackId: number): MusicTrack | null => {
    return musicRegions.find(track => track.songId === trackId) || null;
};

export const findMusicTrackByButtonId = (buttonId: number): MusicTrack | null => {
    return musicRegions.find(track => track.musicTabButtonId === buttonId) || null;
};

export const findSongIdByRegionId = (regionId: number): number | null => {
    return musicRegionMap.get(regionId) || null;
};
