import { playerInteractionActionHandler } from '@engine/world/action/player-interaction.action';
import { widgets } from '@engine/config';
import { ItemContainer } from '@engine/world/items/item-container';

/*
    Trade Interface         335
    Trading confirmation    334
 */
export const handler : playerInteractionActionHandler = ({ player, otherPlayer }) => {

    const sourceContainer : ItemContainer = player.inventory;
    const targetContainer : ItemContainer = otherPlayer.inventory;

    // Open trading interface on target players screen.
    otherPlayer.interfaceState.openWidget(335, {
        slot: 'screen'
    });
    otherPlayer.modifyWidget(widgets.trading.firstStage.widgetId, {
        childId: widgets.trading.firstStage.titleId,
        text: 'Trading With: ' + player.username
    });

    otherPlayer.outgoingPackets.sendUpdateAllWidgetItems({ widgetId: widgets.trading.firstStage.widgetId, containerId: widgets.trading.firstStage.source.containerId }, targetContainer);
    otherPlayer.outgoingPackets.sendUpdateAllWidgetItems({ widgetId: widgets.trading.firstStage.widgetId, containerId: widgets.trading.firstStage.target.containerId }, sourceContainer);
    player.outgoingPackets.sendUpdateAllWidgetItems({ widgetId: widgets.trading.firstStage.widgetId, containerId: widgets.trading.firstStage.source.containerId }, sourceContainer);
    player.outgoingPackets.sendUpdateAllWidgetItems({ widgetId: widgets.trading.firstStage.widgetId, containerId: widgets.trading.firstStage.target.containerId }, targetContainer);
    // Open trading interface on source player screen.
    player.interfaceState.openWidget(335, {
        slot: 'screen'
    });
    player.modifyWidget(widgets.trading.firstStage.widgetId, {
        childId: widgets.trading.firstStage.titleId,
        text: 'Trading With: ' + otherPlayer.username
    });


};

export default {
    pluginId: 'rs:trading',
    hooks: [
        {
            options: 'trade',
            type: 'player_interaction',
            handler
        }
    ]
}
