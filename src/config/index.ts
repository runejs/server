import { logger } from '@runejs/core';
import { readFileSync } from 'fs';
import _ from 'lodash';
import { getFiles } from '@server/util/files';
import {
    ItemDetails,
    ItemPresetConfiguration,
    loadItemConfigurations,
    translateItemConfig
} from '@server/config/item-config';
import { cache, pluginActions } from '@server/game-server';
import {
    loadNpcConfigurations,
    NpcDetails,
    NpcPresetConfiguration,
    translateNpcConfig
} from '@server/config/npc-config';
import { loadNpcSpawnConfigurations, NpcSpawn } from '@server/config/npc-spawn-config';
import { loadShopConfigurations, Shop } from '@server/config/shop-config';
import { Quest } from '@server/config/quest-config';
require('json5/lib/register');

export async function loadConfigurationFiles(configurationDir: string): Promise<any[]> {
    const files = [];

    for await(const path of getFiles(configurationDir)) {
        try {
            const configContent = JSON.parse(readFileSync(path, 'utf8'));

            if(configContent) {
                files.push(configContent);
            }
        } catch(error) {
            logger.error(`Error loading configuration file at ${path}:`);
            logger.error(error);
        }
    }

    return files;
}


export let itemMap: { [key: string]: ItemDetails };
export let itemIdMap: { [key: number]: string };
export let itemPresetMap: ItemPresetConfiguration;
export let npcMap: { [key: string]: NpcDetails };
export let npcIdMap: { [key: number]: string };
export let npcPresetMap: NpcPresetConfiguration;
export let npcSpawns: NpcSpawn[] = [];
export let shopMap: { [key: string]: Shop };
export const widgets: { [key: string]: any } = require('../../data/config/widgets.json5');


export async function loadConfigurations(): Promise<void> {
    const { items, itemIds, itemPresets } = await loadItemConfigurations('data/config/items');
    itemMap = items;
    itemIdMap = itemIds;
    itemPresetMap = itemPresets;

    const { npcs, npcIds, npcPresets } = await loadNpcConfigurations('data/config/npcs');
    npcMap = npcs;
    npcIdMap = npcIds;
    npcPresetMap = npcPresets;

    npcSpawns = await loadNpcSpawnConfigurations('data/config/npc-spawns');

    shopMap = await loadShopConfigurations('data/config/shops');
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
        const cacheItem = cache.itemDefinitions.get(gameId);
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
            const cacheNpc = cache.npcDefinitions.get(gameId);
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
                npc = _.merge(npc, translateNpcConfig(undefined, extensionNpc));
            }
        });
    }

    return npc;
};


export const findShop = (shopKey: string): Shop | null => {
    if(!shopKey) {
        return null;
    }

    return shopMap[shopKey] || null;
};


export const findQuest = (questId: string): Quest | null => {
    const quests: Quest[] = pluginActions.quest;
    return quests.find(quest => quest.id.toLocaleLowerCase() === questId.toLocaleLowerCase()) || null;
};
