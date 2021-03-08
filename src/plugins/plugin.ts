import { Player } from '@server/world/actor/player/player';
import { ActionHook } from '@server/world/action';
import { basicNumberFilter } from '@server/plugins/plugin-loader';
import { Quest } from '@server/world/actor/player/quest';
import { QuestKey } from '@server/config/quest-config';


export interface QuestRequirement {
    questId: string;
    stage?: QuestKey;
    stages?: number[];
}

export function sort(plugins: ActionHook[]): ActionHook[] {
    return plugins.sort(plugin => plugin.questRequirement !== undefined ? -1 : 1);
}

export function questFilter(player: Player, plugin: ActionHook): boolean {
    if(!plugin.questRequirement) {
        return true;
    }

    const questId = plugin.questRequirement.questId;
    const playerQuest = player.quests.find(quest => quest.questId === questId);
    if(!playerQuest) {
        // @TODO quest requirements
        return plugin.questRequirement.stage === 0;
    }

    if(plugin.questRequirement.stage === 'complete') {
        return playerQuest.progress === 'complete';
    }

    if(typeof playerQuest.progress === 'number') {
        if(plugin.questRequirement.stage !== undefined) {
            if(!basicNumberFilter(plugin.questRequirement.stage, playerQuest.progress)) {
                return false;
            }
        } else if(plugin.questRequirement.stages !== undefined) {
            if(!basicNumberFilter(plugin.questRequirement.stages, playerQuest.progress)) {
                return false;
            }
        }
    }

    return playerQuest.progress === plugin.questRequirement.stage;
}

export class RunePlugin {

    public actions: (ActionHook | Quest)[];

    public constructor(actions: ActionHook | (ActionHook | Quest)[] | Quest, questRequirement?: QuestRequirement) {
        if(!Array.isArray(actions)) {
            if(!(actions instanceof Quest)) {
                actions = actions as ActionHook;
                if(questRequirement !== undefined && !actions.questRequirement) {
                    actions.questRequirement = questRequirement;
                }
            }

            this.actions = [ actions ];
        } else {
            if(questRequirement !== undefined) {
                actions.forEach(action => {
                    if(!(action instanceof Quest) && !action.questRequirement) {
                        action.questRequirement = questRequirement;
                    }
                });
            }

            this.actions = actions;
        }
    }

}
