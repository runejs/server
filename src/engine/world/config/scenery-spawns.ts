import { logger } from '@runejs/common';
import { JSON_SCHEMA, safeLoad } from 'js-yaml';
import { readFileSync } from 'fs';
import { LandscapeObject } from '@runejs/filestore';

export function parseScenerySpawns(): LandscapeObject[] {
    try {
        logger.info('Parsing scenery spawns...');

        const scenerySpawns = safeLoad(readFileSync('data/config/scenery-spawns.yaml', 'utf8'),
            { schema: JSON_SCHEMA }) as LandscapeObject[];

        if(!scenerySpawns || scenerySpawns.length === 0) {
            throw new Error('Unable to read scenery spawns.');
        }

        logger.info(`${scenerySpawns.length} scenery spawns found.`);

        return scenerySpawns;
    } catch(error) {
        logger.error('Error parsing scenery spawns: ' + error);
        return [];
    }
}
