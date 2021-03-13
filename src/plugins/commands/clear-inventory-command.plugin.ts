import { PlayerCommandAction } from '@engine/world/action/player-command.action';

export default {
    pluginId: 'rs:clear_inventory_command',
    hooks: [ {
        type: 'player_command',
        commands: [ 'clear' ],
        handler: (details: PlayerCommandAction): void => details.player.inventory.clear()
    }
    ]
};
