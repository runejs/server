import { Queue } from '@engine/util/queue';
import { Task } from './task';
import { TaskStackType } from './types';

/**
 * A class that ticks tasks in a queue, and removes them when they are no longer active.
 *
 * @author jameskmonger
 */
export class TaskScheduler {
    /**
     * A queue of tasks that are waiting to be added to the running list.
     */
    private pendingTasks = new Queue<Task>();

    /**
     * The list of tasks that are currently running.
     */
    private runningTasks: Task[] = [];

    /**
     * Register any pending tasks, and tick any running tasks.
     */
    public tick(): void {
        // Add any pending tasks to the running list
        while(this.pendingTasks.isNotEmpty) {
            const task = this.pendingTasks.dequeue();

            if (!task || !task.isActive) {
                continue;
            }

            this.runningTasks.push(task);
        }

        // Use an iterator so that we can remove tasks from the list while iterating
        for(const [index, task] of this.runningTasks.entries()) {
            if (!task) {
                continue;
            }

            task.tick();

            if (!task.isActive) {
                this.runningTasks.splice(index, 1);
            }
        }
    }

    /**
     * Add a task to the end of the pending queue.
     *
     * If the task has a stack type of `NEVER`, any other tasks in the scheduler
     * with the same stack group will be stopped.
     *
     * @param task The task to add.
     */
    public enqueue(task: Task): void {
        if (!task.isActive) {
            return;
        }

        // if the task can't stack with others of a similar type, we need to stop them
        if (task.stackType === TaskStackType.NEVER) {
            // Use an iterator so that we can remove tasks from the list while iterating
            for(const [index, otherTask] of this.runningTasks.entries()) {
                if (!otherTask) {
                    continue;
                }

                if (otherTask.stackGroup === task.stackGroup) {
                    otherTask.stop();
                    this.runningTasks.splice(index, 1);
                }
            }

            for(const otherTask of this.pendingTasks.items) {
                if (!otherTask) {
                    continue;
                }

                if (otherTask.stackGroup === task.stackGroup) {
                    otherTask.stop();
                }
            }
        }

        this.pendingTasks.enqueue(task);
    }

    /**
     * Clear all tasks from the scheduler.
     */
    public clear(): void {
        this.pendingTasks.clear();
        this.runningTasks = [];
    }
}
