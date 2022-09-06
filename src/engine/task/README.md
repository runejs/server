# Task system

This is a tick-based task system which allows for extensions of the `Task` class to be executed.

Tasks can be executed after a delay, or immediately. They can also be set to repeat indefinitely or continue.

## Scheduling a task

You can schedule a task by registering it with the scheduler.

The task in the example of below runs with an interval of `2`, i.e. it will be executed every 2 ticks.

```ts
this.taskScheduler.addTask(new class extends Task {
    public constructor() {
        super({ interval: 2 });
    }

    public execute(): void {
        sendGlobalMessage('2 ticks');
    }
});
```

Every two times that `taskScheduler.tick()` is called, it will run the `execute` function of your task.

# Implementing this into RuneJS

## Task System

- Tick-based task scheduler :heavy_check_mark:
- Delay task :heavy_check_mark:
- Repeating task :heavy_check_mark:
- Schedule tasks on world :heavy_check_mark:
- Schedule tasks on players/npcs :heavy_check_mark:
- Task stacking :heavy_check_mark:
- Task breaking on walking :heavy_check_mark:
- Task delay until arriving :heavy_check_mark:

### Subtasks

#### Actor

- Actor task :heavy_check_mark:
    - Handle break on move :heavy_check_mark:
- Actor to actor interaction task :think: :x:
    - Handle walkto :x:
    - Keep track of interaction distance and stop if exceeded :x:
- Actor to world item interaction task :heavy_check_mark:
    - Handle walkto :heavy_check_mark:
    - Keep track of interaction distance and stop if exceeded :heavy_check_mark:
- Actor to object interaction task :think: :x:
    - (maybe need some generic Actor to entity interaction task)
    - Handle walkto :x:
    - Keep track of interaction distance and stop if exceeded :x:

#### World

- World task :yellow_square:
- Spawn game object task :x:
- Remove game object task :x:
- Spawn world item task :x:
- Remove world item task :x:

### Content

Highest priority is to convert pieces of content which make use of the old `task` system. These are:

- Magic attack :x:
- Magic teleports :x:
- Prayer :yellow_square:
    - ensure that one-tick pray flicking works. Speak to @jameskmonger if you want to implement this and need guidance
- Combat :x:
    - this one is quite broken and may not be so easy to port across
- Forging (smithing) :x:
- Woodcutting :yellow_square:
    - Time to cut :heavy_check_mark:
    - Replace tree with treestump :yellow_square:
    - Replace treestump with tree :yellow_square:

The following areas will make interesting use of the task system and would serve as a good demonstration:

- Health regen :x:
- NPC movement :x:
- Firemaking :yellow_square:
    - logs in inventory :heavy_check_mark:
    - logs on ground :heavy_check_mark:
    - all log types :yellow_square:
    - spawn ashes :x:

Also any content @gruckion is working on will be using the new Task system to aid with development of the API
