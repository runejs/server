import { Player } from '@engine/world/actor';
import { TaskExecutor, MagicOnNPCActionHook, MagicOnNPCAction } from '@engine/action';
import { logger } from '@runejs/core';

const buttonIds: number[] = [
    0, // Home Teleport
];

function attack_target(player: Player, elapsedTicks: number): boolean {
    logger.info('attacking?');
    return true;
}

const spells = ['Wind Strike','Confuse', 'Water Strike','unknown?', 'Earth Strike'];
export const activate = (task: TaskExecutor<MagicOnNPCAction>, elapsedTicks: number = 0) => {
    const {
        npc,
        player,
        widgetId,
        buttonId
    } = task.actionData;

    const attackerX = player.position.x;
    const attackerY = player.position.y
    const victimX = npc.position.x
    const victimY = npc.position.y;
    const offsetX = ((victimY - attackerY));
    const offsetY = ((victimX - attackerX));

    player.walkingQueue.clear();

    //npc world index would be -1 for players
    player.outgoingPackets.sendProjectile(player.position, offsetX, offsetY, 250, 40, 36, 100, npc.worldIndex + 1, 1); 
    console.info(`${player.username} smites ${npc.name} with ${spells[buttonId]}`);
};

export default {
    pluginId: 'rs:magic',
    hooks: 
        {
            type: 'magic_on_npc',
            widgetId: 192,
            buttonIds: buttonIds,
            task: {
                activate,
                interval: 0
            }
        } as MagicOnNPCActionHook
};
