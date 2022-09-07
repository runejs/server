import {
    ObjectInteractionActionHook,
} from '@engine/action';
import { getTreeIds } from '@engine/world/config/harvestable-object';
import { runWoodcuttingTask } from './woodcutting-task';


export default {
    pluginId: 'rs:woodcutting',
    hooks: [
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
