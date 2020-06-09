import { ItemOnObjectActionPlugin } from '@server/world/actor/player/action/item-on-object-action';
import { ItemOnNpcActionPlugin } from '@server/world/actor/player/action/item-on-npc-action';
import { NpcActionPlugin } from '@server/world/actor/player/action/npc-action';
import { CommandActionPlugin } from '@server/world/actor/player/action/input-command-action';
import { WidgetActionPlugin } from '@server/world/actor/player/action/widget-action';
import { ObjectActionPlugin } from '@server/world/actor/player/action/object-action';
import { NpcInitPlugin } from '@server/world/actor/npc/npc';
import { Player, PlayerInitPlugin } from '@server/world/actor/player/player';
import { ItemOnItemActionPlugin } from '@server/world/actor/player/action/item-on-item-action';
import { ButtonActionPlugin } from '@server/world/actor/player/action/button-action';
import { WorldItemActionPlugin } from '@server/world/actor/player/action/world-item-action';
import { ItemActionPlugin } from '@server/world/actor/player/action/item-action';
import { QuestPlugin } from '@server/world/config/quests';
import { PlayerActionPlugin } from '@server/world/actor/player/action/player-action';

export enum ActionType {
    BUTTON = 'button',
    WIDGET_ACTION = 'widget_action',
    ITEM_ON_ITEM_ACTION = 'item_on_item_action',
    ITEM_ACTION = 'item_action',
    WORLD_ITEM_ACTION = 'world_item_action',
    NPC_ACTION = 'npc_action',
    OBJECT_ACTION = 'object_action',
    ITEM_ON_OBJECT_ACTION = 'item_on_object_action',
    ITEM_ON_NPC_ACTION = 'item_on_npc_action',
    COMMAND = 'command',
    PLAYER_INIT = 'player_init',
    NPC_INIT = 'npc_init',
    QUEST = 'quest',
    PLAYER_ACTION = 'player_action',
}

export interface QuestAction {
    questId: string;
    stage: string;
}

export interface ActionPlugin {
    // The type of action to perform.
    type: ActionType;
    // [optional] Details regarding what quest this action is for.
    questAction?: QuestAction;
}

export function sort(plugins: ActionPlugin[]): ActionPlugin[] {
    return plugins.sort(plugin => plugin.questAction !== undefined ? -1 : 1);
}

export function questFilter(player: Player, plugin: ActionPlugin): boolean {
    if(!plugin.questAction) {
        return true;
    }

    const questId = plugin.questAction.questId;
    const playerQuest = player.quests.find(quest => quest.questId === questId);
    if(!playerQuest) {
        // @TODO quest requirements
        return plugin.questAction.stage === 'NOT_STARTED';
    }

    return playerQuest.stage === plugin.questAction.stage;
}

export type RunePluginAction = NpcActionPlugin | ObjectActionPlugin | ButtonActionPlugin | ItemOnItemActionPlugin | ItemOnObjectActionPlugin | ItemOnNpcActionPlugin |
    CommandActionPlugin | WidgetActionPlugin | ItemActionPlugin | WorldItemActionPlugin | PlayerInitPlugin | NpcInitPlugin | QuestPlugin | PlayerActionPlugin;

export class RunePlugin {

    public actions: RunePluginAction[];

    public constructor(actions: RunePluginAction | RunePluginAction[], quest?: QuestAction) {
        if(!Array.isArray(actions)) {
            if(quest !== undefined && !actions.questAction) {
                actions.questAction = quest;
            }
            this.actions = [actions];
        } else {
            if(quest !== undefined) {
                actions.forEach(action => {
                    if(!action.questAction) {
                        action.questAction = quest;
                    }
                });
            }
            this.actions = actions;
        }
    }

}
