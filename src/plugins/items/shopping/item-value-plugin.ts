import { itemAction } from '@server/world/actor/player/action/item-action';
import { widgets } from '@server/world/config/widget';
import { ActionType, RunePlugin } from '@server/plugins/plugin';
import { world } from '@server/game-server';

export const shopSellValueAction: itemAction = (details) => {
    const { player, itemId } = details;

    const item = world.itemData.get(itemId);

    if(!item) {
        return;
    }

    const itemValue = item.value || 1;

    player.outgoingPackets.chatboxMessage(`${item.name}: currently costs ${itemValue} coins.`);
};

export const shopPurchaseValueAction: itemAction = (details) => {
    const { player } = details;

    player.outgoingPackets.chatboxMessage(`Shop purchase value is TBD`);
};

export default new RunePlugin([{
    type: ActionType.ITEM_ACTION,
    widgets: widgets.shop,
    options: 'value',
    action: shopSellValueAction,
    cancelOtherActions: false
}, {
    type: ActionType.ITEM_ACTION,
    widgets: widgets.shopPlayerInventory,
    options: 'value',
    action: shopPurchaseValueAction,
    cancelOtherActions: false
}]);
