import { join } from "path";
import { writeFileSync } from "fs";
import { gameCache } from '@server/game-server';
import { logger } from '@runejs/logger/dist/logger';
import { ItemDefinition, NpcDefinition } from '@runejs/cache-parser';
import { WidgetDefinition } from '@runejs/cache-parser/dist/cache-new-format/screen/widgets';

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
    return dump<NpcDefinition>('npcs.json', gameCache.npcDefinitions);
}

export function dumpItems(): boolean {
    return dump<ItemDefinition>('items.json', gameCache.itemDefinitions);
}

export function dumpWidgets(): boolean {
    return dump<WidgetDefinition>('widgets.json', gameCache.widgetDefinitions);
}
