import { RunePlugin } from '@server/plugins/plugin';
import { commandAction } from '@server/world/action/player-command-action';
import { ActionType } from '@server/world/action';

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

export default [{
    type: 'player_command',
    commands: 'song',
    args: [
        {
            name: 'songId',
            type: 'number'
        }
    ],
    action: songAction
}, {
    type: 'player_command',
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
    type: 'player_command',
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
}];
