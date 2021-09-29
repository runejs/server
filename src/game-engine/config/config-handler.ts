import { logger } from '@runejs/core';
import _ from 'lodash';
import {
    ItemDetails,
    ItemPresetConfiguration,
    loadItemConfigurations,
    translateItemConfig
} from '@engine/config/item-config';
import { filestore, questMap } from '@engine/game-server';
import {
    loadNpcConfigurations,
    NpcDetails,
    NpcPresetConfiguration,
    translateNpcServerConfig
} from '@engine/config/npc-config';
import { loadNpcSpawnConfigurations, NpcSpawn } from '@engine/config/npc-spawn-config';
import { loadShopConfigurations, Shop } from '@engine/config/shop-config';
import { Quest } from '@engine/world/actor/player/quest';
import { ItemSpawn, loadItemSpawnConfigurations } from '@engine/config/item-spawn-config';
import { loadSkillGuideConfigurations, SkillGuide } from '@engine/config/skill-guide-config';
import { loadMusicRegionConfigurations, MusicTrack } from '@engine/config/music-regions-config';
import { LandscapeObject, loadXteaRegionFiles, ObjectConfig, XteaRegion } from '@runejs/filestore';

require('json5/lib/register');



export let itemMap: { [key: string]: ItemDetails };
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
export let skillGuides: SkillGuide[] = [];
export let xteaRegions: { [key: number]: XteaRegion };

export const musicRegionMap = new Map<number, number>();
export const widgets: { [key: string]: any } = require('../../../data/config/widgets.json5');

export async function loadCoreConfigurations(): Promise<void> {
    xteaRegions = await loadXteaRegionFiles('data/config/xteas');
}

export async function loadGameConfigurations(): Promise<void> {
    logger.info(`Loading server configurations...`);

    const { items, itemIds, itemPresets } = await loadItemConfigurations('data/config/items/');
    itemMap = items;
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
    skillGuides = await loadSkillGuideConfigurations('data/config/skill-guides/');

    objectMap = {};

    logger.info(`Loaded ${musicRegions.length} music regions, ${Object.keys(itemMap).length} items, ${itemSpawns.length} item spawns, ` +
        `${Object.keys(npcMap).length} npcs, ${npcSpawns.length} npc spawns, ${Object.keys(shopMap).length} shops and ${skillGuides.length} skill guides.`);
}


export const findItem = (itemKey: number | string): ItemDetails | null => {
    if(!itemKey) {
        return null;
    }

    let gameId: number;
    if(typeof itemKey === 'number') {
        gameId = itemKey;
        itemKey = itemIdMap[gameId];

        if(!itemKey) {
            logger.warn(`Item ${gameId} is not yet registered on the server.`);
        }
    }

    let item;

    if(itemKey) {
        item = itemMap[itemKey];
        if(!item) {
            // Try fetching variation with suffix 0
            item = itemMap[`${itemKey}:0`]
        }
        if(item?.gameId) {
            gameId = item.gameId;
        }

        if(item?.extends) {
            let extensions = item.extends;
            if(typeof extensions === 'string') {
                extensions = [ extensions ];
            }

            extensions.forEach(extKey => {
                const extensionItem = itemPresetMap[extKey];
                if(extensionItem) {
                    item = _.merge(item, translateItemConfig(undefined, extensionItem));
                }
            });
        }
    }

    if(gameId) {
        const cacheItem = filestore.configStore.itemStore.getItem(gameId);
        item = _.merge(item, cacheItem);
    }

    return item ? new ItemDetails(item) : null;
};


export const findNpc = (npcKey: number | string): NpcDetails | null => {
    if(!npcKey) {
        return null;
    }

    if(typeof npcKey === 'number') {
        const gameId = npcKey;
        npcKey = npcIdMap[gameId];

        if(!npcKey) {
            const cacheNpc = filestore.configStore.npcStore.getNpc(gameId);
            if(cacheNpc) {
                return cacheNpc as any;
            } else {
                logger.warn(`NPC ${gameId} is not yet configured on the server and a matching cache NPC was not found.`);
                return null;
            }
        }
    }

    let npc = npcMap[npcKey];
    if(!npc) {
        // Try fetching variation with suffix 0
        npc = npcMap[`${npc}:0`]
    }

    if(!npc) {
        logger.warn(`NPC ${npcKey} is not yet configured on the server and a matching cache NPC was not provided.`);
        return null;
    }

    if(npc.extends) {
        let extensions = npc.extends;
        if(typeof extensions === 'string') {
            extensions = [ extensions ];
        }

        extensions.forEach(extKey => {
            const extensionNpc = npcPresetMap[extKey];
            if(extensionNpc) {
                npc = _.merge(npc, translateNpcServerConfig(undefined, extensionNpc));
            }
        });
    }

    return npc;
};


export const findObject = (objectId: number): ObjectConfig | null => {
    if(!objectMap[objectId]) {
        const object = filestore.objectStore.getObject(objectId);
        if(!object) {
            return null;
        }

        objectMap[objectId] = object;
        return object;
    } else {
        return objectMap[objectId];
    }
};


export const findShop = (shopKey: string): Shop | null => {
    if(!shopKey) {
        return null;
    }

    return shopMap[shopKey] || null;
};


export const findQuest = (questId: string): Quest | null => {
    return questMap[Object.keys(questMap).find(quest => quest.toLocaleLowerCase() === questId.toLocaleLowerCase())] || null;
};

export const findMusicTrack = (trackId: number): MusicTrack | null => {
    return musicRegions.find(track => track.songId === trackId) || null;
};

export const findMusicTrackByButtonId = (buttonId: number): MusicTrack | null => {
    return musicRegions.find(track => track.musicTabButtonId === buttonId) || null;
};

export const findSongIdByRegionId = (regionId: number): number | null => {
    return musicRegionMap.has(regionId) ? musicRegionMap.get(regionId) : null;
};
