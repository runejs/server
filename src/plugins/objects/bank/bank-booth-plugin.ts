import { ActionType, RunePlugin } from '@server/plugins/plugin';
import { objectIds } from '@server/world/config/object-ids';
import { widgets } from '@server/world/config/widget';
import { objectAction } from '@server/world/actor/player/action/object-action';


export const openBankInterface: objectAction = (details) => {
    details.player.activeWidget = {
        widgetId: widgets.bank.screenWidget,
        secondaryWidgetId: widgets.bank.tabWidget.widgetId,
        type: 'SCREEN_AND_TAB',
        closeOnWalk: true
    };
    details.player.outgoingPackets.sendUpdateAllWidgetItems(widgets.bank.tabWidget, details.player.inventory);

};

export const depositItem: objectAction = (details) => {
    // Check if player might be spawning widget clientside
    if (!details.player.activeWidget ||
        !(details.player.activeWidget.widgetId === widgets.bank.screenWidget) ||
        !(details.player.activeWidget.secondaryWidgetId === widgets.bank.tabWidget.widgetId)) {
        return;
    }

};

export default new RunePlugin([{
    type: ActionType.OBJECT_ACTION,
    objectIds: objectIds.bankBooth,
    options: ['use-quickly'],
    walkTo: true,
    action: openBankInterface
}, {
    type: ActionType.ITEM_ACTION,
    widgets: widgets.bank.tabWidget,
    options: ['deposit-1', 'deposit-5', 'deposit-10'],
    action: depositItem,
}]);
