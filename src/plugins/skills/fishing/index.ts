import {
    NpcInteractionActionHook,
} from '@engine/action';
import { runFishingTask } from './fishing-task';

/**
 * Fishing plugin
 *
 * This uses the task system to schedule actions.
 */
export default {
    pluginId: 'rs:fishing',
    hooks: [
        /**
         * "Chop down" / "chop" object interaction hook.
         */
        {
            type: 'npc_interaction',
            options: 'bait' ,
            npcs: 'rs:fishing_spot_bait_a',
            handler: ({ player, npc }) => {
                runFishingTask(player, npc);
            }
        } as NpcInteractionActionHook
    ]
};
