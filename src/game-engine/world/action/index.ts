import { gameEngineDist } from '@engine/util/directories';
import { getFiles } from '@engine/util/files';
import { logger } from '@runejs/core';
import { Actor } from '@engine/world/actor/actor';
import { HookTask } from '@engine/world/action/hooks';
import { lastValueFrom, Subscription, timer } from 'rxjs';
import { World } from '@engine/world';


/**
 * The priority of an queueable action within the pipeline.
 */
export type ActionPriority = 'weak' | 'normal' | 'strong';


// T = current action info (ButtonAction, MoveItemAction, etc)
export class TaskExecutor<T> {

    public running: boolean = false;
    private intervalSubscription: Subscription;

    public constructor(public readonly actor: Actor,
                       public readonly task: HookTask<T>,
                       public readonly actionData: T) {
    }

    public async run(): Promise<void> {
        this.running = true;

        if(!!this.task.delay || !!this.task.delayMs) {
            await lastValueFrom(timer(!!this.task.delayMs ? this.task.delayMs : (this.task.delay * World.TICK_LENGTH)));
        }

        if(!this.running) {
            return;
        }

        if(!!this.task.interval || !!this.task.intervalMs) {
            // Looping execution task
            const intervalMs = this.task.intervalMs || (this.task.interval * World.TICK_LENGTH);

            await new Promise(resolve => {
                this.intervalSubscription = timer(0, intervalMs).subscribe(
                    async () => {
                        if(!await this.execute()) {
                            this.intervalSubscription?.unsubscribe();
                            resolve();
                        }
                    },
                    async error => {
                        logger.error(error);
                        resolve();
                    },
                    async () => resolve());
                    });
        } else {
            // Single execution task
            await this.execute();
        }

        if(this.running) {
            await this.stop();
        }
    }

    public async execute(): Promise<boolean> {
        if(!this.actor) {
            // Actor destroyed, cancel the task
            return false;
        }

        if(this.actor.actionPipeline.paused) {
            // Action paused, continue loop if applicable
            return true;
        }

        if(!this.running) {
            // Task no longer running, cancel execution
            return false;
        }

        try {
            const response = await this.task.execute(this);
            return typeof response === 'boolean' ? response : true;
        } catch(error) {
            logger.error(`Error executing action task`);
            logger.error(error);
            return false;
        }
    }

    public async canActivate(): Promise<boolean> {
        if(!this.valid) {
            return false;
        }

        if(!this.task.canActivate) {
            return true;
        }

        try {
            return this.task.canActivate(this);
        } catch(error) {
            logger.error(`Error calling action canActivate`, this.task);
            logger.error(error);
            return false;
        }
    }

    private async stop(): Promise<void> {
        this.intervalSubscription?.unsubscribe();

        await this.task?.onComplete(this);

        this.running = false;
    }

    public get valid(): boolean {
        return !!this.task?.execute && !!this.actionData;
    }

}


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

    public async queue(action: ActionType, ...args: any[]): Promise<void> {

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

    public get paused(): boolean {
        return false;
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
