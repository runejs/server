import { ItemDetails } from '@engine/config';
import { ActorWorldItemInteractionTask } from '@engine/task/impl';
import { WorldItem } from '@engine/world';
import { Player } from '@engine/world/actor';
import { SpawnedItemInteractionHook } from '../spawned-item-interaction.action';

/**
* This is a task to migrate old `walkTo` item interaction actions to the new task system.
*
* This is a first-pass implementation to allow for removal of the old action system.
* It will be refactored in future to be more well suited to our plugin system.
*/
export class WalkToItemPluginTask extends ActorWorldItemInteractionTask<Player> {
    /**
     * The plugins to execute when the player arrives at the item.
     */
    private plugins: SpawnedItemInteractionHook[];

    /**
     * Details about the item
     */
    private itemDetails: ItemDetails;

    constructor(plugins: SpawnedItemInteractionHook[], player: Player, worldItem: WorldItem, itemDetails: ItemDetails) {
        super(
            player,
            worldItem
        );

        this.plugins = plugins;
        this.itemDetails = itemDetails;
    }

    /**
     * Executed every tick to check if the player has arrived yet and calls the plugins if so.
     */
    public execute(): void {
        // call super to manage waiting for the movement to complete
        super.execute();

        // check if the player has arrived yet
        const worldItem = this.worldItem;
        if (!worldItem) {
            return;
        }

        // call the relevant plugins
        this.plugins.forEach(plugin => {
            if (!plugin || !plugin.handler) {
                return;
            }

            plugin.handler({
                player: this.actor,
                worldItem: worldItem,
                itemDetails: this.itemDetails
            });
        });

        // this task only executes once, on arrival
        this.stop();
    }
}
