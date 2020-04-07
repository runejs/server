import { ActionType, RunePlugin } from '@server/plugins/plugin';
import { commandAction } from '@server/world/actor/player/action/input-command-action';

const action: commandAction = (details) => {
    const { player } = details;
    player.modifyWidget(239, { childId: 82, textColor: 0x0000ff });
};

export default new RunePlugin({ type: ActionType.COMMAND, commands: 'textcolortest', action });
