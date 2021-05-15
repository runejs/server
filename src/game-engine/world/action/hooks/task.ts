import uuidv4 from 'uuid/v4';
import { lastValueFrom, Subscription, timer } from 'rxjs';
import { Actor } from '@engine/world/actor/actor';
import { ActionHook } from '@engine/world/action';
import { World } from '@engine/world';
import { logger } from '@runejs/core';
import { Player } from '@engine/world/actor/player/player';
import { Npc } from '@engine/world/actor/npc/npc';
import { ActionStrength } from '@engine/world/action';


export type TaskSessionData = { [key: string]: any };


export interface HookTask<T = any> {
    canActivate?: <Q = T>(task: TaskExecutor<Q>, iteration?: number) => boolean | Promise<boolean>;
    activate: <Q = T>(task: TaskExecutor<Q>, iteration?: number) => void | undefined | boolean | Promise<void | undefined | boolean>;
    onComplete?: <Q = T>(task: TaskExecutor<Q>, iteration?: number) => void | Promise<void>;
    delay?: number; // # of ticks before execution
    delayMs?: number; // # of milliseconds before execution
    interval?: number; // # of ticks between loop intervals (defaults to single run task)
    intervalMs?: number;  // # of milliseconds between loop intervals (defaults to single run task)
}


// T = current action info (ButtonAction, MoveItemAction, etc)
export class TaskExecutor<T> {

    public readonly taskId = uuidv4();
    public readonly strength: ActionStrength;
    public running: boolean = false;
    public session: TaskSessionData = {}; // a session store to use for the lifetime of the task

    private iteration: number = 0;
    private intervalSubscription: Subscription;

    public constructor(public readonly actor: Actor,
                       public readonly task: HookTask<T>,
                       public readonly hook: ActionHook,
                       public readonly actionData: T) {
        this.strength = this.hook.strength || 'normal';
    }

    public async run(): Promise<void> {
        this.running = true;

        if(!!this.task.delay || !!this.task.delayMs) {
            await lastValueFrom(timer(this.task.delayMs !== undefined ? this.task.delayMs :
                    (this.task.delay * World.TICK_LENGTH)));
        }

        if(!!this.task.interval || !!this.task.intervalMs) {
            // Looping execution task
            const intervalMs = this.task.intervalMs !== undefined ? this.task.intervalMs :
                    (this.task.interval * World.TICK_LENGTH);

            await new Promise<void>(resolve => {
                this.intervalSubscription = timer(0, intervalMs).subscribe(
                    async() => {
                        if(!await this.execute()) {
                            this.intervalSubscription?.unsubscribe();
                            resolve();
                        }
                    },
                    error => {
                        logger.error(error);
                        resolve();
                    },
                    () => resolve());
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

        if(!await this.canActivate()) {
            // Unable to activate the task, cancel
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
            const response = await this.task.activate(this, this.iteration++);
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
            return this.task.canActivate(this, this.iteration);
        } catch(error) {
            logger.error(`Error calling action canActivate`, this.task);
            logger.error(error);
            return false;
        }
    }

    public async stop(): Promise<void> {
        this.running = false;
        this.intervalSubscription?.unsubscribe();

        if(this.task?.onComplete) {
            await this.task.onComplete(this, this.iteration);
        }

        this.session = null;
    }

    public getDetails(): {
        actor: Actor;
        player: Player | undefined;
        npc: Npc | undefined;
        actionData: T;
        session: TaskSessionData; } {
        const {
            type: {
                player,
                npc
            }
        } = this.actor;

        return {
            actor: this.actor,
            player,
            npc,
            actionData: this.actionData,
            session: this.session
        };
    }

    public get valid(): boolean {
        return !!this.task?.activate && !!this.actionData;
    }

}
