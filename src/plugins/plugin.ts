import { Player } from '@server/world/actor/player/player';
import { Action, ActionDirectory } from '@server/world/action/action';

export interface QuestRequirement {
    questId: string;
    stage: string;
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
        return plugin.questRequirement.stage === 'NOT_STARTED';
    }

    return playerQuest.stage === plugin.questRequirement.stage;
}

export class RunePlugin {

    public actions: ActionDirectory[];

    public constructor(actions: ActionDirectory | ActionDirectory[], questRequirement?: QuestRequirement) {
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
