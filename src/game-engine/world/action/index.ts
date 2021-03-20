import { gameEngineDist } from '@engine/util/directories';
import { getFiles } from '@engine/util/files';
import { logger } from '@runejs/core';
import { Actor } from '@engine/world/actor/actor';
import { ActionHook, HookTask } from '@engine/world/action/hooks';
import { lastValueFrom, Subscription, timer } from 'rxjs';
import { World } from '@engine/world';
import { Position } from '@engine/world/position';
import uuidv4 from 'uuid/v4';
import { Player } from '@engine/world/actor/player/player';


/**
 * The priority of an queueable action within the pipeline.
 */
export type ActionStrength = 'weak' | 'normal' | 'strong';


// T = current action info (ButtonAction, MoveItemAction, etc)
export class TaskExecutor<T> {

    public running: boolean = false;
    public session: { [key: string]: any } = {}; // a session store to use for the lifetime of the task
    public readonly taskId = uuidv4();
    public readonly strength: ActionStrength;
    private intervalSubscription: Subscription;

    public constructor(public readonly actor: Actor,
                       public readonly task: HookTask<T>,
                       public readonly hook: ActionHook,
                       public readonly actionData: T) {
        this.strength = this.hook.strength || 'normal';
    }

    public async run(): Promise<void> {
        if(!await this.canActivate()) {
            return;
        }

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
                let index: number = 0;
                this.intervalSubscription = timer(0, intervalMs).subscribe(
                    async () => {
                        if(!await this.execute(index++)) {
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

    public async execute(index: number = 0): Promise<boolean> {
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
            const response = await this.task.activate(this, index);
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

    public async stop(): Promise<void> {
        this.intervalSubscription?.unsubscribe();

        await this.task?.onComplete(this);

        this.running = false;
        this.session = null;
    }

    public get valid(): boolean {
        return !!this.task?.activate && !!this.actionData;
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
                await this.runActionHandler(actionHandler, ...args);
            } catch(error) {
                if(error) {
                    logger.error(`Error handling action ${action.toString()}`);
                    logger.error(error);
                }
            }
        }
    }

    private async cancelWeakerActions(newActionStrength: ActionStrength): Promise<void> {
        if(!this.runningTasks || this.runningTasks.length === 0) {
            return;
        }

        const pendingRemoval: string[] = [];

        for(const runningTask of this.runningTasks) {
            if(!runningTask.running) {
                pendingRemoval.push(runningTask.taskId);
                continue;
            }

            if(runningTask.strength === 'weak' || (runningTask.strength === 'normal' && newActionStrength === 'strong')) {
                // Cancel obviously weaker tasks
                await runningTask.stop();
                pendingRemoval.push(runningTask.taskId);
                continue;
            }

            if(runningTask.strength === 'normal') {
                // @TODO normal task handling
            } else if(runningTask.strength === 'strong') {
                // @TODO strong task handling
            }
        }

        // Remove all non-running and ceased tasks
        this.runningTasks = this.runningTasks.filter(task => !pendingRemoval.includes(task.taskId));
    }

    private async runActionHandler(actionHandler: any, ...args: any[]): Promise<void> {
        const runnableHooks: RunnableHooks | null | undefined = actionHandler(...args);

        if(!runnableHooks?.hooks || runnableHooks.hooks.length === 0) {
            return;
        }

        if(runnableHooks.actionPosition) {
            await this.actor.waitForPathing(runnableHooks.actionPosition);
        }

        for(let i = 0; i < runnableHooks.hooks.length; i++) {
            const hook = runnableHooks.hooks[i];
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

        await this.cancelWeakerActions(actionHook.strength || 'normal');

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
