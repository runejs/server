import { Player } from '@server/world/actor/player/player';
import { pluginFilter } from '@server/plugins/plugin-loader';
import { ActionPlugin } from '@server/plugins/plugin';

/**
 * The definition for a button action function.
 */
export type buttonAction = (details: ButtonActionDetails) => void;

/**
 * Details about a button action.
 */
export interface ButtonActionDetails {
    player: Player;
    widgetId: number;
    buttonId: number;
}

/**
 * Defines a button interaction plugin.
 */
export interface ButtonActionPlugin extends ActionPlugin {
    widgetId: number;
    buttonIds: number | number[];
    action: buttonAction;
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
    const interactionPlugins = buttonInteractions.filter(plugin => plugin.widgetId === widgetId && pluginFilter(plugin.buttonIds, buttonId));

    if(interactionPlugins.length === 0) {
        player.outgoingPackets.chatboxMessage(`Unhandled button interaction: ${widgetId}:${buttonId}`);
        return;
    }

    // Immediately run the plugins
    interactionPlugins.forEach(plugin => {
        if(plugin.cancelActions) {
            player.actionsCancelled.next();
        }

        plugin.action({ player, widgetId, buttonId });
    });
};
