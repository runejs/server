
import { NpcInteractionAction, NpcInteractionActionHook } from '@engine/world/action/npc-interaction.action';
import { ButtonAction, buttonActionHandler, ButtonActionHook } from '@engine/world/action/button.action';
import { widgets } from '@engine/config';
import { TaskExecutor } from '@engine/world/action';
import { colors } from '@engine/util/colors';
import { findItem } from '@engine/config';
import { Player } from '@engine/world/actor/player/player';

import { widgetButtonIds, widgetModelSlots, TanableHide } from './tanning-hides-constants';

/**
 * Opens the "Tan Hides" interface
 * @param task
 */
const openTanHidesInterface = (task: TaskExecutor<NpcInteractionAction>) => {
    const { player } = task.getDetails();
    
    player.interfaceState.openWidget(widgets.tanningHidesInterface, {
        slot: 'screen'
    });
    loadTanHidesInterface(player);
}

/**
 * Loads all the models and text on the interface
 * @param player
 */
const loadTanHidesInterface = (player: Player) => {
    widgetModelSlots.forEach((modelSlot) => {

        // Use the custom label or use the cache label for the item
        const hideName: string = modelSlot.item.output.label || findItem(modelSlot.item.output.itemId).name;
        player.outgoingPackets.setItemOnWidget(widgets.tanningHidesInterface, modelSlot.slotId, modelSlot.item.hideId, 250);

        // Set all label colors to red
        player.modifyWidget(widgets.tanningHidesInterface, { childId: modelSlot.titleLabel, text: hideName, textColor: colors.red });
        player.modifyWidget(widgets.tanningHidesInterface, { childId: modelSlot.costLabel, text: `${modelSlot.item.cost} coins`, textColor: colors.red });

        // Check & set the correct colors when requirements are met
        if (player.hasItemInInventory(modelSlot.item.ingredients) && player.hasEnoughCoins(modelSlot.item.cost)) {
            player.modifyWidget(widgets.tanningHidesInterface, { childId: modelSlot.titleLabel, textColor: colors.cyan });
            player.modifyWidget(widgets.tanningHidesInterface, { childId: modelSlot.costLabel, textColor: colors.cyan });
        }
    })
};

/**
 * Checks if you have enough resources to tan a hide.
 * @param task
 */
const canActivate = (task: TaskExecutor<ButtonAction>): boolean => {
    const { player, buttonId } = task.actionData;
    const hideToTan = widgetButtonIds.get(buttonId);
    const hideName: string = findItem(hideToTan.hide.hideId).name;

    if (!player.hasItemInInventory(hideToTan.hide.hideId)) {
        player.sendMessage(`You don't have any ${hideName.toLowerCase()}s to tan.`);
        return false;
    }

    if (!player.hasItemInInventory({ itemId: 995, amount: hideToTan.hide.cost })) {
        player.sendMessage(`You haven't got enough coins to pay for ${hideName.toLowerCase()}.`);
        return false;
    }

    player.interfaceState.closeAllSlots();

    return true;
}

/**
 * Tanks hides.
 * @param task
 */
const activate = (task: TaskExecutor<ButtonAction>): void => {
    const { player, buttonId } = task.actionData;
    const hideToTan = widgetButtonIds.get(buttonId);

    if (!hideToTan.shouldTakeInput) {
        tanHide(player, hideToTan.hide, hideToTan.count);
    } else {
        const numericInput = player.numericInputEvent.subscribe((amount) => {
            numericInput?.unsubscribe();
            tanHide(player, hideToTan.hide, amount);
        });

        player.outgoingPackets.showNumberInputDialogue();
    }

    player.sendMessage(`The tanner tans your ${findItem(hideToTan.hide.hideId).name.toLowerCase()}.`);
}

const tanHide = (player: Player, hide: TanableHide, amount: number): void => {
    let trueAmount = 0;

    if (amount === -1) {
        trueAmount = player.inventory.findAll(hide.hideId).length;
    } else {
        trueAmount = amount; 
    }

    for (let i = 0; i < trueAmount; i++) {
        if (!player.hasItemInInventory(hide.hideId)) break;
        player.removeFirstItem(hide.hideId);
        player.removeCoins(hide.cost);
        player.giveItem(hide.output.itemId);
    }
};

export default {
    pluginId: 'rs:tanning-hides-interface',
    hooks: [
        {
            type: 'npc_interaction',
            npcs: 'rs:tanner_ellis',
            options: 'trade',
            walkTo: true,
            task: {
                activate: openTanHidesInterface,
            }
        } as NpcInteractionActionHook,
        {
            type: 'button',
            widgetId: widgets.tanningHidesInterface,
            buttonIds: Array.from(widgetButtonIds.keys()),
            task: {
                canActivate,
                activate,
            }
        } as ButtonActionHook
    ]
};
