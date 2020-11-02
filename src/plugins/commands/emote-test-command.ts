import { commandAction } from '@server/world/action/player-command-action';
import { lockEmote, unlockEmote, unlockEmotes } from '@server/plugins/buttons/player-emotes-plugin';

const action: commandAction = (details) => {
    const { player, args } = details;
    const emoteName = (args.emoteName as string).toUpperCase().replace(/_/g, ' ');

    const unlockedEmotes: string[] = player.savedMetadata.unlockedEmotes || [];
    const index = unlockedEmotes.indexOf(emoteName);

    if(index !== -1) {
        lockEmote(player, emoteName);
    } else {
        unlockEmote(player, emoteName);
    }
};

const resetAction: commandAction = (details) => {
    const { player } = details;
    player.savedMetadata.unlockedEmotes = [];
    unlockEmotes(player);
};

export default [{
    type: 'player_command',
    commands: 'emote',
    args: [{
        name: 'emoteName',
        type: 'string'
    }],
    action
}, {
    type: 'player_command',
    commands: 'emotereset',
    action: resetAction
}];
