import { getFiles } from '@server/util/files';
import { logger } from '@runejs/core';
import { readFileSync } from 'fs';
import {
    ItemDetails,
    ItemPresetConfiguration,
    loadItemConfigurations,
    translateItemConfig
} from '@server/config/item-config';
import { cache } from '@server/game-server';
import {
    loadNpcConfigurations,
    NpcDetails,
    NpcPresetConfiguration,
    translateNpcConfig
} from '@server/config/npc-config';
import _ from 'lodash';

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

export async function loadConfigurations(): Promise<void> {
    const { items, itemIds, itemPresets } = await loadItemConfigurations();
    itemMap = items;
    itemIdMap = itemIds;
    itemPresetMap = itemPresets;

    const { npcs, npcIds, npcPresets } = await loadNpcConfigurations();
    npcMap = npcs;
    npcIdMap = npcIds;
    npcPresetMap = npcPresets;
}

export const findItem = (itemKey: number | string): ItemDetails => {
    if(!itemKey) {
        return null;
    }

    if(typeof itemKey === 'number') {
        const gameId = itemKey;
        itemKey = itemIdMap[gameId];

        if(!itemKey) {
            const cacheItem = cache.itemDefinitions.get(gameId);
            if(cacheItem) {
                logger.warn(`Item ${gameId} is not yet configured on the server.`);
                return cacheItem as any;
            } else {
                logger.warn(`Item ${gameId} is not yet configured on the server and a matching cache item was not found.`);
                return null;
            }
        }
    }

    let item = itemMap[itemKey];
    if(!item) {
        logger.warn(`Item ${itemKey} is not yet configured on the server and a matching cache item was not provided.`);
        return null;
    }

    if(item.extends) {
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

    return item;
};

export const findNpc = (npcKey: number | string): NpcDetails => {
    if(!npcKey) {
        return null;
    }

    if(typeof npcKey === 'number') {
        const gameId = npcKey;
        npcKey = npcIdMap[gameId];

        if(!npcKey) {
            const cacheNpc = cache.npcDefinitions.get(gameId);
            if(cacheNpc) {
                logger.warn(`NPC ${gameId} is not yet configured on the server.`);
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
