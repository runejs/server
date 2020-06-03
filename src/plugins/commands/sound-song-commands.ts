import { ActionType, RunePlugin } from '@server/plugins/plugin';
import { commandAction } from '@server/world/actor/player/action/input-command-action';

const songAction: commandAction = (details) => {
    const { player, args } = details;
    player.outgoingPackets.playSong(args.songId as number);
};

const soundAction: commandAction = (details) => {
    const { player, args } = details;
    player.playSound(args.soundId as number, args.volume as number);
};

const quickSongAction: commandAction = (details) => {
    const { player, args } = details;
    player.outgoingPackets.playQuickSong(args.songId as number, args.prevSongId as number);
};

export default new RunePlugin([{
    type: ActionType.COMMAND,
    commands: 'song',
    args: [
        {
            name: 'songId',
            type: 'number'
        }
    ],
    action: songAction
}, {
    type: ActionType.COMMAND,
    commands: [ 'sound', 'so' ],
    args: [
        {
            name: 'soundId',
            type: 'number'
        },
        {
            name: 'volume',
            type: 'number',
            defaultValue: 10
        }
    ],
    action: soundAction
}, {
    type: ActionType.COMMAND,
    commands: 'quicksong',
    args: [
        {
            name: 'songId',
            type: 'number'
        },
        {
            name: 'prevSongId',
            type: 'number'
        }
    ],
    action: quickSongAction
}]);
