import { Player } from '@server/world/actor/player/player';
import { pluginFilter } from '@server/plugins/plugin-loader';
import { ActionPlugin, questFilter } from '@server/plugins/plugin';

/**
 * The definition for a button action function.
 */
export type buttonAction = (details: ButtonActionDetails) => void;

/**
 * Details about a button action.
 */
export interface ButtonActionDetails {
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
export interface ButtonActionPlugin extends ActionPlugin {
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
let buttonInteractions: ButtonActionPlugin[] = [
];

/**
 * Sets the list of button interaction plugins.
 * @param plugins The plugin list.
 */
export const setButtonPlugins = (plugins: ActionPlugin[]): void => {
    buttonInteractions = plugins as ButtonActionPlugin[];
};

export const buttonAction = (player: Player, widgetId: number, buttonId: number): void => {
    // Find all item on item action plugins that match this action
    let interactionActions = buttonInteractions.filter(plugin => questFilter(player, plugin) &&
        plugin.widgetId === widgetId && (plugin.buttonIds === undefined || pluginFilter(plugin.buttonIds, buttonId)));
    const questActions = interactionActions.filter(plugin => plugin.questAction !== undefined);

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
