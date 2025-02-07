# Queues

![Verified naming]

The queue system is used by both players and NPCs to queue the execution of a script in a central place with a predefined order of execution. Queues are often used for skilling that doesn't involve interacting with entities, or getting hit by something.

## Table of Contents
- [Player Queue](#player-queue)
    - [Queue Types](#queue-types)
    - [Processing](#processing)
    - [Long Queue](#long-queue)
    - [Known Uses](#known-uses)
    - [Example Scenarios](#example-scenarios)
- [NPC Queue](#npc-queue)
- [Area Queue](#area-queue)

## Player Queue

Contrary to popular belief, there is a single queue for players, excluding the [area queue](#area-queue) which will be covered below. All scripts, regardless of the queue type used, will go to the end of the same queue. There is no known cap for the number of scripts that may reside in the queue.

### Queue Types

There are four known queue types used for the player queue.

#### Weak
* Removed from the queue if there are any strong scripts in the queue prior to the queue being processed.
* Removed from the queue upon any interruptions, some of which are:
    * Interacting with an entity or clicking on a game square
    * Interacting with an item in your inventory
    * Unequipping an item
    * Opening an interface
    * Closing an interface
    * Dragging items in inventory
* In general, it seems like any action which closes an interface also clears all weak scripts from the queue.

#### Normal
* Skipped in the execution block if the player has a modal interface open at the time.

#### Strong
* Removes all weak scripts from the queue prior to being processed.
* Closes modal interface prior to executing.

#### Soft
* Cannot be paused or interrupted. It will always execute as long as the timer behind it is up.
* Closes modal interface prior to executing.

### Processing

*The processing block for player queue has undergone two large changes in 2021. The below explanation strictly only applies to the current version of the queue.*

The queue does not get processed if the player is under a delay. At the start of the processing block, the queue is iterated and checked for any strong scripts. If a strong script is in the queue, modal interface is closed before the processing begins. In addition to this, if a strong script exists in the queue, all weak scripts will be removed from the queue prior to the processing start.

The queue is processed in the exact order in which the scripts were added to it. The processing happens in an indefinite loop. The loop only exits if this condition becomes true:

* If all the scripts were skipped in the last loop. Meaning none of the scripts from the very first entry to the very last one were processed.

While going over the scripts, ones which are set to execute in the future are skipped. If there's a normal script being processed, it gets skipped if the player has a modal interface open. If a strong or soft script is processed, modal interface is forcibly closed prior to it processing. If any script sets a delay, processing further scripts cannot happen, and all scripts **except** for soft thereafter will be skipped. As mentioned above, soft scripts cannot be interrupted in any way, and will process even if the player is delayed. The script will be resumed when the delay ends at the start of the tick, although it will not continue processing any other scripts in the queue.

It should be noted that if a script queues another script, the earliest that the queued script may execute is the following server tick. However, even though it cannot execute, it will still be checked for in the processing loop. This can be observed through the strong scripts, which, if queued from within another script, will still be processed and as such will close the modal interface.

[Code examples and diagrams omitted for brevity]

### Long Queue

The long queue is a normal queue that comes with extra behaviour for how the script should be processed if the player attempts to log out before the script has been processed. The `longqueue` command consists of three primary arguments, along with any script-specific arguments:

* Script label
* Any arguments specific to the script itself (variable-size, can be blank)
* Delay until execution
* Behavioral type
    * There are two types:
        * Accelerate
            * Implies that on logout, the intended delay until the script is meant to execute is ignored, and the script will attempt to process each tick, as long as the rest of the conditions allow for it.
        * Discard
            * Implies that on logout, the script will just be discarded.

#### Use Case

There is only one confirmed use case of a long queue: `longqueue(my2arm_throneroom_resetcam,0,0,^discard);` The string in that command is the label of the script, followed by an argument for the `my2arm_throneroom_resetcam` script, followed by the delay until the script will be executed, and ending with the behavioral type of `^discard`, meaning the script will just be discarded if the player logs out.

### Known Uses

Below is a small list of known uses of queues, along with their types:

* Damage
    * Strong type
    * Delayed damage is included by this, so for example sending out a spell
    * Not all damage necessarily goes through the strong queue, some exceptions to this are:
        * Divine potions apply damage right in the item script, do not use any queues.
        * Some damage, although rather rare, will use the normal type instead. An example of this is recoil damage.

* Scrawled note
    * Normal type
    * Reading the notes opens the initial interface immediately in the script that handles the item click, but also queues a normal script to open the second interface, which is the dialogue behind it.

* Fletching
    * Weak type

* Changing window mode (e.g. going to resizable mode)
    * Soft type

[Example scenarios section omitted for brevity]

## NPC Queue

NPCs, like players, only have one queue. A difference between players and NPCs however is that while player queues can have four strengths, NPCs all only have one.

*This section is incomplete and will be expanded upon later.*

## Area Queue

Area queue is used strictly by players to execute various scripts, such as entering the multiway zones, unlocking music, or updating the state of farming patches.

*This section is incomplete and will be expanded upon later.*

---

*Copyright © 2021-2022 Kris. Distributed by an MIT license.*
