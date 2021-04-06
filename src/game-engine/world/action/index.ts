import { gameEngineDist } from '@engine/util/directories';
import { getFiles } from '@engine/util/files';
import { logger } from '@runejs/core';
import { Actor } from '@engine/world/actor/actor';


/**
 * The priority of an action within the pipeline.
 */
export type ActionPriority = 'weak' | 'normal' | 'strong';


/**
 * Content action type definitions.
 */
export type ActionType =
    'button'
    | 'widget_interaction'

    | 'npc_init'
    | 'npc_interaction'

    | 'object_interaction'

    | 'item_interaction'
    | 'item_on_object'
    | 'item_on_npc'
    | 'item_on_player'
    | 'item_on_item'
    | 'item_swap'
    | 'move_item'
    | 'spawned_item_interaction'

    | 'player_init'
    | 'player_command'
    | 'player_interaction'
    | 'region_change'
    | 'equipment_change';


/**
 * Methods in which action hooks in progress may be cancelled.
 */
export type ActionCancelType =
    'manual-movement'
    | 'pathing-movement'
    | 'generic'
    | 'keep-widgets-open'
    | 'button'
    | 'widget';


/**
 * Basic definition of a game engine action file (.action.ts exports).
 */
export type ActionPipe = [ ActionType, (...args: any[]) => void ];


/**
 * A specific actor's action pipeline handler.
 * Records action pipes and distributes content actions from the game engine down to execute plugin hooks.
 */
export class ActionPipeline {

    private static pipes = new Map<string, any>();

    public constructor(public readonly actor: Actor) {
    }

    public static getPipe(action: ActionType): Map<string, any> {
        return ActionPipeline.pipes.get(action);
    }

    public static register(action: ActionType, actionPipe: (...args: any[]) => void): void {
        ActionPipeline.pipes.set(action.toString(), actionPipe);
    }

    public async call(action: ActionType, ...args: any[]): Promise<void> {
        const actionHandler = ActionPipeline.pipes.get(action.toString());
        if(actionHandler) {
            try {
                await new Promise(resolve => {
                    actionHandler(...args);
                    resolve();
                });
            } catch(error) {
                logger.error(`Error handling action ${action.toString()}`);
                logger.error(error);
            }
        }
    }

}


/**
 * Finds and loads all available action pipe files (`*.action.ts`).
 */
export async function loadActionFiles(): Promise<void> {
    const ACTION_DIRECTORY = `${gameEngineDist}/world/action`;
    const blacklist = [];

    for await(const path of getFiles(ACTION_DIRECTORY, blacklist)) {
        if(!path.endsWith('.action.ts') && !path.endsWith('.action.js')) {
            continue;
        }

        const location = '.' + path.substring(ACTION_DIRECTORY.length).replace('.js', '');

        logger.info(`Loading ${path.substring(path.indexOf('action') + 7).replace('.js', '')} file.`);

        try {
            const importedAction = (require(location)?.default || null) as ActionPipe | null;
            if(importedAction && Array.isArray(importedAction) && importedAction[0] && importedAction[1]) {
                ActionPipeline.register(importedAction[0], importedAction[1]);
            }
        } catch(error) {
            logger.error(`Error loading action file at ${location}:`);
            logger.error(error);
        }
    }

    return Promise.resolve();
}
