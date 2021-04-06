import { commandActionHandler } from '@engine/world/action/player-command.action';
import { openBankInterface } from '@plugins/objects/bank/bank.plugin';
import { getActionHooks } from '@engine/world/action/hooks';
import { ObjectInteractionActionHook } from '@engine/world/action/object-interaction.action';
import { advancedNumberHookFilter } from '@engine/world/action/hooks/hook-filters';
import { objectIds } from '@engine/world/config/object-ids';

const action: commandActionHandler = (details) => {
    const interactionActions = getActionHooks<ObjectInteractionActionHook>('object_interaction')
        .filter(plugin => advancedNumberHookFilter(plugin.objectIds, objectIds.bankBooth, plugin.options, 'use-quickly'));
    interactionActions.forEach(plugin =>
        plugin.handler({
            player: details.player,
            object: {
                objectId: objectIds.bankBooth,
                level: details.player.position.level,
                x: details.player.position.x,
                y: details.player.position.y,
                orientation: 0,
                type: 0
            },
            objectDefinition: undefined,
            option: 'use-quickly',
            position: details.player.position,
            cacheOriginal: undefined
        }));
};

export default {
    pluginId: 'rs:bank_command',
    hooks: [
        {
            type: 'player_command',
            commands: [ 'bank' ],
            handler: action
        }
    ]
};
