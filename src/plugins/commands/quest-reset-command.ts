import { commandAction } from '@server/world/action/player-command-action';
import { interfaceScripts } from '@server/world/config/widget';

const action: commandAction = (details) => {
    const { player } = details;

    player.quests.find(quest => quest.questId === 'cooksAssistant').stage = 'COLLECTING';
    player.outgoingPackets.updateClientConfig(interfaceScripts.questPoints, 1000);
};

export default {
    type: 'player_command', commands: 'resetquests', action
};
