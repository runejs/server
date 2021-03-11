import { Player } from '@engine/world/actor/player/player';
import { ActionHook, getActionHooks } from '@engine/world/action/hooks';
import { advancedNumberFilter, questHookFilter } from '@engine/world/action/hook-filters';


/**
 * Defines a widget action hook.
 */
export interface WidgetActionHook extends ActionHook<widgetActionHandler> {
    // A single UI widget ID or a list of widget IDs that this action applies to.
    widgetIds: number | number[];
    // A single UI widget child ID or a list of child IDs that this action applies to.
    childIds?: number | number[];
    // The context menu option index for this action.
    optionId?: number;
    // Whether or not this item action should cancel other running or queued actions.
    cancelActions?: boolean;
}


/**
 * The widget action hook handler function to be called when the hook's conditions are met.
 */
export type widgetActionHandler = (widgetAction: WidgetAction) => void;


/**
 * Details about a widget action being performed.
 */
export interface WidgetAction {
    // The player performing the action.
    player: Player;
    // The ID of the UI widget that the button is on.
    widgetId: number;
    // The ID of the interacted child within the UI widget.
    childId: number;
    // The selected context menu option index.
    optionId: number;
}


/**
 * The pipe that the game engine hands widget actions off to.
 * @param player The player performing the action.
 * @param widgetId The ID of the widget.
 * @param childId The ID of the widget child being interacted with.
 * @param optionId The widget context option chosen by the player.
 */
const widgetActionPipe = (player: Player, widgetId: number, childId: number, optionId: number): void => {
    // Find all item on item action plugins that match this action
    let interactionActions = getActionHooks<WidgetActionHook>('widget_action').filter(plugin => {
        if(!questHookFilter(player, plugin)) {
            return false;
        }

        if(!advancedNumberFilter(plugin.widgetIds, widgetId)) {
            return false;
        }

        if(plugin.optionId !== undefined && plugin.optionId !== optionId) {
            return false;
        }

        if(plugin.childIds !== undefined) {
            return advancedNumberFilter(plugin.childIds, childId);
        }

        return true;
    });
    const questActions = interactionActions.filter(plugin => plugin.questRequirement !== undefined);

    if(questActions.length !== 0) {
        interactionActions = questActions;
    }

    if(interactionActions.length === 0) {
        player.outgoingPackets.chatboxMessage(`Unhandled widget option: ${widgetId}, ${childId}:${optionId}`);
        return;
    }

    // Immediately run the plugins
    interactionActions.forEach(plugin => {
        if(plugin.cancelActions) {
            player.actionsCancelled.next('widget');
        }

        plugin.handler({ player, widgetId, childId, optionId });
    });
};


/**
 * Widget action pipe definition.
 */
export default [ 'widget_action', widgetActionPipe ];
