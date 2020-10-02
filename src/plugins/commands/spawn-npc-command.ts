import { ActionType, RunePlugin } from '@server/plugins/plugin';
import { commandAction } from '@server/world/actor/player/action/input-command-action';
import { cache, world } from "@server/game-server";
import { Npc } from "@server/world/actor/npc/npc";

const action: commandAction = (details) => {
    const {player, args} = details;

    const npcId: number = args.npcId as number;
    const npcDefinition = cache.npcDefinitions.get(npcId);
    const npc = new Npc({
        npcId: npcId,
        x: player.position.x,
        y: player.position.y
    }, npcDefinition);

    world.registerNpc(npc);
};

export default new RunePlugin({
    type: ActionType.COMMAND,
    commands: [ 'npc' ],
    args: [
        {
            name: 'npcId',
            type: 'number'
        }
    ],
    action
});
