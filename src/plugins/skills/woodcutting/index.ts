import {
    ObjectInteractionActionHook,
} from '@engine/action';
import { getTreeIds } from '@engine/world/config/harvestable-object';
import { activate, canActivate, onComplete } from './woodcutting-task';


export default {
    pluginId: 'rs:woodcutting',
    hooks: [
        {
            type: 'object_interaction',
            options: [ 'chop down', 'chop' ],
            objectIds: getTreeIds(),
            strength: 'normal',
            task: {
                canActivate,
                activate,
                onComplete,
                interval: 1
            }
        } as ObjectInteractionActionHook
    ]
};
