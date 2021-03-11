import { Player } from '@engine/world/actor/player/player';
import { ActionHook, getActionHooks } from '@engine/world/action/hooks';
import { findItem } from '@engine/config';
import { EquipmentSlot, ItemDetails } from '@engine/config/item-config';
import { numberHookFilter, stringHookFilter, questHookFilter } from '@engine/world/action/hooks/hook-filters';
import { ActionPipe } from '@engine/world/action/index';


/**
 * Defines an equipment change action hook.
 */
export interface EquipActionHook extends ActionHook<equipActionHandler> {
    // A single game item ID or a list of item IDs that this action applies to.
    itemIds?: number | number[];
    // A single option name or a list of option names that this action applies to.
    equipType?: EquipType | EquipType[];
}


/**
 * The definition for an equip action function.
 */
export type equipActionHandler = (equipAction: EquipAction) => void;


/**
 * Equipment action types.
 */
export type EquipType = 'EQUIP' | 'UNEQUIP';


/**
 * Details about an item being equipped/unequipped.
 */
export interface EquipAction {
    // The player performing the action.
    player: Player;
    // The ID of the item being equipped/unequipped.
    itemId: number;
    // Additional details about the item.
    itemDetails: ItemDetails;
    // If the item was equipped or unequiped.
    equipType: EquipType;
    // The equipment slot.
    equipmentSlot: EquipmentSlot;
}


/**
 * The pipe that the game engine hands equipment actions off to.
 * @param player
 * @param itemId
 * @param equipType
 * @param slot
 */
const equipActionPipe = (player: Player, itemId: number, equipType: EquipType, slot: EquipmentSlot): void => {
    let filteredActions = getActionHooks<EquipActionHook>('equip_action', equipActionHook => {
        if(!questHookFilter(player, equipActionHook)) {
            return false;
        }

        if(equipActionHook.itemIds !== undefined) {
            if(!numberHookFilter(equipActionHook.itemIds, itemId)) {
                return false;
            }
        }


        if(equipActionHook.equipType !== undefined) {
            if(!stringHookFilter(equipActionHook.equipType, equipType)) {
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
        plugin.handler({
            player,
            itemId,
            itemDetails: findItem(itemId),
            equipType,
            equipmentSlot: slot
        });
    }
};


/**
 * Equip action pipe definition.
 */
export default [
    'equip_action',
    equipActionPipe
] as ActionPipe;
