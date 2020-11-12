import { getFiles } from '@server/util/files';
import { logger } from '@runejs/core';
import { readFileSync } from "fs";
import { ItemDetails, loadItemConfigurations } from '@server/config/item-config';

export async function loadConfigurationFiles<T>(configurationDir: string): Promise<{ [key: string]: T }> {
    let configs: { [key: string]: T } = {};

    for await(const path of getFiles(configurationDir)) {
        try {
            const configContent = JSON.parse(readFileSync(path, 'utf8'));

            if(configContent) {
                configs = { ...configs, ...configContent };
            }
        } catch(error) {
            logger.error(`Error loading configuration file at ${path}:`);
            logger.error(error);
        }
    }

    return configs;
}

let itemMap: { [key: string]: ItemDetails };
let itemIdMap: { [key: number]: string };

export async function loadConfigurations(): Promise<void> {
    const { items, idMap } = await loadItemConfigurations();
    itemMap = items;
    itemIdMap = idMap;
}

export const findItem = (itemKey: number | string): ItemDetails => {
    if(typeof itemKey === 'number') {
        itemKey = itemIdMap[itemKey];

        if(!itemKey) {
            throw new Error(`Item ${itemKey} is not yet configured on the server.`);
        }
    }

    return itemMap[itemKey];
};
