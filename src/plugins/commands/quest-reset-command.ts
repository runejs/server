import { commandAction } from '@engine/world/action/player-command.action';
import { widgetScripts } from '@engine/world/config/widget';

const action: commandAction = (details) => {
    const { player } = details;

    player.quests.find(quest => quest.questId === 'cooksAssistant').stage = 'COLLECTING';
    player.outgoingPackets.updateClientConfig(widgetScripts.questPoints, 1000);
};

export default {
    type: 'player_command', commands: 'resetquests', action
};
