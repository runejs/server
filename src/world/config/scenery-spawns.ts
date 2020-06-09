import { logger } from '@runejs/logger';
import { JSON_SCHEMA, safeLoad } from 'js-yaml';
import { readFileSync } from 'fs';
import { LocationObject } from '@runejs/cache-parser';

export function parseScenerySpawns(): LocationObject[] {
    try {
        logger.info('Parsing scenery spawns...');

        const scenerySpawns = safeLoad(readFileSync('data/config/scenery-spawns.yaml', 'utf8'), { schema: JSON_SCHEMA }) as LocationObject[];

        if(!scenerySpawns || scenerySpawns.length === 0) {
            throw new Error('Unable to read scenery spawns.');
        }

        logger.info(`${scenerySpawns.length} scenery spawns found.`);

        return scenerySpawns;
    } catch(error) {
        logger.error('Error parsing scenery spawns: ' + error);
        return null;
    }
}
