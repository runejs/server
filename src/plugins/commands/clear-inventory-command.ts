export default {
    type: 'player_command',
    commands: [ 'clear' ],
    action: (details) => details.player.inventory.clear()
};
