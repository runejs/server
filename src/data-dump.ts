import { join } from 'path';
import { writeFileSync } from 'fs';
import { cache } from '@server/game-server';
import { logger } from '@runejs/logger';
import { ItemDefinition, NpcDefinition, Widget } from '@runejs/cache-parser';

function dump<T>(fileName: string, definitions: Map<number, T>): boolean {
    const filePath = join('data/dump', fileName);

    const arr = [];
    for(let i = 0; i < definitions.size; i++) {
        arr.push(definitions.get(i));
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
    return dump<NpcDefinition>('npcs.json', cache.npcDefinitions);
}

export function dumpItems(): boolean {
    return dump<ItemDefinition>('items.json', cache.itemDefinitions);
}

export function dumpWidgets(): boolean {
    return dump<Widget>('widgets.json', cache.widgets);
}
