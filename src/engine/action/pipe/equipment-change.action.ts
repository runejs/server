import { Player } from '@engine/world/actor';
import { findItem, EquipmentSlot, ItemDetails } from '@engine/config';
import {
    ActionHook, getActionHooks, numberHookFilter, stringHookFilter, questHookFilter, ActionPipe, RunnableHooks
} from '@engine/action';
import { logger } from '@runejs/common';


/**
 * Defines an equipment change action hook.
 */
export interface EquipmentChangeActionHook extends ActionHook<EquipmentChangeAction, equipmentChangeActionHandler> {
    // A single game item ID or a list of item IDs that this action applies to.
    itemIds?: number | number[];
    // A single option name or a list of option names that this action applies to.
    eventType?: EquipmentChangeType | EquipmentChangeType[];
}


/**
 * The definition for an equip action function.
 */
export type equipmentChangeActionHandler = (equipmentChangeAction: EquipmentChangeAction) => void;


/**
 * Equipment action types.
 */
export type EquipmentChangeType = 'equip' | 'unequip';


/**
 * Details about an item being equipped/unequipped.
 */
export interface EquipmentChangeAction {
    // The player performing the action.
    player: Player;
    // The ID of the item being equipped/unequipped.
    itemId: number;
    // Additional details about the item.
    itemDetails: ItemDetails;
    // If the item was equipped or unequipped.
    eventType: EquipmentChangeType;
    // The equipment slot.
    equipmentSlot: EquipmentSlot;
}


/**
 * The pipe that the game engine hands equipment actions off to.
 * @param player
 * @param itemId
 * @param eventType
 * @param slot
 */
const equipmentChangeActionPipe = (player: Player, itemId: number,
                                   eventType: EquipmentChangeType, slot: EquipmentSlot): RunnableHooks<EquipmentChangeAction> | null => {
    let matchingHooks = getActionHooks<EquipmentChangeActionHook>('equipment_change', equipActionHook => {
        if(!questHookFilter(player, equipActionHook)) {
            return false;
        }

        if(equipActionHook.itemIds !== undefined) {
            if(!numberHookFilter(equipActionHook.itemIds, itemId)) {
                return false;
            }
        }


        if(equipActionHook.eventType !== undefined) {
            if(!stringHookFilter(equipActionHook.eventType, eventType)) {
                return false;
            }
        }
        return true;
    });

    const questActions = matchingHooks.filter(plugin => plugin.questRequirement !== undefined);

    if(questActions.length !== 0) {
        matchingHooks = questActions;
    }

    if(!matchingHooks || matchingHooks.length === 0) {
        return null;
    }

    const itemDetails = findItem(itemId);

    if(!itemDetails) {
        logger.error(`Item ${itemId} not registered on the server [equipment-change action pipe]`);
        return null;
    }

    return {
        hooks: matchingHooks,
        action: {
            player,
            itemId,
            itemDetails,
            eventType,
            equipmentSlot: slot
        }
    };
};


/**
 * Equip action pipe definition.
 */
export default [ 'equipment_change', equipmentChangeActionPipe ] as ActionPipe;
