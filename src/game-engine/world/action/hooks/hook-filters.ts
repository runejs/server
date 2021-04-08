import { Player } from '@engine/world/actor/player/player';
import { ActionHook } from '@engine/world/action/hooks/index';


export const stringHookFilter = (expected: string | string[], input: string): boolean => {
    if(Array.isArray(expected)) {
        if(expected.indexOf(input) === -1) {
            return false;
        }
    } else {
        if(expected !== input) {
            return false;
        }
    }

    return true;
};


export const numberHookFilter = (expected: number | number[], input: number): boolean => {
    if(Array.isArray(expected)) {
        if(expected.indexOf(input) === -1) {
            return false;
        }
    } else {
        if(expected !== input) {
            return false;
        }
    }

    return true;
};


export const advancedNumberHookFilter = (expected: number | number[], input: number, options?: string | string[],
    searchOption?: string): boolean => {
    if(expected !== undefined) {
        if(Array.isArray(expected)) {
            if(expected.indexOf(input) === -1) {
                return false;
            }
        } else {
            if(expected !== input) {
                return false;
            }
        }
    }

    if(options !== undefined && searchOption !== undefined) {
        if(Array.isArray(options)) {
            return options.indexOf(searchOption) !== -1;
        } else {
            return options === searchOption;
        }
    } else {
        return true;
    }
};


/**
 * A quest requirement filter for hooks that uses the hook's `questRequirements` object.
 * @param player The player involved with the hook.
 * @param actionHook The action hook definition to filter.
 */
export function questHookFilter(player: Player, actionHook: ActionHook): boolean {
    if(!actionHook.questRequirement) {
        return true;
    }

    const questId = actionHook.questRequirement.questId;
    const playerQuest = player.quests.find(quest => quest.questId === questId);
    if (!playerQuest) {
        // @TODO quest requirements
        return actionHook.questRequirement.stage === 0;
    }

    if (actionHook.questRequirement.stage === 'complete') {
        return playerQuest.progress === 'complete';
    }

    if (typeof playerQuest.progress === 'number') {
        if (actionHook.questRequirement.stage !== undefined) {
            return numberHookFilter(actionHook.questRequirement.stage, playerQuest.progress);
        } else if (actionHook.questRequirement.stages !== undefined) {
            return numberHookFilter(actionHook.questRequirement.stages, playerQuest.progress);
        }
    }

    return playerQuest.progress === actionHook.questRequirement.stage;
}
