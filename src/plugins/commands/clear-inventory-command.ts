import { PlayerCommandActionData } from '@server/world/action/player-command-action';

export default {
    type: 'player_command',
    commands: [ 'clear' ],
    action: (details: PlayerCommandActionData): void => details.player.inventory.clear()
};
