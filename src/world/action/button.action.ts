import { Player } from '@server/world/actor/player/player';
import { pluginFilter } from '@server/plugins/plugin-loader';
import { questFilter } from '@server/plugins/plugin';
import { ActionHook, ActionPipe, getActionHooks } from '@server/world/action/index';


/**
 * Defines a button action hook.
 */
export interface ButtonActionHook extends ActionHook {
    // The ID of the UI widget that the button is on.
    widgetId?: number;
    // The IDs of the UI widgets that the buttons are on.
    widgetIds?: number[];
    // The child ID or list of child IDs of the button(s) within the UI widget.
    buttonIds?: number | number[];
    // The function to be performed.
    handler: buttonActionHandler;
    // Whether or not this item action should cancel other running or queued actions.
    cancelActions?: boolean;
}


/**
 * The button action hook handler function to be called when the hook's conditions are met.
 */
export type buttonActionHandler = (buttonAction: ButtonAction) => void | Promise<void>;


/**
 * Details about a button action being performed.
 */
export interface ButtonAction {
    // The player performing the action.
    player: Player;
    // The ID of the UI widget that the button is on.
    widgetId: number;
    // The child ID of the button within the UI widget.
    buttonId: number;
}


const buttonActionPipe = (player: Player, widgetId: number, buttonId: number) => {
    let interactionActions = getActionHooks('button_action')
        .filter(plugin =>
            questFilter(player, plugin) && (
                (plugin.widgetId && plugin.widgetId === widgetId) ||
                (plugin.widgetIds && pluginFilter(plugin.widgetIds, widgetId)
            ))
        && (plugin.buttonIds === undefined ||
            pluginFilter(plugin.buttonIds, buttonId))
        );

    const questActions = interactionActions.filter(plugin => plugin.questRequirement !== undefined);

    if(questActions.length !== 0) {
        interactionActions = questActions;
    }

    if(player.metadata.buttonListener) {
        if(widgetId === player.metadata.buttonListener.widgetId) {
            player.metadata.buttonListener.event.next(buttonId);
        }
    }

    if(interactionActions.length === 0) {
        player.outgoingPackets.chatboxMessage(`Unhandled button interaction: ${widgetId}:${buttonId}`);
        return;
    }

    // Immediately run the plugins
    for(const plugin of interactionActions) {
        if(plugin.cancelActions) {
            player.actionsCancelled.next('button');
        }

        plugin.action({ player, widgetId, buttonId });
    }
};


/**
 * Button action pipe definition.
 */
export default [ 'button_action', buttonActionPipe ] as ActionPipe;
