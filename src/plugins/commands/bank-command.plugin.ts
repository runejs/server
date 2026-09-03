import { getActionHooks } from '@engine/action/hook/action-hook';
import { advancedNumberHookFilter } from '@engine/action/hook/hook-filters';
import type { ObjectInteractionActionHook } from '@engine/action/pipe/object-interaction.action';
import type { commandActionHandler } from '@engine/action/pipe/player-command.action';
import { objectIds } from '@engine/world/config/object-ids';

const action: commandActionHandler = details => {
    const interactionActions = getActionHooks<ObjectInteractionActionHook>('object_interaction').filter(plugin =>
        advancedNumberHookFilter(plugin.objectIds, objectIds.bankBooth[0], plugin.options, 'use-quickly'),
    );
    interactionActions.forEach(plugin => {
        if (!plugin.handler) {
            return;
        }

        plugin.handler({
            player: details.player,
            object: {
                objectId: objectIds.bankBooth[0],
                level: details.player.position.level,
                x: details.player.position.x,
                y: details.player.position.y,
                orientation: 0,
                type: 0,
            },
            option: 'use-quickly',
            position: details.player.position,
            objectConfig: undefined as any,
            cacheOriginal: undefined as any,
        });
    });
};

export default {
    pluginId: 'rs:bank_command',
    hooks: [
        {
            type: 'player_command',
            commands: ['bank'],
            handler: action,
        },
    ],
};
