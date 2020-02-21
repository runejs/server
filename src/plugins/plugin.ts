import { NpcActionPlugin } from '@server/world/mob/player/action/npc-action';
import { ObjectActionPlugin } from '@server/world/mob/player/action/object-action';
import { ButtonActionPlugin } from '@server/world/mob/player/action/button-action';
import { ItemOnItemActionPlugin } from '@server/world/mob/player/action/item-on-item-action';
import { CommandActionPlugin } from '@server/world/mob/player/action/input-command-action';

export enum ActionType {
    BUTTON = 'button',
    ITEM_ON_ITEM = 'item_on_item',
    NPC_ACTION = 'npc_action',
    OBJECT_ACTION = 'object_action',
    COMMAND = 'command'
}

export interface ActionPlugin {
    type: ActionType;
}

export class RunePlugin {

    public actions: (NpcActionPlugin | ObjectActionPlugin | ButtonActionPlugin | ItemOnItemActionPlugin | CommandActionPlugin)[];

    public constructor(actions: NpcActionPlugin | ObjectActionPlugin | ButtonActionPlugin | ItemOnItemActionPlugin |
        (NpcActionPlugin | ObjectActionPlugin | ButtonActionPlugin | ItemOnItemActionPlugin | CommandActionPlugin)[]) {
        if(!Array.isArray(actions)) {
            this.actions = [actions];
        } else {
            this.actions = actions;
        }
    }

}
