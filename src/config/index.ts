import { getFiles } from '@server/util/files';
import { logger } from '@runejs/core';
import { readFileSync } from 'fs';
import { ItemDetails, loadItemConfigurations } from '@server/config/item-config';
import { cache } from '@server/game-server';

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

export async function loadConfigurations(): Promise<void> {
    const { items, idMap } = await loadItemConfigurations();
    itemMap = items;
    itemIdMap = idMap;
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

    const item = itemMap[itemKey];
    if(!item) {
        logger.warn(`Item ${itemKey} is not yet configured on the server and a matching cache item was not provided.`);
        return null;
    }

    return item;
};
