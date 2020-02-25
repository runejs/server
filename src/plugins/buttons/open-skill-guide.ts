import { buttonAction } from '@server/world/mob/player/action/button-action';
import { ActionType, RunePlugin } from '@server/plugins/plugin';

const buttonIds = [ 118, 121 ];

export const action: buttonAction = (details) => {
    const { player, buttonId } = details;

    player.packetSender.chatboxMessage('Open skill menu');

    for(let i = 0; i < 1000; i++) {
        player.packetSender.updateClientConfig(i, 25);
    }
    player.activeWidget = {
        widgetId: 308,
        type: 'SCREEN',
        closeOnWalk: true
    };
};

export default new RunePlugin({ type: ActionType.BUTTON, widgetId: 320, buttonIds, action });
