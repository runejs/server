import { TaskBreakType, TaskConfig, TaskStackGroup, TaskStackType } from './types';

const DEFAULT_TASK_CONFIG: Required<TaskConfig> = {
    interval: 1,
    stackType: TaskStackType.STACK,
    stackGroup: TaskStackGroup.ACTION,
    immediate: false,
    breakTypes: [],
    repeat: true
};

function readConfigValue(key: keyof TaskConfig, config?: TaskConfig): any {
    if (!config) {
        return DEFAULT_TASK_CONFIG[key];
    }

    return config[key] !== undefined ? config[key] : DEFAULT_TASK_CONFIG[key];
}

/**
 * This Task interface allows us to merge with the Task class
 * and add optional methods to the class.
 *
 * There is no way to add optional methods directly to an abstract class.
 *
 * @author jameskmonger
 */
export interface Task {
    /**
     * A callback that is called when the task is stopped.
     */
    onStop?(): void;
}

/**
 * A Task which can be ticked and executes after a specified number of ticks.
 *
 * The task can be configured to execute once, or repeatedly, and can also be executed immediately.
 *
 * @author jameskmonger
 */
export abstract class Task {
    /**
     * How the task should be stacked with other tasks of the same stack group.
     */
    public readonly stackType: TaskStackType;

    /**
     * The stack group for this task.
     */
    public readonly stackGroup: string;

    /**
     * Conditions under which the task should be broken.
     */
    public readonly breakTypes: TaskBreakType[];

    /**
     * The number of ticks between each execution of the task.
     */
    private interval: number;

    /**
     * The number of ticks remaining before the task is executed.
     */
    private ticksRemaining: number;

    /**
     * Should the task be repeated indefinitely?
     */
    private repeat: boolean;

    private _isActive = true;

    /**
     * @param config the configuration options for the task
     *
     * @see TaskConfig for more information on the configuration options
     */
    public constructor(config?: TaskConfig) {
        this.interval = readConfigValue('interval', config);
        this.stackType = readConfigValue('stackType', config);
        this.stackGroup = readConfigValue('stackGroup', config);

        const immediate = readConfigValue('immediate', config);
        this.ticksRemaining = immediate ? 0 : this.interval;
        this.breakTypes = readConfigValue('breakTypes', config);
        this.repeat = readConfigValue('repeat', config);
    }

    /**
     * The task's execution logic.
     *
     * Ensure that you call `super.execute()` if you override this method!
     *
     * TODO (jameskmonger) consider some kind of workaround to enforce a super call
     *              https://github.com/microsoft/TypeScript/issues/21388#issuecomment-360214959
     */
    public abstract execute(): void;

    /**
     * Whether this task breaks on the specified {@link TaskBreakType}.
     *
     * @param breakType the break type to check
     *
     * @returns true if the task breaks on the specified break type
     */
    public breaksOn(breakType: TaskBreakType): boolean {
        return this.breakTypes.includes(breakType);
    }

    /**
     * Stop the task from executing.
     *
     * @returns true if the task was stopped, false if the task was already stopped
     */
    public stop(): boolean {
        // can't stop a task that's already stopped
        if (!this._isActive) {
            return false;
        }

        this._isActive = false;

        if (this.onStop) {
            this.onStop();
        }

        return true;
    }

    /**
     * Tick the task, decrementing the number of ticks remaining.
     *
     * If the number of ticks remaining reaches zero, the task is executed.
     *
     * If the task is configured to repeat, the number of ticks remaining is reset to the interval.
     * Otherwise, the task is stopped.
     */
    public tick(): void {
        if (!this._isActive) {
            return;
        }

        this.ticksRemaining--;

        if (this.ticksRemaining <= 0) {
            // TODO maybe track and expose executionCount to this child function
            this.execute();

            // TODO should we allow the repeat count to be specified?
            if (this.repeat) {
                this.ticksRemaining = this.interval;
            } else {
                // TODO should I be calling a public function rather than setting the private variable?
                this.stop();
            }
        }
    }

    /**
     * Is the task active?
     */
    public get isActive(): boolean {
        return this._isActive;
    }
}
