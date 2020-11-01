import { commandAction } from '@server/world/action/player-command-action';

const action: commandAction = (details) => {
    const { player } = details;
    player.modifyWidget(239, { childId: 82, textColor: 0x0000ff });
};

export default {
    type: 'player_command', commands: 'textcolortest', action
};
