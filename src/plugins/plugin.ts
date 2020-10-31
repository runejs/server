import { ItemOnObjectAction } from '@server/world/action/item-on-object-action';
import { ItemOnNpcAction } from '@server/world/action/item-on-npc-action';
import { NpcAction } from '@server/world/action/npc-action';
import { PlayerCommandAction } from '@server/world/action/input-command-action';
import { WidgetAction } from '@server/world/action/widget-action';
import { ObjectAction } from '@server/world/action/object-action';
import { NpcInitAction } from '@server/world/actor/npc/npc';
import { Player, PlayerInitAction } from '@server/world/actor/player/player';
import { ItemOnItemAction } from '@server/world/action/item-on-item-action';
import { ButtonAction } from '@server/world/action/button-action';
import { WorldItemAction } from '@server/world/action/world-item-action';
import { ItemAction } from '@server/world/action/item-action';
import { QuestAction } from '@server/world/config/quests';
import { PlayerAction } from '@server/world/action/player-action';
import { EquipAction } from '@server/world/action/equip-action';

export type ActionType =
    'button'
    | 'widget_action'
    | 'item_on_item'
    | 'item_action'
    | 'equip_action'
    | 'world_item_action'
    | 'npc_action'
    | 'object_action'
    | 'item_on_object'
    | 'item_on_npc'
    | 'player_command'
    | 'player_init'
    | 'npc_init'
    | 'quest'
    | 'player_action';

export interface QuestRequirement {
    questId: string;
    stage: string;
}

export interface Action {
    // The type of action to perform.
    type: ActionType;
    // The action's priority over other actions.
    priority?: number;
    // [optional] Details regarding what quest this action is for.
    questRequirement?: QuestRequirement;
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

export type RuneActionDirectory =
    NpcAction
    | ObjectAction
    | ButtonAction
    | ItemOnItemAction
    | ItemOnObjectAction
    | ItemOnNpcAction
    | PlayerCommandAction
    | WidgetAction
    | ItemAction
    | WorldItemAction
    | PlayerInitAction
    | NpcInitAction
    | QuestAction
    | PlayerAction
    | EquipAction;

export class RunePlugin {

    public actions: RuneActionDirectory[];

    public constructor(actions: RuneActionDirectory | RuneActionDirectory[], questRequirement?: QuestRequirement) {
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
