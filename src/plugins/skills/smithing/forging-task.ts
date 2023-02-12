import { ActorTask } from '@engine/task/impl';
import { widgets } from '@engine/config/config-handler';
import { Player, Skill } from '@engine/world/actor';
import { Smithable } from './forging-types';

/**
 * A task that handles the forging of an item.
 *
 * Operates repeatedly every 4 ticks, and stops when the player has forged the amount they wanted.
 */
export class ForgingTask extends ActorTask<Player> {
    private elapsedTicks = 0;
    private amountForged = 0;

    constructor(player: Player, private readonly smithable: Smithable, private readonly amount: number) {
        super(player);
    }

    public execute(): void {
        const taskIteration = this.elapsedTicks++;

        // completed the task if we've forged the amount we wanted
        if (this.amountForged >= this.amount) {
            this.stop();
            return;
        }

        // TODO (Jameskmonger) remove magic number
        this.actor.playAnimation(898);

        // only do something every 4 ticks
        if (taskIteration % 4 !== 0) {
            return;
        }

        // can't continue
        if (!this.hasMaterials()) {
            this.stop();
            // TODO (Jameskmonger) send message
            return;
        }

        // Remove ingredients
        for (let i = 0; i < this.smithable.ingredient.amount; i++) {
            this.actor.inventory.removeFirst(this.smithable.ingredient.itemId);
        }

        // Add item to inventory
        this.actor.inventory.add({
            itemId: this.smithable.item.itemId,
            amount: this.smithable.item.amount
        });

        this.actor.outgoingPackets.sendUpdateAllWidgetItems(widgets.inventory, this.actor.inventory);
        this.actor.skills.addExp(Skill.SMITHING, this.smithable.experience);

        this.amountForged++;
    }

    private hasMaterials() {
        return this.smithable.ingredient.amount <= this.actor.inventory.findAll(this.smithable.ingredient.itemId).length
    }
}
