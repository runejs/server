import { ItemOnItemAction, ItemOnItemActionHook, TaskExecutor } from '@engine/action';
import { Player } from '@engine/world/actor';
import { widgets } from '@engine/config';


const openLeatherArmourCraftingInterface = (task: TaskExecutor<ItemOnItemAction>) => {
    console.log(`[TASK] Executing func`);
    const { player, actionData } = task.getDetails();

    player.sendMessage('Opening interface');

    player.interfaceState.openWidget(widgets.tanningHidesInterface, {
        slot: 'screen'
    });

    loadLeatherArmourCraftingInterface(player);
};

const loadLeatherArmourCraftingInterface = (player: Player) => {
    // player.sendMessage('Opening interface')
};

export default {
    pluginId: 'rs:leather-armour-interface',
    hooks: [
        {
            type: 'item_on_item',
            items: [{ item1: 1733, item2: 1741 }, { item1: 1733, item2: 1743 }],
            task: {
                activate: openLeatherArmourCraftingInterface,
            }
        } as ItemOnItemActionHook,
    ]
};
