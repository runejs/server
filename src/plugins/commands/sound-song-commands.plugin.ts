import { commandActionHandler } from '@engine/action';

const songAction: commandActionHandler = (details) => {
    const { player, args } = details;
    player.outgoingPackets.playSong(args.songId as number);
};

const soundAction: commandActionHandler = (details) => {
    const { player, args } = details;
    player.playSound(args.soundId as number, args.volume as number);
};

const quickSongAction: commandActionHandler = (details) => {
    const { player, args } = details;
    player.outgoingPackets.playQuickSong(args.songId as number, args.prevSongId as number);
};

export default {
    pluginId: 'rs:sound_commands',
    hooks: [
        {
            type: 'player_command',
            commands: 'song',
            args: [
                {
                    name: 'songId',
                    type: 'number'
                }
            ],
            handler: songAction
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
            handler: soundAction
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
            handler: quickSongAction
        }
    ]
};
