import { buttonActionHandler } from '@engine/action/pipe/button.action';
import { Player } from '@engine/world/actor/player/player';
import { widgets } from '@engine/config/config-handler';

export const handler: buttonActionHandler = (details) => {
    const { player } = details;

    player.updateBonuses();
    player.syncBonuses();

    player.outgoingPackets.sendUpdateAllWidgetItems(widgets.equipmentStats, player.equipment);
    player.outgoingPackets.sendUpdateAllWidgetItems(widgets.inventory, player.inventory);

    player.interfaceState.openWidget(widgets.equipmentStats.widgetId, {
        multi: true,
        slot: 'screen'
    });
    player.interfaceState.openWidget(widgets.inventory.widgetId, {
        multi: true,
        slot: 'tabarea'
    });
};

export default {
    pluginId: 'rs:equipment_stat_view',
    hooks: [
        { type: 'button', widgetId: widgets.equipment.widgetId, buttonIds: 24, handler }
    ]
};
