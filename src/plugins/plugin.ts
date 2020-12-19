import { Player } from '@server/world/actor/player/player';
import { Action } from '@server/world/action';
import { basicNumberFilter } from '@server/plugins/plugin-loader';
import { Quest } from '@server/world/actor/player/quest';


export interface QuestRequirement {
    questId: string;
    stage?: number;
    stages?: number[];
}

export function sort(plugins: Action[]): Action[] {
    return plugins.sort(plugin => plugin.questRequirement !== undefined ? -1 : 1);
}

export function questFilter(player: Player, plugin: Action): boolean {
    if(!plugin.questRequirement) {
        return true;
    }

    const questId = plugin.questRequirement.questId;
    const playerQuest = player.quests.find(quest => quest.questId === questId);
    if(!playerQuest) {
        // @TODO quest requirements
        return plugin.questRequirement.stage === 0;
    }

    if(plugin.questRequirement.stage !== undefined) {
        if(!basicNumberFilter(plugin.questRequirement.stage, playerQuest.progress)) {
            return false;
        }
    } else if(plugin.questRequirement.stages !== undefined) {
        if(!basicNumberFilter(plugin.questRequirement.stages, playerQuest.progress)) {
            return false;
        }
    }

    return playerQuest.progress === plugin.questRequirement.stage;
}

export class RunePlugin {

    public actions: (Action | Quest)[];

    public constructor(actions: Action | (Action | Quest)[] | Quest, questRequirement?: QuestRequirement) {
        if(!Array.isArray(actions)) {
            if(!(actions instanceof Quest)) {
                actions = actions as Action;
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
