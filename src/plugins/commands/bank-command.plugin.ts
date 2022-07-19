import { commandActionHandler } from '@engine/action';
import { openBankInterface } from '@plugins/objects/bank/bank.plugin';
import { getActionHooks } from '@engine/action/hook';
import { ObjectInteractionActionHook } from '@engine/action';
import { advancedNumberHookFilter } from '@engine/action/hook/hook-filters';
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
            objectConfig: undefined,
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
