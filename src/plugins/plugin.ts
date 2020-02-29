import { NpcActionPlugin } from '@server/world/actor/player/action/npc-action';
import { ObjectActionPlugin } from '@server/world/actor/player/action/object-action';
import { ButtonActionPlugin } from '@server/world/actor/player/action/button-action';
import { ItemOnItemActionPlugin } from '@server/world/actor/player/action/item-on-item-action';
import { CommandActionPlugin } from '@server/world/actor/player/action/input-command-action';
import { WidgetActionPlugin } from '@server/world/actor/player/action/widget-action';
import { ItemActionPlugin } from '@server/world/actor/player/action/item-action';
import { WorldItemActionPlugin } from '@server/world/actor/player/action/world-item-action';
import { ItemOnObjectActionPlugin } from '@server/world/actor/player/action/item-on-object-action';

export enum ActionType {
    BUTTON = 'button',
    WIDGET_ACTION = 'widget_action',
    ITEM_ON_ITEM = 'item_on_item',
    ITEM_ACTION = 'item_action',
    WORLD_ITEM_ACTION = 'world_item_action',
    NPC_ACTION = 'npc_action',
    OBJECT_ACTION = 'object_action',
    ITEM_ON_OBJECT_ACTION = 'item_on_object_action',
    COMMAND = 'command'
}

export interface ActionPlugin {
    type: ActionType;
}

export class RunePlugin {

    public actions: (NpcActionPlugin | ObjectActionPlugin | ButtonActionPlugin | ItemOnItemActionPlugin | ItemOnObjectActionPlugin |
        CommandActionPlugin | WidgetActionPlugin | ItemActionPlugin | WorldItemActionPlugin)[];

    public constructor(actions: NpcActionPlugin | ObjectActionPlugin | ButtonActionPlugin | ItemOnItemActionPlugin | ItemOnObjectActionPlugin |
        CommandActionPlugin | WidgetActionPlugin | ItemActionPlugin | WorldItemActionPlugin |
        (NpcActionPlugin | ObjectActionPlugin | ButtonActionPlugin | ItemOnItemActionPlugin |
            CommandActionPlugin | WidgetActionPlugin | ItemActionPlugin | WorldItemActionPlugin)[]) {
        if (!Array.isArray(actions)) {
            this.actions = [actions];
        } else {
            this.actions = actions;
        }
    }

}
