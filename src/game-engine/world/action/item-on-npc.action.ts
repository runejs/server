import { Player } from '@engine/world/actor/player/player';
import { Position } from '@engine/world/position';
import { ActionHook, getActionHooks } from '@engine/world/action/hooks';
import { Item } from '@engine/world/items/item';
import { Npc } from '@engine/world/actor/npc/npc';
import { advancedNumberHookFilter, questHookFilter, stringHookFilter } from '@engine/world/action/hooks/hook-filters';
import { ActionPipe, RunnableHooks } from '@engine/world/action/index';


/**
 * Defines an item-on-npc action hook.
 */
export interface ItemOnNpcActionHook extends ActionHook<ItemOnNpcAction, itemOnNpcActionHandler> {
    // A single npc key or a list of npc keys that this action applies to.
    npcs: string | string[];
    // A single game item ID or a list of item IDs that this action applies to.
    itemIds: number | number[];
    // Whether or not the player needs to walk to this NPC before performing the action.
    walkTo: boolean;
}


/**
 * The item-on-npc action hook handler function to be called when the hook's conditions are met.
 */
export type itemOnNpcActionHandler = (itemOnNpcAction: ItemOnNpcAction) => void;


/**
 * Details about an item-on-npc action being performed.
 */
export interface ItemOnNpcAction {
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
 * The pipe that the game engine hands item-on-npc actions off to.
 * @param player
 * @param npc
 * @param position
 * @param item
 * @param itemWidgetId
 * @param itemContainerId
 */
const itemOnNpcActionPipe = (player: Player, npc: Npc, position: Position, item: Item,
    itemWidgetId: number, itemContainerId: number): RunnableHooks<ItemOnNpcAction> => {
    const morphedNpc = player.getMorphedNpcDetails(npc);

    // Find all item on npc action plugins that reference this npc and item
    let matchingHooks = getActionHooks<ItemOnNpcActionHook>('item_on_npc').filter(plugin =>
        questHookFilter(player, plugin) &&
        stringHookFilter(plugin.npcs, morphedNpc?.key || npc.key) && advancedNumberHookFilter(plugin.itemIds, item.itemId));
    const questActions = matchingHooks.filter(plugin => plugin.questRequirement !== undefined);

    if(questActions.length !== 0) {
        matchingHooks = questActions;
    }

    if(matchingHooks.length === 0) {
        player.outgoingPackets.chatboxMessage(`Unhandled item on npc interaction: ${ item.itemId } on ${ morphedNpc?.name || npc.name } ` +
            `(id-${ morphedNpc?.gameId || npc.id }) @ ${ position.x },${ position.y },${ position.level }`);
        if (morphedNpc) {
            player.outgoingPackets.chatboxMessage(`Note: (id-${morphedNpc.gameId}) is a morphed NPC. The parent NPC is (id-${npc.id}).`);
        }
        return null;
    }

    return {
        hooks: matchingHooks,
        actionPosition: position,
        action: {
            player,
            npc,
            position,
            item,
            itemWidgetId,
            itemContainerId
        }
    }
};


/**
 * Item-on-npc action pipe definition.
 */
export default [ 'item_on_npc', itemOnNpcActionPipe ] as ActionPipe;
