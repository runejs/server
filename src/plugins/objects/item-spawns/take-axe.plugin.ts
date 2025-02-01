import type { objectInteractionActionHandler } from '@engine/action/pipe/object-interaction.action';
import { itemIds } from '@engine/world/config/item-ids';
import { objectIds } from '@engine/world/config/object-ids';
import { logger } from '@runejs/common';

const itemMappings: Record<number, number> = {
    [objectIds.lumbridgeAxeInLogs]: itemIds.axes.bronze,
};

export const action: objectInteractionActionHandler = details => {
    const { player, option } = details;

    const name = details.objectConfig.name || '';
    if (!name) {
        logger.warn(`Object ${details.object.objectId} has no name.`);
    }

    switch (option) {
        case 'take-axe':
            player.playAnimation(827);
            player.sendMessage('You take the axe.');
            player.playSound(2581, 7);
            player.giveItem(itemMappings[details.object.objectId]);
            return;
        default:
            player.sendMessage('This has not been implemented.');
            return;
    }
};

export default {
    pluginId: 'rs:take_axe',
    hooks: [
        {
            type: 'object_interaction',
            objectIds: [objectIds.lumbridgeAxeInLogs],
            options: ['take-axe'],
            walkTo: true,
            handler: action,
        },
    ],
};
