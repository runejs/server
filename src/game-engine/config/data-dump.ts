import { join } from 'path';
import { writeFileSync } from 'fs';
import { filestore } from '@engine/game-server';
import { logger } from '@runejs/core';
import { ItemConfig, NpcConfig, ObjectConfig } from '@runejs/filestore';


function dump<T>(fileName: string, definitions: T[]): boolean {
    const filePath = join('data/dump', fileName);

    const arr = [];
    for(let i = 0; i < definitions.length; i++) {
        arr.push(definitions[i]);
    }

    try {
        writeFileSync(filePath, JSON.stringify(arr, null, 4));
        return true;
    } catch(error) {
        logger.error(`Error dumping ${fileName}`);
        return false;
    }
}

export function dumpNpcs(): boolean {
    return dump<NpcConfig>('npcs.json', filestore.configStore.npcStore.decodeNpcStore());
}

export function dumpItems(): boolean {
    return dump<ItemConfig>('items.json', filestore.configStore.itemStore.decodeItemStore());
}

export function dumpObjects(): boolean {
    return dump<ObjectConfig>('objects.json', filestore.configStore.objectStore.decodeObjectStore());
}
