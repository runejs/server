import { ButtonAction, buttonActionHandler, ButtonActionHook } from '@engine/world/action/button.action';
import { Player } from '@engine/world/actor/player/player';
import { Position } from '@engine/world/position';
import { animationIds } from '@engine/world/config/animation-ids';
import { soundIds } from '@engine/world/config/sound-ids';
import { gfxIds } from '@engine/world/config/gfx-ids';
import { loopingEvent } from '@engine/game-server';
import { TaskExecutor } from '@engine/world/action';

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

function homeTeleport(player: Player, elapsedTicks: number): boolean {
    if (elapsedTicks === 0) {
        player.playAnimation(animationIds.homeTeleportDraw);
        player.playGraphics({ id: gfxIds.homeTeleportDraw, delay: 0, height: 0 });
        player.outgoingPackets.playSound(soundIds.homeTeleportDraw, 10);
    } else if (elapsedTicks === 7) {
        player.playAnimation(animationIds.homeTeleportSit);
        player.playGraphics({ id: gfxIds.homeTeleportFullDrawnCircle, delay: 0, height: 0 });
        player.outgoingPackets.playSound(soundIds.homeTeleportSit, 10);
    } else if (elapsedTicks === 12) {
        player.playAnimation(animationIds.homeTeleportPullOutAndReadBook);
        player.playGraphics({ id: gfxIds.homeTeleportPullOutBook, delay: 0, height: 0 });
        player.outgoingPackets.playSound(soundIds.homeTeleportPullOutBook, 10);
    } else if (elapsedTicks === 16) {
        player.playAnimation(animationIds.homeTeleportReadBookAndGlowCircle);
        player.playGraphics({ id: gfxIds.homeTeleportCircleGlow, delay: 0, height: 0 });
        player.outgoingPackets.playSound(soundIds.homeTeleportCircleGlowAndTeleport, 10);
    } else if (elapsedTicks === 20) {
        player.playAnimation(animationIds.homeTeleport);
        player.playGraphics({ id: gfxIds.homeTeleport, delay: 0, height: 0 });
    } else if (elapsedTicks === 22) {
        player.teleport(new Position(3218, 3218));
        return true;
    }

    return false;
}

export const activate = (task: TaskExecutor<ButtonAction>, elapsedTicks: number = 0) => {
    const { player, buttonId } = task.actionData;

    let completed: boolean = false;

    switch (buttonId) {
        case Teleports.Home:
            completed = homeTeleport(player, elapsedTicks);
            break;
    }

    if(completed) {
        task.stop();
    }
};

export default {
    pluginId: 'rs:magic_teleports',
    hooks: [
        {
            type: 'button',
            widgetId: 192,
            buttonIds: buttonIds,
            task: {
                activate,
                interval: 1
            }
        } as ButtonActionHook
    ]
};
