export default {
    type: 'player_command',
    commands: [ 'reset_camera', 'resetcamera' ],
    action: ({ player }) => player.outgoingPackets.resetCamera()
};
