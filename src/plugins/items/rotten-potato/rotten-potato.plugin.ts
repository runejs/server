import { widgets } from '@engine/config';
import spawnPotato from '@plugins/items/rotten-potato/hooks/rotten-potato-command-hook';
import itemOnPotato from '@plugins/items/rotten-potato/hooks/rotten-potato-item-on-item';
import { ExecuteIfAdmin, RottenPotatoItem } from '@plugins/items/rotten-potato/helpers/rotten-potato-helpers';
import peelPotato from '@plugins/items/rotten-potato/hooks/rotten-potato-peel';
import { potatoOnPlayer, potatoManipulatePlayerInventory } from '@plugins/items/rotten-potato/hooks/rotten-potato-item-on-player';
import eatPotato from '@plugins/items/rotten-potato/hooks/rotten-potato-eat';
import { travelMenuInteract } from '@plugins/items/rotten-potato/helpers/rotten-potato-travel';
import { WidgetInteractionActionHook } from '@engine/world/action/widget-interaction.action';

export default {
    pluginId: 'promises:rotten-potato',
    hooks: [
        {
            type: 'item_interaction',
            widgets: widgets.inventory,
            itemIds: RottenPotatoItem.gameId,
            options: 'peel',
            handler: (details) => ExecuteIfAdmin(details, peelPotato),
            cancelOtherActions: true
        },
        {
            type: 'item_interaction',
            widgets: widgets.inventory,
            itemIds: RottenPotatoItem.gameId,
            options: 'eat',
            handler: (details) => ExecuteIfAdmin(details, eatPotato),
            cancelOtherActions: true
        },
        {
            type: 'item_on_player',
            itemIds: RottenPotatoItem.gameId,
            handler: (details) => ExecuteIfAdmin(details, potatoOnPlayer),
            walkTo: false
        },
        {
            type: 'player_command',
            commands: [ 'potato' ],
            handler: (details) => ExecuteIfAdmin(details, spawnPotato),
            cancelOtherActions: true
        },
        {
            type: 'item_on_item',
            items: [{ item1: RottenPotatoItem.gameId }],
            handler: (details) => ExecuteIfAdmin(details, itemOnPotato),
            cancelOtherActions: true
        },
        {
            type: 'item_interaction',
            widgets: { ...widgets.bank.depositBoxWidget, widgetId: 3100001 },
            options: [ 'deposit-1', 'deposit-5', 'deposit-10', 'deposit-all' ],
            handler: (details) => ExecuteIfAdmin(details, potatoManipulatePlayerInventory),
        },
        {
            type: 'widget_interaction',
            widgetIds: 3100002,
            handler: (details) => ExecuteIfAdmin(details, travelMenuInteract),
            multi: true
        } as WidgetInteractionActionHook
    ]
};
