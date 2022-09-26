import { Task } from './task'
import { TaskStackType } from './types';
import { createMockTask } from './utils/_testing';

describe('Task', () => {
    // stacking mechanics are tested in the scheduler
    const stackType = TaskStackType.NEVER;
    const stackGroup = 'foo';
    const breakType = [];

    describe('when interval is 0', () => {
        const interval = 0;

        // no point setting this to true as the interval is 0
        const immediate = false;

        let executeMock: jest.Mock;
        let task: Task

        describe('and repeat is true', () => {
            const repeat = false;
            beforeEach(() => {
                ({ task, executeMock } = createMockTask(interval, stackType, stackGroup, immediate, breakType, repeat, ));
            });

            describe('when ticked once', () => {
                beforeEach(() => {
                    task.tick();
                });

                it('should execute twice', () => {
                    expect(executeMock).toHaveBeenCalled();
                });
            });

            describe('when ticked twice', () => {
                beforeEach(() => {
                    task.tick();
                    task.tick();
                });

                it('should execute twice', () => {
                    expect(executeMock).toHaveBeenCalledTimes(1);
                });
            });
        });

        describe('and repeat is false', () => {
            const repeat = false;
            beforeEach(() => {
                ({ task, executeMock } = createMockTask(interval, stackType, stackGroup, immediate, breakType, repeat));
            });

            describe('when ticked once', () => {
                beforeEach(() => {
                    task.tick();
                });

                it('should execute once', () => {
                    expect(executeMock).toHaveBeenCalledTimes(1);
                });
            });

            describe('when ticked twice', () => {
                beforeEach(() => {
                    task.tick();
                    task.tick();
                });

                it('should execute once', () => {
                    expect(executeMock).toHaveBeenCalledTimes(1);
                });
            });
        });
    });


    describe('when interval is 2', () => {
        const interval = 2;

        // not testing repeat here as it is tested above
        const repeat = false;

        let executeMock: jest.Mock;
        let task: Task

        describe('and immediate is true', () => {
            const immediate = true;

            beforeEach(() => {
                ({ task, executeMock } = createMockTask(interval, stackType, stackGroup, immediate, breakType, repeat));
            });

            describe('when ticked once', () => {
                beforeEach(() => {
                    task.tick();
                });

                it('should execute once', () => {
                    expect(executeMock).toHaveBeenCalledTimes(1);
                });
            });

            describe('when ticked twice', () => {
                beforeEach(() => {
                    task.tick();
                    task.tick();
                });

                // task will execute on ticks 1 and 3
                it('should execute once', () => {
                    expect(executeMock).toHaveBeenCalledTimes(1);
                });
            });
        });

        describe('and immediate is false', () => {
            const immediate = false;

            beforeEach(() => {
                ({ task, executeMock } = createMockTask(interval, stackType, stackGroup, immediate, breakType, repeat));
            });

            describe('when ticked once', () => {
                beforeEach(() => {
                    task.tick();
                });

                it('should not execute', () => {
                    expect(executeMock).toHaveBeenCalledTimes(0);
                });
            });

            describe('when ticked twice', () => {
                beforeEach(() => {
                    task.tick();
                    task.tick();
                });

                // task will execute on ticks 2 and 4
                it('should execute once', () => {
                    expect(executeMock).toHaveBeenCalledTimes(1);
                });
            });
        });
    });

    describe('when there is an onStop callback', () => {
        let task: Task;
        let onStopMock: jest.Mock;
        let executeMock: jest.Mock;

        beforeEach(() => {
            onStopMock = jest.fn();
            executeMock = jest.fn();
            task = new class extends Task {
                constructor() {
                    super();
                }

                public execute(): void {
                    executeMock();
                }

                public onStop(): void {
                    onStopMock();
                }
            }
        });

        describe('when the task is stopped', () => {
            beforeEach(() => {
                task.stop();
            });

            it('should call the onStop callback', () => {
                expect(onStopMock).toHaveBeenCalled();
            });

            it('should not call the execute callback', () => {
                expect(executeMock).not.toHaveBeenCalled();
            });

            describe('when the task is ticked', () => {
                beforeEach(() => {
                    task.tick();
                });

                it('should not call the onStop callback', () => {
                    expect(onStopMock).toHaveBeenCalledTimes(1);
                });

                it('should not call the execute callback', () => {
                    expect(executeMock).not.toHaveBeenCalled();
                });
            });

            describe('when the task is stopped again', () => {
                beforeEach(() => {
                    task.stop();
                });

                it('should not call the onStop callback', () => {
                    expect(onStopMock).toHaveBeenCalledTimes(1);
                });

                it('should not call the execute callback', () => {
                    expect(executeMock).not.toHaveBeenCalled();
                });
            });
        });
    });
});
