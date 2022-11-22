import { logger } from '@runejs/common';

import { ActionPipe, ActionPipeline } from '@engine/action';
import { getFiles } from '@engine/util';
import { BUILD_DIR } from '@engine/config';
import { join } from 'path';


/**
 * Finds and loads all available action pipe files (`*.action.ts`).
 */
export async function loadActionFiles(): Promise<void> {
    const ACTION_DIRECTORY = join(BUILD_DIR, 'action');
    const PIPE_DIRECTORY = join(ACTION_DIRECTORY, 'pipe');
    const blacklist = [];
    const loadedActions: string[] = [];

    for await(const path of getFiles(PIPE_DIRECTORY, blacklist)) {
        if(!path.endsWith('.action.ts') && !path.endsWith('.action.js')) {
            continue;
        }

        const location = '.' + path.substring(ACTION_DIRECTORY.length).replace('.js', '');

        try {
            const importedAction = (require(location)?.default || null) as ActionPipe | null;
            if(importedAction && Array.isArray(importedAction) && importedAction[0] && importedAction[1]) {
                ActionPipeline.register(importedAction[0], importedAction[1]);
                loadedActions.push(importedAction[0]);
            }
        } catch(error) {
            logger.error(`Error loading action file at ${location}:`);
            logger.error(error);
        }
    }

    logger.info(`Loaded action pipes: ${loadedActions.join(', ')}.`);

    return Promise.resolve();
}
