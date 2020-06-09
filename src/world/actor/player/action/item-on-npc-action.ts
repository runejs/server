import { Player } from '@server/world/actor/player/player';
import { Position } from '@server/world/position';
import { walkToAction } from '@server/world/actor/player/action/action';
import { pluginFilter } from '@server/plugins/plugin-loader';
import { logger } from '@runejs/logger';
import { ActionPlugin, questFilter } from '@server/plugins/plugin';
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
    // The player performing the action.
    player: Player;
    // The NPC the action is being performed on.
    npc: Npc;
    // The position that the NPC was at when the action was initiated.
    position: Position;
    // The item being used.
    item: Item;
    // The ID of the UI widget that the item being used is in.
    itemWidgetId: number;
    // The ID of the UI container that the item being used is in.
    itemContainerId: number;
}

/**
 * Defines an item on npc interaction plugin.
 * A list of npc ids that apply to the plugin, the items that can be performed on,
 * and whether or not the player must first walk to the npc.
 */
export interface ItemOnNpcActionPlugin extends ActionPlugin {
    // A single NPC ID or a list of NPC IDs that this action applies to.
    npcsIds: number | number[];
    // A single game item ID or a list of item IDs that this action applies to.
    itemIds: number | number[];
    // Whether or not the player needs to walk to this NPC before performing the action.
    walkTo: boolean;
    // The action function to be performed.
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
    if(player.busy) {
        return;
    }

    // Find all item on npc action plugins that reference this npc and item
    let interactionActions = itemOnNpcInteractions.filter(plugin =>
        questFilter(player, plugin) &&
        pluginFilter(plugin.npcsIds, npc.id) && pluginFilter(plugin.itemIds, item.itemId));
    const questActions = interactionActions.filter(plugin => plugin.questAction !== undefined);

    if(questActions.length !== 0) {
        interactionActions = questActions;
    }

    if(interactionActions.length === 0) {
        player.outgoingPackets.chatboxMessage(`Unhandled item on npc interaction: ${ item.itemId } on ${ npc.name } ` +
            `(id-${ npc.id }) @ ${ position.x },${ position.y },${ position.level }`);
        return;
    }

    player.actionsCancelled.next();

    // Separate out walk-to actions from immediate actions
    const walkToPlugins = interactionActions.filter(plugin => plugin.walkTo);
    const immediatePlugins = interactionActions.filter(plugin => !plugin.walkTo);

    // Make sure we walk to the npc before running any of the walk-to plugins
    if(walkToPlugins.length !== 0) {
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
    for(const plugin of immediatePlugins) {
        plugin.action({
            player,
            npc,
            position,
            item,
            itemWidgetId,
            itemContainerId
        });
    }
};
