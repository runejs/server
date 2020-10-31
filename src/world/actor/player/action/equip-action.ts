import { Player } from '@server/world/actor/player/player';
import { Action, questFilter } from '@server/plugins/plugin';
import { basicNumberFilter, basicStringFilter } from '@server/plugins/plugin-loader';
import { World, world } from '@server/game-server';
import { ItemDetails } from '@server/world/config/item-data';

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

/**
 * A directory of all equipment plugins.
 */
let equipActions: EquipAction[] = [];

/**
 * Sets the list of equipment plugins.
 * @param actions The plugin list.
 */
export const setEquipActions = (actions: Action[]): void => {
    equipActions = actions as EquipAction[];
};

const actionHandler = (player: Player, itemId: number, equipType: EquipType): void => {
    let filteredActions = equipActions.filter(plugin => {
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

World.registerActionEventListener('equip_action', actionHandler);
