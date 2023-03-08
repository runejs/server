import { Task } from '../task';
import { TaskBreakType, TaskStackGroup, TaskStackType } from '../types';

export function createMockTask(
    interval: number = 0,
    stackType: TaskStackType = TaskStackType.STACK,
    stackGroup: string = TaskStackGroup.ACTION,
    immediate: boolean = false,
    breakTypes: TaskBreakType[] = [],
    repeat: boolean = true
){
    const executeMock = jest.fn();
    const task = new class extends Task {
        constructor() {
            super({
                interval,
                stackType,
                stackGroup,
                immediate,
                breakTypes,
                repeat
            });
        }

        public execute(): void {
            executeMock();
        }
    }

    return { task, executeMock }
}
