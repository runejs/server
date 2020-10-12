import { Player } from '@server/world/actor/player/player';
import { ActionPlugin, questFilter } from '@server/plugins/plugin';
import { basicNumberFilter, basicStringFilter } from '@server/plugins/plugin-loader';
import { world } from '@server/game-server';
import { ItemDetails } from '@server/world/config/item-data';

/**
 * The definition for an equip action function.
 */
export type equipAction = (details: EquipDetails) => void;

export type EquipType = 'EQUIP' | 'UNEQUIP';

/**
 * Details about an item being equipped/unequipped.
 */
export interface EquipDetails {
    // The player performing the action.
    player: Player;
    // The ID of the item being interacted with.
    itemId: number;
    // Additional details about the item.
    itemDetails: ItemDetails;
    // The option that the player used (ie "equip"  or "drop").
    equipType: EquipType;
}

/**
 * Defines an equipment change plugin.
 */
export interface EquipActionPlugin extends ActionPlugin {
    // A single game item ID or a list of item IDs that this action applies to.
    itemIds?: number | number[];
    // A single option name or a list of option names that this action applies to.
    equipType?: EquipType | EquipType[];
    // The action function to be performed.
    action: equipAction;
}

/**
 * A directory of all object interaction plugins.
 */
let equipInteractions: EquipActionPlugin[] = [];

/**
 * Sets the list of object interaction plugins.
 * @param plugins The plugin list.
 */
export const setEquipPlugins = (plugins: ActionPlugin[]): void => {
    equipInteractions = plugins as EquipActionPlugin[];
};

export const equipAction = (player: Player, itemId: number, equipType: EquipType): void => {

    // Find all object action plugins that reference this location object
    let equipActions = equipInteractions.filter(plugin => {
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

    const questActions = equipActions.filter(plugin => plugin.questAction !== undefined);

    if(questActions.length !== 0) {
        equipActions = questActions;
    }


    for(const plugin of equipActions) {
        plugin.action({
            player,
            itemId,
            itemDetails: world.itemData.get(itemId),
            equipType
        });
    }

};
