import { gameEngineDist } from '@engine/util/directories';
import { getFiles } from '@engine/util/files';
import { logger } from '@runejs/core';
import { Actor } from '@engine/world/actor/actor';
import { ActionHook } from '@engine/world/action/hooks';
import { Position } from '@engine/world/position';
import { Player } from '@engine/world/actor/player/player';
import { TaskExecutor } from '@engine/world/action/hooks/task';
import { Subscription } from 'rxjs';
import { LandscapeObject } from '@runejs/filestore';


/**
 * The priority of an queueable action within the pipeline.
 */
export type ActionStrength = 'weak' | 'normal' | 'strong';


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


export const gentleActions: ActionType[] = [
    'button', 'widget_interaction', 'player_init', 'npc_init',
    'move_item', 'item_swap', 'player_command', 'region_change'
];


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
 * A list of filtered hooks for an actor to run.
 */
export interface RunnableHooks<T = any> {
    // The action in progress
    action: T;
    // Matching action hooks
    hooks?: ActionHook[];
    // If a location is provided, then the actor must first move to that location to run the action
    actionPosition?: Position;
}


/**
 * A specific actor's action pipeline handler.
 * Records action pipes and distributes content actions from the game engine down to execute plugin hooks.
 */
export class ActionPipeline {

    private static pipes = new Map<string, any>();

    private runningTasks: TaskExecutor<any>[] = [];
    private canceling: boolean = false;
    private movementSubscription: Subscription;

    public constructor(public readonly actor: Actor) {
        this.movementSubscription = this.actor.walkingQueue.movementQueued$
            .subscribe(async () => this.cancelRunningTasks());
    }

    public static getPipe(action: ActionType): Map<string, any> {
        return ActionPipeline.pipes.get(action);
    }

    public static register(action: ActionType, actionPipe: (...args: any[]) => void): void {
        ActionPipeline.pipes.set(action.toString(), actionPipe);
    }

    public shutdown(): void {
        this.movementSubscription.unsubscribe();
    }

    public async call(action: ActionType, ...args: any[]): Promise<void> {
        const actionHandler = ActionPipeline.pipes.get(action.toString());
        if(actionHandler) {
            try {
                await this.runActionHandler(actionHandler, ...args);
            } catch(error) {
                if(error) {
                    logger.error(`Error handling action ${action.toString()}`);
                    logger.error(error);
                }
            }
        }
    }

    public async cancelRunningTasks(): Promise<void> {
        if(this.canceling || !this.runningTasks || this.runningTasks.length === 0) {
            return;
        }

        this.canceling = true;

        for(const runningTask of this.runningTasks) {
            if(runningTask.running) {
                await runningTask.stop();
            }
        }

        // Remove all tasks
        this.runningTasks = [];
        this.canceling = false;
    }

    private async runActionHandler(actionHandler: any, ...args: any[]): Promise<void> {
        const runnableHooks: RunnableHooks | null | undefined = await actionHandler(...args);

        if(!runnableHooks?.hooks || runnableHooks.hooks.length === 0) {
            return;
        }

        for(let i = 0; i < runnableHooks.hooks.length; i++) {
            const hook = runnableHooks.hooks[i];

            if(!hook) {
                continue;
            }

            // Some actions are non-cancelling
            if(gentleActions.indexOf(hook.type) === -1) {
                await this.cancelRunningTasks();
            }

            if(runnableHooks.actionPosition) {
                try {
                    const gameObject = runnableHooks.action['object'] || null;
                    await this.actor.waitForPathing(
                        !gameObject ? runnableHooks.actionPosition : (gameObject as LandscapeObject));
                } catch(error) {
                    logger.error(`Error pathing to hook target`, error);
                    return;
                }
            }

            await this.runHook(hook, runnableHooks.action);
            if(!hook.multi) {
                // If the highest priority hook does not allow other hooks
                // to run during this same action, then return here to break
                // out of the loop and complete execution.
                return;
            }
        }
    }

    private async runHook(actionHook: ActionHook, action: any): Promise<void> {
        const { handler, task } = actionHook;

        if(task) {
            // Schedule task-based hook
            const taskExecutor = new TaskExecutor(this.actor, task, actionHook, action);
            this.runningTasks.push(taskExecutor);

            // Run the task until complete
            await taskExecutor.run();

            // Cleanup and remove the task once completed
            const taskIdx = this.runningTasks.findIndex(task => task.taskId === taskExecutor.taskId);
            if(taskIdx !== -1) {
                this.runningTasks.splice(taskIdx, 1);
            }
        } else if(handler) {
            // Run basic hook
            await handler(action);
        }
    }

    public get paused(): boolean {
        if(this.actor instanceof Player) {
            if(this.actor.interfaceState.widgetOpen()) {
                return true;
            }
        }

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


export * from './hooks/index';
