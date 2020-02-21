import { ActionType, RunePlugin } from '@server/plugins/plugin';
import { commandAction } from '@server/world/mob/player/action/input-command-action';
import { injectPlugins } from '@server/game-server';

const action: commandAction = (details) => {
    const { player } = details;

    player.packetSender.chatboxMessage('Reloading plugins...');

    injectPlugins()
        .then(() => player.packetSender.chatboxMessage('Plugins reloaded.'))
        .catch(() => player.packetSender.chatboxMessage('Error reloading plugins.'));
};

export default new RunePlugin({ type: ActionType.COMMAND, commands: 'plugins', action });
