import { PlayerCommandActionData } from '@server/world/action/player-command-action';

export default {
    type: 'player_command',
    commands: [ 'reset_camera', 'resetcamera' ],
    action: ({ player }: PlayerCommandActionData): void => player.outgoingPackets.resetCamera()
};
