import { ActorWorldItemInteractionTask } from '@engine/task/impl';
import { WorldItem } from '@engine/world';
import { Player } from '@engine/world/actor';
import { animationIds, soundIds } from '@engine/world/config';
import { canLight } from './chance';
import { FIREMAKING_LOGS } from './data';
import { lightFire } from './light-fire';
import { Burnable } from './types';

/**
 * A firemaking task on a {@link WorldItem} log.
 *
 * This task extends {@link ActorWorldItemInteractionTask} which is a task that
 * handles the interaction between an {@link Actor} and a {@link WorldItem}.
 *
 * The {@link ActorWalkToTask} (which our parent class extends) automatically
 * sets a {@link TaskBreakType} of {@link TaskBreakType.ON_MOVE} which will
 * cancel this task if the player clicks to move.
 *
 * By default, the {@link ActorWalkToTask} also sets a {@link TaskStackType} of
 * {@link TaskStackType.NEVER} and a {@link TaskStackGroup} of {@link TaskStackGroup.ACTION}
 * which means that this other actions will cancel the firemaking attempts.
 *
 * @author jameskmonger
 */
class FiremakingTask extends ActorWorldItemInteractionTask<Player> {
    private skillInfo: Burnable;
    private elapsedTicks = 0;
    private canLightFire = false;

    /**
     * Create a new firemaking task.
     *
     * @param player The player that is attempting to light the fire.
     * @param logWorldItem The world item that represents the log.
     */
    constructor(
        player: Player,
        logWorldItem: WorldItem
    ) {
        super(player, logWorldItem);

        this.skillInfo = FIREMAKING_LOGS.find(l => l.logItem.gameId === logWorldItem.itemId);

        if (!this.skillInfo) {
            throw new Error(`Invalid firemaking log item id: ${logWorldItem.itemId}`);
        }
    }

    /**
     * Execute the main firemaking task loop. This method is called every game tick until the task is completed.
     *
     * As this task extends {@link ActorWorldItemInteractionTask}, it's important that the
     * {@link super.execute} method is called at the start of this method.
     *
     * The base `execute` performs a number of checks that allow this task to function healthily.
     */
    public execute() {
        super.execute();

        /**
         * As this task extends {@link ActorWorldItemInteractionTask}, the base classes {@link ActorWorldItemInteractionTask["worldItem"]}
         * property will be null if the item isn't valid anymore or the player isn't in the right position.
         *
         * Therefore if `worldItem` is null, we can return early here, as our player is likely walking to the task.
         */
        if (!this.worldItem) {
            return;
        }

        // store the tick count before incrementing so we don't need to keep track of it in all the separate branches
        const tickCount = this.elapsedTicks++;

        if (this.canLightFire) {
            if (tickCount === 2) {
                lightFire(this.actor, this.actor.position, this.worldItem, this.skillInfo.experienceGained);
                this.stop();
            }

            // the rest of the function is for *attempting* to light the fire
            // so we can return early here
            return;
        }

        // play animation every 12 ticks
        if (tickCount % 12 === 0) {
            this.actor.playAnimation(animationIds.lightingFire);
        }

        // TODO (jameskmonger) reconsider this, is there a minimum tick count?
        //              OSRS wiki implies that there isn't
        //              https://oldschool.runescape.wiki/w/Firemaking#Success_chance
        const passedMinimumThreshold = tickCount > 10;
        this.canLightFire = passedMinimumThreshold && canLight(this.skillInfo.requiredLevel, this.actor.skills.firemaking.level);

        // if we can now light the fire, reset the timer so that on the next tick we can begin lighting the fire
        if (this.canLightFire) {
            this.elapsedTicks = 0;
            this.actor.metadata.busy = true;
            this.actor.playSound(soundIds.fireLit, 7);

            return;
        }

        // play lighting sound every 4th tick
        if (tickCount % 4 === 0) {
            this.actor.playSound(soundIds.lightingFire, 10, 0);
        }
    }
}

export function runFiremakingTask(player: Player, worldItemLog: WorldItem) {
    player.enqueueTask(FiremakingTask, [ worldItemLog ]);
}
