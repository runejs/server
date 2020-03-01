import { Player } from '@server/world/actor/player/player';
import { Position } from '@server/world/position';
import { walkToAction } from '@server/world/actor/player/action/action';
import { pluginFilter } from '@server/plugins/plugin-loader';
import { logger } from '@runejs/logger/dist/logger';
import { ActionPlugin } from '@server/plugins/plugin';
import { Item } from '@server/world/items/item';
import { Npc } from '@server/world/actor/npc/npc';

/**
 * The definition for an item on npc action function.
 */
export type itemOnNpcAction = (details: ItemOnNpcActionDetails) => void;

/**
 * Details about an npc being interacted with. and the item being used.
 */
export interface ItemOnNpcActionDetails {
    player: Player;
    npc: Npc;
    position: Position;
    item: Item;
    itemWidgetId: number;
    itemContainerId: number;
}

/**
 * Defines an item on npc interaction plugin.
 * A list of npc ids that apply to the plugin, the items that can be performed on,
 * and whether or not the player must first walk to the npc.
 */
export interface ItemOnNpcActionPlugin extends ActionPlugin {
    npcsIds: number | number[];
    itemIds: number | number[];
    walkTo: boolean;
    action: itemOnNpcAction;
}

/**
 * A directory of all item on npc interaction plugins.
 */
let itemOnNpcInteractions: ItemOnNpcActionPlugin[] = [];

/**
 * Sets the list of item on npc interaction plugins.
 * @param plugins The plugin list.
 */
export const setItemOnNpcPlugins = (plugins: ActionPlugin[]): void => {
    itemOnNpcInteractions = plugins as ItemOnNpcActionPlugin[];
};

// @TODO priority and cancelling other (lower priority) actions
export const itemOnNpcAction = (player: Player, npc: Npc,
                                position: Position, item: Item, itemWidgetId: number, itemContainerId: number): void => {
    if (player.busy) {
        return;
    }

    // Find all item on npc action plugins that reference this landscape object
    let interactionPlugins = itemOnNpcInteractions.filter(plugin => pluginFilter(plugin.npcsIds, npc.id));

    // Find all item on npc action plugins that reference this item
    if (interactionPlugins.length !== 0) {
        interactionPlugins = interactionPlugins.filter(plugin => pluginFilter(plugin.itemIds, item.itemId));
    }

    if (interactionPlugins.length === 0) {
        player.outgoingPackets.chatboxMessage(`Unhandled item on npc interaction: ${item.itemId} on ${npc.name} ` +
            `(id-${npc.id}) @ ${position.x},${position.y},${position.level}`);
        return;
    }

    player.actionsCancelled.next();

    // Separate out walk-to actions from immediate actions
    const walkToPlugins = interactionPlugins.filter(plugin => plugin.walkTo);
    const immediatePlugins = interactionPlugins.filter(plugin => !plugin.walkTo);

    // Make sure we walk to the npc before running any of the walk-to plugins
    if (walkToPlugins.length !== 0) {
        walkToAction(player, position)
            .then(() => {
                player.face(position);

                walkToPlugins.forEach(plugin =>
                    plugin.action({
                        player,
                        npc,
                        position,
                        item,
                        itemWidgetId,
                        itemContainerId
                    }));
            })
            .catch(() => logger.warn(`Unable to complete walk-to action.`));
    }

    // Immediately run any non-walk-to plugins
    if (immediatePlugins.length !== 0) {
        immediatePlugins.forEach(plugin =>
            plugin.action({
                player,
                npc,
                position,
                item,
                itemWidgetId,
                itemContainerId
            }));
    }
};
