import { readFileSync } from 'fs';
import { logger } from '@runejs/logger/dist/logger';
import { JSON_SCHEMA, safeLoad, safeDump } from 'js-yaml';

export interface Examine {
    id: number;
    examine: string;
}

export class ExamineCache {
    private readonly items: Map<number, Examine>;
    private readonly npcs: Map<number, Examine> ;
    private readonly objects: Map<number, Examine>;

    public constructor() {
        logger.info('Parsing examine data...');
        this.items = parseData('data/config/examine-item-data.yaml');
        this.npcs = new Map<number, Examine>();
        this.objects = new Map<number, Examine>();
    }

    public getItem (id: number): string {
        const examine = this.items.get(id);
        return examine ? examine.examine : null;
    }

    public getNpc (id: number): string {
        const examine = this.npcs.get(id);
        return examine ? examine.examine : null;
    }

    public getObject (id: number): string {
        const examine = this.objects.get(id);
        return examine ? examine.examine : null;
    }

}

function parseData(fileName: string): Map<number, Examine> {
    try {
        logger.info('Parsing examine item data...');

        const examineItems = safeLoad(readFileSync(fileName, 'utf8'), { schema: JSON_SCHEMA }) as Examine[];

        if(!examineItems || examineItems.length === 0) {
            throw new Error('Unable to read examine data.');
        }

        const examineMap: Map<number, Examine> = new Map<number, Examine>();
        for (const item of examineItems) {
            examineMap.set(item.id, item);
        }

        return examineMap;
    } catch(error) {
        logger.error('Error parsing examine data: ' + error);
        return null;
    }
}
