import { Player } from '@server/world/actor/player/player';
import { questFilter } from '@server/plugins/plugin';
import { basicNumberFilter, basicStringFilter } from '@server/plugins/plugin-loader';
import { getActionList, world } from '@server/game-server';
import { ItemDetails } from '@server/world/config/item-data';
import { Action } from '@server/world/action/action';

/**
 * The definition for an equip action function.
 */
export type equipAction = (equipActionData: EquipActionData) => void;

export type EquipType = 'EQUIP' | 'UNEQUIP';

/**
 * Details about an item being equipped/unequipped.
 */
export interface EquipActionData {
    // The player performing the action.
    player: Player;
    // The ID of the item being equipped/unequipped.
    itemId: number;
    // Additional details about the item.
    itemDetails: ItemDetails;
    // If the item was equipped or unequiped.
    equipType: EquipType;
}

/**
 * Defines an equipment change plugin.
 */
export interface EquipAction extends Action {
    // A single game item ID or a list of item IDs that this action applies to.
    itemIds?: number | number[];
    // A single option name or a list of option names that this action applies to.
    equipType?: EquipType | EquipType[];
    // The action function to be performed.
    action: equipAction;
}

const equipActionHandler = (player: Player, itemId: number, equipType: EquipType): void => {
    let filteredActions = getActionList('equip_action').filter(plugin => {
        if(!questFilter(player, plugin)) {
            return false;
        }

        if(plugin.itemIds !== undefined) {
            if(!basicNumberFilter(plugin.itemIds, itemId)) {
                return false;
            }
        }


        if(plugin.equipType !== undefined) {
            if(!basicStringFilter(plugin.equipType, equipType)) {
                return false;
            }
        }
        return true;
    });

    const questActions = filteredActions.filter(plugin => plugin.questRequirement !== undefined);

    if(questActions.length !== 0) {
        filteredActions = questActions;
    }


    for(const plugin of filteredActions) {
        plugin.action({
            player,
            itemId,
            itemDetails: world.itemData.get(itemId),
            equipType
        });
    }
};

export default {
    action: 'equip_action',
    handler: equipActionHandler
};