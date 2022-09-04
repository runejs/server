# Task system

This is a tick-based task system which allows for extensions of the `Task` class to be executed.

Tasks can be executed after a delay, or immediately. They can also be set to repeat indefinitely or continue.

## Scheduling a task

You can schedule a task by registering it with the scheduler.

The task in the example of below runs with an interval of `2`, i.e. it will be executed every 2 ticks.

```ts
this.taskScheduler.addTask(new class extends Task {
    public constructor() {
        super(2);
    }

    public execute(): void {
        sendGlobalMessage('2 ticks');
    }
});
```

Every two times that `taskScheduler.tick()` is called, it will run the `execute` function of your task.
