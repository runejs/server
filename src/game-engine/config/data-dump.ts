import { join } from 'path';
import { writeFileSync } from 'fs';
import { filestore } from '@engine/game-server';
import { logger } from '@runejs/core';
import { ItemConfig, NpcConfig, ObjectConfig, WidgetBase } from '@runejs/filestore';


export interface DataDumpResult {
    successful: boolean;
    filePath: string;
}


function dump<T>(fileName: string, definitions: T[]): DataDumpResult {
    const filePath = join('data/dump', fileName);

    const arr = [];
    for(let i = 0; i < definitions.length; i++) {
        arr.push(definitions[i]);
    }

    try {
        writeFileSync(filePath, JSON.stringify(arr, null, 4));
        return {
            successful: true,
            filePath
        };
    } catch(error) {
        logger.error(`Error dumping ${fileName}`);
        return {
            successful: false,
            filePath
        };
    }
}

export const dumpNpcs = (): DataDumpResult => {
    return dump<NpcConfig>('npcs.json', filestore.configStore.npcStore.decodeNpcStore());
};

export const dumpItems = (): DataDumpResult => {
    return dump<ItemConfig>('items.json', filestore.configStore.itemStore.decodeItemStore());
};

export const dumpObjects = (): DataDumpResult => {
    return dump<ObjectConfig>('objects.json', filestore.configStore.objectStore.decodeObjectStore());
};

export const dumpWidgets = (): DataDumpResult => {
    return dump<WidgetBase>('widgets.json', filestore.widgetStore.decodeWidgetStore());
};
