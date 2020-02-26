import { ActionType, RunePlugin } from '@server/plugins/plugin';
import { commandAction } from '@server/world/actor/player/action/input-command-action';

const action: commandAction = (details) => {
    const { player } = details;
    player.outgoingPackets.chatboxMessage(`@[ ${player.position.x}, ${player.position.y}, ${player.position.level} ]`);
};

export default new RunePlugin({
    type: ActionType.COMMAND,
    commands: [ 'pos', 'loc', 'position', 'location', 'coords', 'coordinates', 'mypos', 'myloc' ],
    action
});
