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

export enum ActionType {
    BUTTON = 'button',
    WIDGET_ACTION = 'widget_action',
    ITEM_ON_ITEM = 'item_on_item',
    ITEM_ACTION = 'item_action',
    WORLD_ITEM_ACTION = 'world_item_action',
    NPC_ACTION = 'npc_action',
    OBJECT_ACTION = 'object_action',
    ITEM_ON_OBJECT_ACTION = 'item_on_object_action',
    ITEM_ON_NPC_ACTION = 'item_on_npc_action',
    COMMAND = 'command',
    PLAYER_INIT = 'player_init',
    NPC_INIT = 'npc_init'
}

export interface QuestAction {
    questId: number;
    stage: string;
}

export interface ActionPlugin {
    type: ActionType;
    quest?: QuestAction;
}

export function sort(plugins: ActionPlugin[]): ActionPlugin[] {
    return plugins.sort(plugin => plugin.quest !== undefined ? -1 : 1);
}

export function questFilter(player: Player, plugin: ActionPlugin): boolean {
    if(!plugin.quest) {
        return true;
    }

    const questId = plugin.quest.questId;
    const playerQuest = player.quests.find(quest => quest.questId === questId);
    if(!playerQuest) {
        // @TODO quest requirements
        return plugin.quest.stage === 'NOT_STARTED';
    }

    return playerQuest.stage === plugin.quest.stage;
}

export class RunePlugin {

    public actions: (NpcActionPlugin | ObjectActionPlugin | ButtonActionPlugin | ItemOnItemActionPlugin | ItemOnObjectActionPlugin | ItemOnNpcActionPlugin |
        CommandActionPlugin | WidgetActionPlugin | ItemActionPlugin | WorldItemActionPlugin | PlayerInitPlugin | NpcInitPlugin)[];

    public constructor(actions: NpcActionPlugin | ObjectActionPlugin | ButtonActionPlugin | ItemOnItemActionPlugin | ItemOnObjectActionPlugin |
        CommandActionPlugin | WidgetActionPlugin | ItemActionPlugin | WorldItemActionPlugin | PlayerInitPlugin | NpcInitPlugin | ItemOnNpcActionPlugin |
        (NpcActionPlugin | ObjectActionPlugin | ButtonActionPlugin | ItemOnItemActionPlugin | ItemOnObjectActionPlugin | ItemOnNpcActionPlugin |
            CommandActionPlugin | WidgetActionPlugin | ItemActionPlugin | WorldItemActionPlugin | PlayerInitPlugin | NpcInitPlugin)[], quest?: QuestAction) {
        if(!Array.isArray(actions)) {
            if(quest !== undefined && !actions.quest) {
                actions.quest = quest;
            }
            this.actions = [actions];
        } else {
            if(quest !== undefined) {
                actions.forEach(action => {
                    if(!action.quest) {
                        action.quest = quest;
                    }
                });
            }
            this.actions = actions;
        }
    }

}
