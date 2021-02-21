import { itemOnObjectAction } from '@server/world/action/item-on-object-action';
import { widgets } from '@server/config';
import { Skill } from '@server/world/actor/skills';
import { barIds, widgetItems } from '@server/plugins/skills/smithing/forging-constants';
import { itemIds } from '@server/world/config/item-ids';

const openForgingInterface : itemOnObjectAction = (details) => {

    const { player, item } = details;
    const amountInInventory = player.inventory.findAll(item).length;

    // The player does not have a hammer.
    if (!player.inventory.has(itemIds.hammer)) {
        player.sendMessage(`You need a hammer to work the metal with.`, true);
        return;
    }

    player.outgoingPackets.updateClientConfig(210, amountInInventory);
    player.outgoingPackets.updateClientConfig(211, player.skills.getLevel(Skill.SMITHING));

    details.player.interfaceState.openWidget(widgets.anvil.widgetId, {
        slot: 'screen'
    });

    widgetItems.get(item.itemId).forEach((items, containerId) => {
        items.forEach((smithable, index) => {
            player.outgoingPackets.sendUpdateSingleWidgetItem({
                widgetId: widgets.anvil.widgetId, containerId: containerId
            }, index, smithable.item);
        });
    });
};

export default [
    {
        type: 'item_on_object',
        itemIds: barIds,
        objectIds: [2783],
        options: ['use'],
        action:  openForgingInterface
    }
];
