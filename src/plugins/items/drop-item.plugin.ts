import { itemInteractionActionHandler } from '@engine/action';
import { soundIds } from '@engine/world/config/sound-ids';
import { getItemFromContainer } from '@engine/world/items/item-container';
import { serverConfig } from '@server/game/game-server';
import { Rights } from '@engine/world/actor/player/player';
import { widgets } from '@engine/config/config-handler';
import { dialogue, execute } from '@engine/world/actor/dialogue';


export const handler: itemInteractionActionHandler = ({ player, itemId, itemSlot }) => {
    const inventory = player.inventory;
    const item = getItemFromContainer(itemId, itemSlot, inventory);

    if(!item) {
        // The specified item was not found in the specified slot.
        return;
    }

    if(!serverConfig.adminDropsEnabled && player.rights === Rights.ADMIN) {
        dialogue([ player ], [
            text => ('Administrators are not allowed to drop items.'),
            options => [
                `Destroy the item!`, [
                    execute(() => {
                        inventory.remove(itemSlot);
                        player.outgoingPackets.sendUpdateSingleWidgetItem(widgets.inventory, itemSlot, null);
                    }),
                ],
                `Bank the item!`, [
                    execute(() => {
                        inventory.remove(itemSlot);
                        player.bank.add(item);
                        player.outgoingPackets.sendUpdateSingleWidgetItem(widgets.inventory, itemSlot, null);
                    }),
                ]
            ]
        ]);

        return;
    }

    inventory.remove(itemSlot);
    player.outgoingPackets.sendUpdateSingleWidgetItem(widgets.inventory, itemSlot, null);
    player.playSound(soundIds.dropItem, 5);
    player.instance.spawnWorldItem(item, player.position, { owner: player, expires: 300 });
    player.actionsCancelled.next(null);
};

export default {
    pluginId: 'rs:drop_item',
    hooks: [
        {
            type: 'item_interaction',
            widgets: widgets.inventory,
            options: 'drop',
            handler,
            cancelOtherActions: false
        }
    ]
};
