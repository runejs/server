import { buttonAction, ButtonActionDetails } from '@server/world/actor/player/action/button-action';
import { ActionType, RunePlugin } from '@server/plugins/plugin';
import { Player } from '@server/world/actor/player/player';
import { World } from '@server/world/world';
import { loopingAction } from '@server/world/actor/player/action/action';
import { Skill } from '@server/world/actor/skills';
import { Position } from '@server/world/position';

enum Teleports {
    Home = 591,
    Varrock = 12,
    Lumbridge = 15,
    Falador = 18,
    Camelot = 22,
    Ardougne = 388,
    Watchtower = 389,
    Trollheim = 492,
    Ape_atoll = 569
}

const buttonIds: number[] = [
    591, // Home Teleport
];

function HomeTeleport(player: Player): void {
    let elapsedTicks = 0;
    const loop = loopingAction(player);
    loop.event.subscribe(() => {

        if (elapsedTicks === 0) {
            player.playAnimation(4847);
            player.playGraphics({id: 800, delay: 0, height: 0});
            player.outgoingPackets.playSound(193, 10);
        }
        if (elapsedTicks === 7) {
            player.playAnimation(4850);
            player.outgoingPackets.playSound(196, 10);
        }
        if (elapsedTicks === 12) {
            player.playAnimation(4853);
            player.playGraphics({id: 802, delay: 0, height: 0});
            player.outgoingPackets.playSound(194, 10);
        }
        if (elapsedTicks === 16) {
            player.playAnimation(4855);
            player.playGraphics({id: 803, delay: 0, height: 0});
            player.outgoingPackets.playSound(195, 10);

        }
        if (elapsedTicks === 20) {
            player.playAnimation(4857);
            player.playGraphics({id: 804, delay: 0, height: 0});
        }
        if (elapsedTicks === 22) {
            player.teleport(new Position(3218, 3218));
            loop.cancel();
            return;
        }
        elapsedTicks++;
    });
}

export const action: buttonAction = (details) => {
    const {player, buttonId} = details;

    switch (buttonId) {
        case Teleports.Home:
            HomeTeleport(player);
            break;
    }
};

export default new RunePlugin({type: ActionType.BUTTON, widgetId: 192, buttonIds: buttonIds, action});
