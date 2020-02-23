import { join } from "path";
import { writeFileSync } from "fs";
import { gameCache } from '@server/game-server';
import { logger } from '@runejs/logger/dist/logger';

export function dumpItems(): boolean {
    const filePath = join('data/dump', 'items.json');

    const itemMap = gameCache.itemDefinitions;
    const items = [];
    for(let i = 0; i < itemMap.size; i++) {
        items.push(itemMap.get(i));
    }

    try {
        writeFileSync(filePath, JSON.stringify(items, null, 4));
        return true;
    } catch(error) {
        logger.error(`Error dumping item data.`);
        return false;
    }
}
