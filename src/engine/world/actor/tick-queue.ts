import { Actor } from '@engine/world/actor/actor';
import { Player } from '@engine/world/actor/player/player';
import { ActionTimer } from '@engine/world/actor/timing/action-timer';
import { isPlayer } from '@engine/world/actor/util';

/**
 * Represents different queue types for tick tasks.
 *
 * @see {@link https://osrs-docs.com/docs/mechanics/queues/#queue-types}
 */
export enum QueueType {
    /**
     * Weak tasks are removed by any interruption (movement, combat, interfaces, etc)
     * and are cleared if any Strong tasks exist in the queue
     */
    WEAK = 'weak',

    /**
     * Normal tasks are processed normally but skipped if a modal interface is open
     */
    NORMAL = 'normal',

    /**
     * Strong tasks remove all Weak tasks from the queue and force close modal interfaces
     */
    STRONG = 'strong',

    /**
     * Soft tasks cannot be interrupted and always execute when their time comes,
     * even during delays. Also forces modal interfaces closed.
     */
    SOFT = 'soft',
}

/**
 * Configuration options for requesting a tick task
 */
export interface RequestTickOptions {
    /**
     * Number of game ticks to wait before executing
     */
    ticks: number;

    /**
     * The type of task - determines how it behaves regarding interruptions
     * @default QueueType.NORMAL
     */
    type?: QueueType;

    /**
     * Whether to use the global action timer that can be manipulated
     * @default false
     */
    useGlobalTimer?: boolean;
}

/**
 * Represents a queued tick task
 */
export interface TickTask {
    /** Number of ticks to wait */
    ticks: number;
    /** Promise that resolves when task completes */
    promise: Promise<void>;
    /** Function to resolve the promise */
    resolve: () => void;
    /** Function to reject the promise */
    reject: (reason?: any) => void;
    /** Type of task */
    type: QueueType;
    /** Tick number when task was started */
    startTick: number;

    useGlobalTimer?: boolean;

    /** Set once the task's promise has been rejected, so it can be dropped from the queue */
    rejected?: boolean;
}

/**
 * Manages tick-based timing and scheduling for an Actor.
 *
 * Implements OSRS-style task queuing with different task types:
 * - WEAK tasks are removed by interruptions or presence of STRONG tasks
 * - NORMAL tasks are processed normally but skip if modal interface is open
 * - STRONG tasks clear WEAK tasks and force close modal interfaces
 * - SOFT tasks cannot be interrupted and always execute
 *
 * Tasks are processed in order and can be delayed by game ticks. Delayed actors
 * cannot process most tasks except for SOFT tasks.
 *
 * Each tick represents 600ms in the game world.
 *
 * @see {@link https://osrs-docs.com/docs/mechanics/queues/} - OSRS Queue Documentation
 * @see {@link https://osrs-docs.com/docs/mechanics/delays/} - OSRS Delay System
 * TODO: @see {@link https://oldschool.runescape.wiki/w/Tick_manipulation}
 */

export class TickQueue {
    /** Current game tick counter */
    public currentTick: number = 0;
    /** List of queued tasks */
    private tasks: TickTask[] = [];
    private actionTimer = new ActionTimer();
    /**
     * Creates a new TickQueue for the given actor
     * @param actor The actor this queue belongs to
     */
    constructor(private actor: Actor) {
        // Subscribe to movement events to clear weak tasks
        this.actor.walkingQueue.movementEvent.subscribe(() => {
            this.clearWeakTasks('Movement interrupted action');
        });
    }

    /**
     * Removes all WEAK tasks from the queue
     * @param reason The reason for clearing tasks, passed to reject()
     */
    private clearWeakTasks(reason: string): void {
        this.tasks = this.tasks.filter(task => {
            if (task.type === QueueType.WEAK) {
                task.reject(reason);
                return false;
            }
            return true;
        });
    }

    /**
     * Request to wait for a specific number of ticks
     *
     * Tasks are queued based on their type:
     * - WEAK tasks can be interrupted by movement/actions
     * - NORMAL tasks skip if modal interface is open
     * - STRONG tasks clear WEAK tasks and close modals
     * - SOFT tasks cannot be interrupted
     *
     * @param options Configuration options for the tick request
     * @returns Promise that resolves when the ticks have elapsed or rejects if interrupted
     * @throws Error if trying to add a task while a blocking task exists
     *
     * @example
     * ```typescript
     * // Wait 3 ticks with WEAK type (interruptible)
     * try {
     *   await actor.tickQueue.requestTicks({
     *     ticks: 3,
     *     type: QueueType.WEAK
     *   });
     *   // Action after 3 ticks if not interrupted
     * } catch (error) {
     *   // Handle interruption
     * }
     * ```
     */
    public async requestTicks(options: RequestTickOptions): Promise<void> {
        const { ticks, type = QueueType.NORMAL, useGlobalTimer = false } = options;

        // Handle STRONG tasks entering queue
        if (type === QueueType.STRONG) {
            // Clear weak tasks first
            this.clearWeakTasks('Strong task present');

            // Force close modal interfaces
            if (isPlayer(this.actor)) {
                this.actor.interfaceState.closeAllSlots();
            }
        }

        // Handle SOFT tasks entering queue
        if (type === QueueType.SOFT && isPlayer(this.actor)) {
            // Force close modal interfaces immediately
            this.actor.interfaceState.closeAllSlots();
        }

        if (useGlobalTimer) {
            this.actionTimer.setTimer(ticks);
        }

        let resolveFunc: () => void;
        let rejectFunc: (reason?: any) => void;

        const promise = new Promise<void>((resolve, reject) => {
            resolveFunc = resolve;
            rejectFunc = reject;
        });

        const task: TickTask = {
            ticks,
            promise,
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            resolve: resolveFunc!,
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            reject: rejectFunc!,
            type,
            startTick: this.currentTick,
            useGlobalTimer,
        };

        this.tasks.push(task);
        return promise;
    }

    /**
     * Processes queued tasks on each game tick.
     *
     * Processing rules:
     * - Skips if actor is delayed (except SOFT tasks)
     * - NORMAL tasks skip if modal interface open
     * - STRONG/SOFT tasks force close modal interfaces
     * - Continues processing until no tasks were processed in a loop
     */
    public tick(): void {
        this.currentTick++;

        this.actionTimer.tick();

        // A strong task present at the start of the tick clears any queued weak tasks
        if (this.hasStrongTask()) {
            this.clearWeakTasks('Strong task present');
        }

        let processedTasks = 0;
        do {
            processedTasks = 0;

            // Tasks are processed in insertion order
            for (let i = 0; i < this.tasks.length; i++) {
                const task = this.tasks[i];

                // Re-read the delay each iteration; a resolved task may have delayed the actor
                const isDelayed = this.actor.delayManager.isDelayed();

                // Only process task if:
                // 1. It's a SOFT task (these ignore delays)
                // 2. OR actor is not delayed and task can be processed
                if (task.type === QueueType.SOFT || (!isDelayed && this.canProcessTask(task))) {
                    if (this.shouldCompleteTask(task)) {
                        // Handle modal interfaces for STRONG/SOFT tasks
                        if (isPlayer(this.actor) && (task.type === QueueType.STRONG || task.type === QueueType.SOFT)) {
                            this.actor.interfaceState.closeAllSlots();
                        }

                        task.resolve();
                        this.tasks.splice(i, 1);
                        i--;
                        processedTasks++;
                    }
                } else if (task.rejected) {
                    // canProcessTask rejected the task; drop it so it is not retried every tick
                    this.tasks.splice(i, 1);
                    i--;
                }
            }
        } while (processedTasks > 0 && this.tasks.length > 0);
    }

    private shouldCompleteTask(task: TickTask): boolean {
        const elapsed = this.currentTick - task.startTick;
        if (elapsed < task.ticks) {
            return false;
        }

        if (task.useGlobalTimer) {
            return !this.actionTimer.isActive();
        }

        return true;
    }

    /**
     * Checks if a task can be processed based on its type and current conditions
     * @param task The task to check
     * @returns True if task can be processed, false otherwise
     */

    private canProcessTask(task: TickTask): boolean {
        // Check if task should execute in future
        if (this.currentTick < task.startTick + task.ticks) {
            return false;
        }

        // For players, handle modal interfaces
        if (isPlayer(this.actor)) {
            // NORMAL tasks skip if modal interface is open
            if (task.type === QueueType.NORMAL && this.actor.interfaceState.hasModalOpen()) {
                return false;
            }

            // STRONG/SOFT tasks force close interfaces before processing
            if (task.type === QueueType.STRONG || task.type === QueueType.SOFT) {
                this.actor.interfaceState.closeAllSlots();
            }
        }

        // Weak tasks interrupted by strong tasks
        if (task.type === QueueType.WEAK && this.hasStrongTask()) {
            task.reject('Strong task present');
            task.rejected = true;
            return false;
        }

        return true;
    }

    /**
     * Checks if queue contains any strong tasks
     */
    private hasStrongTask(): boolean {
        return this.tasks.some(task => task.type === QueueType.STRONG);
    }

    /**
     * Cleans up the tick queue when the actor is destroyed.
     * Rejects all pending tasks.
     */
    public destroy(): void {
        this.rejectAllTasks('Actor destroyed');
    }

    /**
     * Rejects all tasks in the queue
     * @param reason The reason for rejection
     */
    private rejectAllTasks(reason: string = 'Tasks cancelled'): void {
        while (this.tasks.length > 0) {
            const task = this.tasks.pop();
            if (task) {
                task.reject(reason);
            }
        }
    }
}
