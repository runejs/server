/**
 * An enum to control the different stacking modes for tasks.
 *
 * @author jameskmonger
 */
export enum TaskStackType {
    /**
     * This task cannot be stacked with other tasks of the same stack group.
     */
    NEVER,

    /**
     * This task can be stacked with other tasks of the same stack group.
     */
    STACK,
}

/**
 * An enum to control the different stack groups for tasks.
 *
 * When a task has a stack type of `NEVER`, other tasks with the same stack group will be cancelled.
 *
 * @author jameskmonger
 */
export enum TaskStackGroup {
    /**
     * An action task undertaken by an actor.
     */
    ACTION = 'action',
}

/**
 * An enum to control the different breaking modes for tasks.
 *
 * @author jameskmonger
 */
export enum TaskBreakType {
    /**
     * This task gets stopped when the player moves
     */
    ON_MOVE,
}

/**
 * The configuration options for a Task.
 *
 * All options are optional as they have default values.
 *
 * @author jameskmonger
 */
export type TaskConfig = Partial<Readonly<{
    stackType: TaskStackType;
    stackGroup: string;
    breakTypes: TaskBreakType[];
    interval: number;
    immediate: boolean;
    repeat: boolean;
}>>;
