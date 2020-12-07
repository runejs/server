import { Player } from '@server/world/actor/player/player';
import { Action } from '@server/world/action';
import { basicNumberFilter } from '@server/plugins/plugin-loader';

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

    public actions: Action[];

    public constructor(actions: Action | Action[], questRequirement?: QuestRequirement) {
        if(!Array.isArray(actions)) {
            if(questRequirement !== undefined && !actions.questRequirement) {
                actions.questRequirement = questRequirement;
            }
            this.actions = [ actions ];
        } else {
            if(questRequirement !== undefined) {
                actions.forEach(action => {
                    if(!action.questRequirement) {
                        action.questRequirement = questRequirement;
                    }
                });
            }
            this.actions = actions;
        }
    }

}
