import { Player } from '@server/world/actor/player/player';
import { ActionHook } from '@server/world/action';
import { basicNumberFilter } from '@server/plugins/plugin-loader';
import { Quest } from '@server/world/actor/player/quest';


export function sortActionHooks(actionHooks: ActionHook[]): ActionHook[] {
    return actionHooks.sort(plugin => plugin.questRequirement !== undefined ? -1 : 1);
}


export function questHookFilter(player: Player, actionHook: ActionHook): boolean {
    if(!actionHook.questRequirement) {
        return true;
    }

    const questId = actionHook.questRequirement.questId;
    const playerQuest = player.quests.find(quest => quest.questId === questId);
    if(!playerQuest) {
        // @TODO quest requirements
        return actionHook.questRequirement.stage === 0;
    }

    if(actionHook.questRequirement.stage === 'complete') {
        return playerQuest.progress === 'complete';
    }

    if(typeof playerQuest.progress === 'number') {
        if(actionHook.questRequirement.stage !== undefined) {
            if(!basicNumberFilter(actionHook.questRequirement.stage, playerQuest.progress)) {
                return false;
            }
        } else if(actionHook.questRequirement.stages !== undefined) {
            if(!basicNumberFilter(actionHook.questRequirement.stages, playerQuest.progress)) {
                return false;
            }
        }
    }

    return playerQuest.progress === actionHook.questRequirement.stage;
}



export class RunePlugin {

    public pluginId: string;
    public hooks?: ActionHook[];
    public quests?: Quest[];

}
