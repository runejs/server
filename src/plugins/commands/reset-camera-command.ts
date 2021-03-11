import { PlayerCommandAction } from '@engine/world/action/player-command.action';

export default {
    type: 'player_command',
    commands: [ 'reset_camera', 'resetcamera' ],
    handler: ({ player }: PlayerCommandAction): void => player.outgoingPackets.resetCamera()
};
