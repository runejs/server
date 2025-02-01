import type { TaskExecutor } from '@engine/action/hook/task';
import type { MagicOnNPCAction, MagicOnNPCActionHook } from '@engine/action/pipe/magic-on-npc.action';

const buttonIds: number[] = [
    0, // Home Teleport
];

const spells = ['Wind Strike', 'Confuse', 'Water Strike', 'unknown?', 'Earth Strike'];
export const activate = (task: TaskExecutor<MagicOnNPCAction>) => {
    const { npc, player, buttonId } = task.actionData;

    const attackerX = player.position.x;
    const attackerY = player.position.y;
    const victimX = npc.position.x;
    const victimY = npc.position.y;
    const offsetX = victimY - attackerY;
    const offsetY = victimX - attackerX;

    player.walkingQueue.clear();

    //npc world index would be -1 for players
    player.outgoingPackets.sendProjectile(player.position, offsetX, offsetY, 250, 40, 36, 100, npc.worldIndex + 1, 1);
    console.info(`${player.username} smites ${npc.name} with ${spells[buttonId]}`);
};

export default {
    pluginId: 'rs:magic',
    hooks: {
        type: 'magic_on_npc',
        widgetId: 192,
        buttonIds: buttonIds,
        task: {
            activate,
            interval: 0,
        },
    } as MagicOnNPCActionHook,
};
