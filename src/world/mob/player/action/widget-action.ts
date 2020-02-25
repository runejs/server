import { Player } from '@server/world/mob/player/player';
import { pluginFilter } from '@server/plugins/plugin-loader';
import { ActionPlugin } from '@server/plugins/plugin';

/**
 * The definition for a widget action function.
 */
export type widgetAction = (details: WidgetActionDetails) => void;

/**
 * Details about a widget action.
 */
export interface WidgetActionDetails {
    player: Player;
    widgetId: number;
    childId: number;
    optionId: number;
}

/**
 * Defines a widget interaction plugin.
 */
export interface WidgetActionPlugin extends ActionPlugin {
    widgetIds: number | number[];
    childIds?: number | number[];
    optionId?: number;
    action: widgetAction;
    cancelActions?: boolean;
}

/**
 * A directory of all button interaction plugins.
 */
let widgetInteractions: WidgetActionPlugin[] = [
];

/**
 * Sets the list of widget interaction plugins.
 * @param plugins The plugin list.
 */
export const setWidgetPlugins = (plugins: ActionPlugin[]): void => {
    widgetInteractions = plugins as WidgetActionPlugin[];
};

export const widgetAction = (player: Player, widgetId: number, childId: number, optionId: number): void => {
    // Find all item on item action plugins that match this action
    const interactionPlugins = widgetInteractions.filter(plugin => {
        if(!pluginFilter(plugin.widgetIds, widgetId)) {
            return false;
        }

        if(plugin.optionId !== undefined && plugin.optionId !== optionId) {
            return false;
        }

        if(plugin.childIds !== undefined) {
            return pluginFilter(plugin.childIds, childId);
        }

        return true;
    });

    if(interactionPlugins.length === 0) {
        player.packetSender.chatboxMessage(`Unhandled widget option: ${widgetId}, ${childId}:${optionId}`);
        return;
    }

    // Immediately run the plugins
    interactionPlugins.forEach(plugin => {
        if(plugin.cancelActions) {
            player.actionsCancelled.next();
        }

        plugin.action({ player, widgetId, childId, optionId });
    });
};
