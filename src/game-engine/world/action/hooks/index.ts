import { actionHookMap } from '@engine/game-server';
import { QuestKey } from '@engine/config/quest-config';
import { ActionStrength, ActionType } from '@engine/world/action';
import { HookTask } from '@engine/world/action/hooks/task';


/**
 * Defines a quest requirement for an action hook.
 */
export interface QuestRequirement {
    questId: string;
    stage?: QuestKey;
    stages?: number[];
}


/**
 * Defines a generic extensible game content action hook.
 */
export interface ActionHook<A = any, H = any> {
    // The type of action to perform
    type: ActionType;
    // Whether or not this hook will allow other hooks from the same action to queue after it
    multi?: boolean;
    // The action's priority over other actions
    priority?: number;
    // The strength of the action hook
    strength?: ActionStrength;
    // [optional] Quest requirements that must be completed in order to run this hook
    questRequirement?: QuestRequirement;
    // [optional] The action function to be performed
    handler?: H;
    // [optional] The task to be performed
    task?: HookTask<A>;
}


/**
 * Fetches the list of all discovered action hooks of the specified type.
 * @param actionType The Action Type to find the hook for.
 * @param filter [optional] Filter criteria to apply to the returned list.
 */
export const getActionHooks = <T extends ActionHook>(actionType: ActionType, filter?: (actionHook: T) => boolean): T[] => {
    const hooks = actionHookMap[actionType] as T[];
    if(!hooks || hooks.length === 0) {
        return [];
    }

    return filter ? hooks.filter(filter) : hooks;
}


/**
 * A sorter function that action hooks can be run through.
 * Action hooks will be sorted by those with quest requirements firstly, and the rest thereafter.
 * @param actionHooks The list of hooks to sort.
 */
export function sortActionHooks<T = any>(actionHooks: ActionHook<T>[]): ActionHook<T>[] {
    return actionHooks.sort(actionHook => actionHook.questRequirement !== undefined ? -1 : 1);
}


export * from './hook-filters';
export * from './task';
