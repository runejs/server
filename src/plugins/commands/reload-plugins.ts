import { ActionType, RunePlugin } from '@server/plugins/plugin';
import { commandAction } from '@server/world/actor/player/action/input-command-action';
import { injectPlugins } from '@server/game-server';

const action: commandAction = (details) => {
    const { player } = details;

    player.sendLogMessage('Reloading plugins...', details.isConsole);


    injectPlugins()
        .then(() => player.sendLogMessage('Plugins reloaded.', details.isConsole))
        .catch(() => player.sendLogMessage('Error reloading plugins.', details.isConsole));
};

export default new RunePlugin({ type: ActionType.COMMAND, commands: 'plugins', action });
