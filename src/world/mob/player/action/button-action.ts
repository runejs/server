import { Player } from '@server/world/mob/player/player';
import { pluginFilter } from '@server/plugins/plugin-loader';

/**
 * The definition for a button action function.
 */
export type buttonAction = (details: ButtonActionDetails) => void;

/**
 * Details about a button action.
 */
export interface ButtonActionDetails {
    player: Player;
    buttonId: number;
}

/**
 * Defines a button interaction plugin.
 */
export interface ButtonActionPlugin {
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
export const setButtonPlugins = (plugins: ButtonActionPlugin[]): void => {
    buttonInteractions = plugins;
};

export const buttonAction = (player: Player, buttonId: number): void => {
    // Find all item on item action plugins that match this action
    const interactionPlugins = buttonInteractions.filter(plugin => pluginFilter(plugin.buttonIds, buttonId));

    if(interactionPlugins.length === 0) {
        player.packetSender.chatboxMessage(`Unhandled button interaction: ${buttonId}`);
        return;
    }

    // Immediately run the plugins
    interactionPlugins.forEach(plugin => {
        if(plugin.cancelActions) {
            player.actionsCancelled.next();
        }

        plugin.action({ player, buttonId });
    });
};
