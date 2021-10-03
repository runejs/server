import { PlayerCommandAction } from '@engine/action/player-command.action';

export default {
    pluginId: 'rs:reset_camera_command',
    hooks: [
        {
            type: 'player_command',
            commands: [ 'reset_camera', 'resetcamera' ],
            handler: ({ player }: PlayerCommandAction): void => player.outgoingPackets.resetCamera()
        }
    ]
};
