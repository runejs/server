import { Player } from '@server/world/actor/player/player';
import { pluginFilter } from '@server/plugins/plugin-loader';
import { Action, questFilter } from '@server/plugins/plugin';
import { World } from '@server/game-server';

/**
 * The definition for a button action function.
 */
export type buttonAction = (buttonActionData: ButtonActionData) => void;

/**
 * Details about a button action.
 */
export interface ButtonActionData {
    // The player performing the action.
    player: Player;
    // The ID of the UI widget that the button is on.
    widgetId: number;
    // The child ID of the button within the UI widget.
    buttonId: number;
}

/**
 * Defines a button interaction plugin.
 */
export interface ButtonAction extends Action {
    // The ID of the UI widget that the button is on.
    widgetId: number;
    // The child ID or list of child IDs of the button(s) within the UI widget.
    buttonIds?: number | number[];
    // The action function to be performed.
    action: buttonAction;
    // Whether or not this item action should cancel other running or queued actions.
    cancelActions?: boolean;
}

/**
 * A directory of all button interaction plugins.
 */
let buttonActions: ButtonAction[] = [
];

/**
 * Sets the list of button interaction plugins.
 * @param actions The plugin list.
 */
export const setButtonActions = (actions: Action[]): void => {
    buttonActions = actions as ButtonAction[];
};

const actionHandler = (player: Player, widgetId: number, buttonId: number): void => {
    // Find all item on item action plugins that match this action
    let interactionActions = buttonActions.filter(plugin => questFilter(player, plugin) &&
        plugin.widgetId === widgetId && (plugin.buttonIds === undefined || pluginFilter(plugin.buttonIds, buttonId)));
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

World.registerActionEventListener('button', actionHandler);
