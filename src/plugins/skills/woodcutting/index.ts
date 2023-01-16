import {
    ObjectInteractionActionHook,
} from '@engine/action';
import { getTreeIds } from '@engine/world/config/harvestable-object';
import { runWoodcuttingTask } from './woodcutting-task';

/**
 * Woodcutting plugin
 *
 * This uses the task system to schedule actions.
 */
export default {
    pluginId: 'rs:woodcutting',
    hooks: [
        /**
         * "Chop down" / "chop" object interaction hook.
         */
        {
            type: 'object_interaction',
            options: [ 'chop down', 'chop' ],
            objectIds: getTreeIds(),
            handler: ({ player, object }) => {
                runWoodcuttingTask(player, object);
            }
        } as ObjectInteractionActionHook
    ]
};
