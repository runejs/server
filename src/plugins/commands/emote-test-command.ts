import { commandActionHandler } from '@engine/world/action/player-command.action';
import { lockEmote, unlockEmote, unlockEmotes } from '@plugins/buttons/player-emotes.plugin';

const action: commandActionHandler = (details) => {
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

const resetAction: commandActionHandler = (details) => {
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
    handler: action
}, {
    type: 'player_command',
    commands: 'emotereset',
    handler: resetAction
}];
