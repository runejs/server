import { PlayerCommandActionData } from '@engine/world/action/player-command-action';

export default {
    type: 'player_command',
    commands: [ 'clear' ],
    action: (details: PlayerCommandActionData): void => details.player.inventory.clear()
};
