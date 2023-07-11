import { ActorTask } from '@engine/task/impl';
import { findItem } from '@engine/config/config-handler';
import { Player, Skill } from '@engine/world/actor';
import { Smeltable } from './smelting-types';
import { animationIds, soundIds } from '@engine/world/config';

/**
 * A task that handles the smelting of an item.
 *
 * Operates repeatedly every 3 ticks, and stops when the player has smelted the amount they wanted.
 *
 * @author jameskmonger
 */
export class SmeltingTask extends ActorTask<Player> {
    private elapsedTicks = 0;
    private amountSmelted = 0

    constructor(player: Player, private readonly smeltable: Smeltable, private readonly amount: number) {
        super(player);
    }

    public execute(): void {
        const taskIteration = this.elapsedTicks++;

        // completed the task if we've smelted the amount we wanted
        if (this.amountSmelted >= this.amount) {
            this.stop();
            return;
        }

        const bar = this.smeltable.bar;
        const barItem = findItem(bar.barId);

        if (!barItem) {
            this.actor.sendMessage(`Could not find item with id ${bar.barId}. Please tell a dev.`);
            this.stop();
            return;
        }

        if (!this.hasMaterials()) {
            this.actor.sendMessage(`You don't have enough ${barItem.name.toLowerCase()}.`, true);
            this.stop();
            return;
        }

        if (!this.hasLevel()) {
            this.actor.sendMessage(`You need a smithing level of ${bar.requiredLevel} to smelt ${barItem.name.toLowerCase()}s.`, true);
            return;
        }

        // Smelting takes 3 ticks for each item
        if (taskIteration % 3 !== 0) {
            return;
        }

        bar.ingredients.forEach((item) => {
            for (let i = 0; i < item.amount; i++) {
                this.actor.removeFirstItem(item.itemId);
            }
        });

        this.actor.giveItem(bar.barId);
        this.actor.skills.addExp(Skill.SMITHING, bar.experience);
        this.amountSmelted++;

        this.actor.playAnimation(animationIds.smelting);
        this.actor.outgoingPackets.playSound(soundIds.smelting, 5);
    }

    /**
     * Whether the player has the required materials to smelt the item.
     * @returns {boolean} True if the player has the required materials, false otherwise.
     */
    private hasMaterials() {
        return this.smeltable.bar.ingredients.every((item) => {
            const itemIndex = this.actor.inventory.findIndex(item);
            if (itemIndex === -1 || this.actor.inventory.amountInStack(itemIndex) < item.amount) {
                return false;
            }

            return true;
        });
    }

    /**
     * Whether the player has the required level to smelt the item.
     * @returns {boolean} True if the player has the required level, false otherwise.
     */
    private hasLevel() {
        return this.actor.skills.hasLevel(Skill.SMITHING, this.smeltable.bar.requiredLevel);
    }
}
