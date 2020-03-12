import { ActionType, RunePlugin } from '@server/plugins/plugin';
import { commandAction } from '@server/world/actor/player/action/input-command-action';
import { injectPlugins } from '@server/game-server';
import { widgetScripts } from '@server/world/config/widget';

const action: commandAction = (details) => {
    const { player } = details;

    player.quests.find(quest => quest.questId === 'cooksAssistant').stage = 'COLLECTING';
    player.outgoingPackets.updateClientConfig(widgetScripts.questPoints, 1000);
};

export default new RunePlugin({ type: ActionType.COMMAND, commands: 'resetquests', action });
