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

jkm progress notes below:

## Features

- Tick-based task scheduler :heavy_check_mark:
- Delay task :heavy_check_mark:
- Repeating task :heavy_check_mark:
- Schedule tasks on world :heavy_check_mark:
- Schedule tasks on players/npcs :heavy_check_mark:
- Task stacking :heavy_check_mark:
- Task breaking on walking :x:
- Task delay until arriving :x:

### Subtasks

- Actor task :yellow_square:
    - Handle break on move :x:
- Actor to actor interaction task :think: :x:
    - Handle walkto
    - Keep track of interaction distance and stop if exceeded
- Actor to world item interaction task :think: :x:
    - as above
- Actor to object interaction task :think: :x:
    - as above (maybe need some generic Actor to entity interaction task)

- world abstraction for spawnObject, removeObject, spawnItem

### Content

Migrate the below content to use task system
- Health regen :x:
- NPC movement :x:
- Firemaking :yellow_square:
    - logs in inventory :heavy_check_mark:
    - logs on ground :heavy_check_mark:
    - all log types :yellow_square:
- Woodcutting :x:
- Melee combat :x:
- Home teleport :x:

also don't forget

- Anything @gruckion is working on :yellow_square: :wink:
