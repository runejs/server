import { buttonAction } from '@server/world/actor/player/action/button-action';
import { ActionType, RunePlugin } from '@server/plugins/plugin';
import { widgets } from '@server/world/config/widget';
import { Player } from '@server/world/actor/player/player';

export function updateBonusStrings(player: Player) {
    [
        { id: 108, text: 'Stab', value: player.bonuses.offencive.stab },
        { id: 109, text: 'Slash', value: player.bonuses.offencive.slash },
        { id: 110, text: 'Crush', value: player.bonuses.offencive.crush },
        { id: 111, text: 'Magic', value: player.bonuses.offencive.magic },
        { id: 112, text: 'Range', value: player.bonuses.offencive.ranged },
        { id: 113, text: 'Stab', value: player.bonuses.defencive.stab },
        { id: 114, text: 'Slash', value: player.bonuses.defencive.slash },
        { id: 115, text: 'Crush', value: player.bonuses.defencive.crush },
        { id: 116, text: 'Magic', value: player.bonuses.defencive.magic },
        { id: 117, text: 'Range', value: player.bonuses.defencive.ranged },
        { id: 119, text: 'Strength', value: player.bonuses.skill.strength },
        { id: 120, text: 'Prayer', value: player.bonuses.skill.prayer },
    ].forEach(bonus => player.modifyWidget(widgets.equipmentStats.widgetId, { childId: bonus.id,
        text: `${bonus.text}: ${bonus.value > 0 ? `+${bonus.value}` : bonus.value}` }));
}

export const action: buttonAction = (details) => {
    const { player } = details;

    player.updateBonuses();

    updateBonusStrings(player);

    player.outgoingPackets.sendUpdateAllWidgetItems(widgets.equipmentStats, player.equipment);
    player.outgoingPackets.sendUpdateAllWidgetItems(widgets.inventory, player.inventory);

    player.activeWidget = {
        widgetId: widgets.equipmentStats.widgetId,
        secondaryWidgetId: widgets.inventory.widgetId,
        type: 'SCREEN_AND_TAB',
        closeOnWalk: true
    };
};

export default new RunePlugin({ type: ActionType.BUTTON, widgetId: widgets.equipment.widgetId, buttonIds: 24, action });
