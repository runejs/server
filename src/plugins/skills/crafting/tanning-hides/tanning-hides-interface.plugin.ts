
import { NpcInteractionAction, npcInteractionActionHandler, NpcInteractionActionHook } from '@engine/world/action/npc-interaction.action';
import { widgets } from '@engine/config';
import { Skill } from '@engine/world/actor/skills';
import { TaskExecutor } from '@engine/world/action';
import { colors } from '@engine/util/colors';
import { findItem } from '@engine/config';
import { Item } from '@engine/world/items/item';
import { Player } from '@engine/world/actor/player/player';

import { widgetButtonIds, widgetModelSlots } from './tanning-hides-constants';

const openTanHidesInterface = (task: TaskExecutor<NpcInteractionAction>): void => {
    const { player } = task.getDetails();
    player.interfaceState.openWidget(widgets.tanningHidesInterface, {
        slot: 'screen'
    });
    loadTanHidesInterface(player);
}

const loadTanHidesInterface = (player: Player) => {
    widgetModelSlots.forEach((modelSlot) => {

        // Use the custom label or use the cache label for the item
        const hideName: string = modelSlot.item.output.label || findItem(modelSlot.item.output.itemId).name;
        player.outgoingPackets.setItemOnWidget(widgets.tanningHidesInterface, modelSlot.slotId, modelSlot.item.hideId, 250)

        player.modifyWidget(widgets.tanningHidesInterface, { childId: modelSlot.titleLabel, text: hideName, textColor: colors.red })
        player.modifyWidget(widgets.tanningHidesInterface, { childId: modelSlot.costLabel, text: `${modelSlot.item.cost} coins`, textColor: colors.red })

        if (hasResources(modelSlot.item.ingredients, modelSlot.item.cost, player)) {
            player.sendMessage('Enough resources')
            if (player.skills.hasLevel(Skill.CRAFTING,modelSlot.item.requiredLevel)) {
                player.modifyWidget(widgets.tanningHidesInterface, { childId: modelSlot.titleLabel, textColor: colors.cyan })
                player.modifyWidget(widgets.tanningHidesInterface, { childId: modelSlot.costLabel, textColor: colors.cyan })
            }
        }
    })
};

const hasResources = (resources: Item, cost: number, player: Player) => {
    const hideName: string = findItem(resources.itemId).name;
    
    if (!player.hasItemInInventory(resources)) {
        // player.sendMessage(`You don't have any ${hideName.toLowerCase()}s to tan.`);
        return false;
    } else if (!player.hasItemInInventory({ itemId: 995, amount: cost })) {
        // player.sendMessage(`You haven't got enough coins to pay for ${hideName.toLowerCase()}.`);
        return false;
    } else {
        return true;
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
        // {
        //     type: 'button',
        //     widgetId: widgets.tanningHidesInterface,
        //     buttonIds: Array.from(widgetButtonIds.keys()),
        //     handler: buttonClicked
        // }
    ]
};
