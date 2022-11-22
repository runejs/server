import { Task } from './task';
import { TaskScheduler } from './task-scheduler';
import { TaskStackType } from './types';
import { createMockTask } from './utils/_testing';

describe('TaskScheduler', () => {
    let taskScheduler: TaskScheduler;
    beforeEach(() => {
        taskScheduler = new TaskScheduler();
    });

    describe('when enqueueing a task', () => {
        let executeMock: jest.Mock;
        let task: Task
        beforeEach(() => {
            ({ task, executeMock } = createMockTask());
        });

        it('should add the task to the running list when ticked', () => {
            taskScheduler.enqueue(task);
            taskScheduler.tick();
            expect(executeMock).toHaveBeenCalled();
        });

        it('should not add the task to the running list until the next tick', () => {
            taskScheduler.enqueue(task);
            expect(executeMock).not.toHaveBeenCalled();
        });

        describe('when ticked multiple times', () => {
            beforeEach(() => {
                taskScheduler.enqueue(task);
                taskScheduler.tick();
                taskScheduler.tick();
            });

            it('should tick the task twice', () => {
                expect(executeMock).toHaveBeenCalledTimes(2);
            });
        });

        describe('when the task is stopped', () => {
            beforeEach(() => {
                taskScheduler.enqueue(task);
                taskScheduler.tick();
            });

            it('should not tick the task after stopping', () => {
                task.stop();
                taskScheduler.tick();
                expect(executeMock).toHaveBeenCalledTimes(1);
            });
        });
    });

    describe('when enqueueing a task that cannot stack', () => {
        const interval = 0;
        const stackType = TaskStackType.NEVER;
        const stackGroup = 'foo';

        let firstExecuteMock: jest.Mock;
        let firstTask: Task
        beforeEach(() => {
            ({ task: firstTask, executeMock: firstExecuteMock } = createMockTask(interval, stackType, stackGroup));
        });

        it('should stop any other tasks with the same stack group', () => {
            const { task: secondTask, executeMock: secondExecuteMock } = createMockTask(interval, stackType, stackGroup);

            taskScheduler.enqueue(firstTask);
            taskScheduler.enqueue(secondTask);
            taskScheduler.tick();

            expect(firstExecuteMock).not.toHaveBeenCalled();
            expect(secondExecuteMock).toHaveBeenCalled();
        });

        it('should not stop any other tasks with a different stack group', () => {
            const otherStackGroup = 'bar';
            const { task: secondTask, executeMock: secondExecuteMock } = createMockTask(interval, stackType, otherStackGroup);

            taskScheduler.enqueue(firstTask);
            taskScheduler.enqueue(secondTask);
            taskScheduler.tick();

            expect(firstExecuteMock).toHaveBeenCalled();
            expect(secondExecuteMock).toHaveBeenCalled();
        });
    });

    describe('when clearing the scheduler', () => {
        let executeMock: jest.Mock;
        let task: Task
        beforeEach(() => {
            ({ task, executeMock } = createMockTask());
        });

        it('should stop all tasks', () => {
            taskScheduler.enqueue(task);
            taskScheduler.tick();
            taskScheduler.clear();
            taskScheduler.tick();
            expect(executeMock).toHaveBeenCalledTimes(1);
        });
    });
});
