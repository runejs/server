import { Player } from '@engine/world/actor/player/player';
import { ActionHook, getActionHooks } from '@engine/world/action/hooks';
import { advancedNumberHookFilter, questHookFilter } from '@engine/world/action/hooks/hook-filters';
import { ActionPipe, RunnableHooks } from '@engine/world/action/index';


/**
 * Defines a button action hook.
 */
export interface ButtonActionHook extends ActionHook<ButtonAction, buttonActionHandler> {
    // The ID of the UI widget that the button is on.
    widgetId?: number;
    // The IDs of the UI widgets that the buttons are on.
    widgetIds?: number[];
    // The child ID or list of child IDs of the button(s) within the UI widget.
    buttonIds?: number | number[];
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


/**
 * The pipe that the game engine hands button actions off to.
 * @param player
 * @param widgetId
 * @param buttonId
 */
const buttonActionPipe = (player: Player, widgetId: number, buttonId: number): RunnableHooks<ButtonAction> => {
    let matchingHooks = getActionHooks<ButtonActionHook>('button')
        .filter(plugin =>
            questHookFilter(player, plugin) && (
                (plugin.widgetId && plugin.widgetId === widgetId) ||
                (plugin.widgetIds && advancedNumberHookFilter(plugin.widgetIds, widgetId)
                ))
        && (plugin.buttonIds === undefined ||
            advancedNumberHookFilter(plugin.buttonIds, buttonId))
        );

    const questActions = matchingHooks.filter(plugin => plugin.questRequirement !== undefined);

    if(questActions.length !== 0) {
        matchingHooks = questActions;
    }

    if(player.metadata.buttonListener) {
        if(widgetId === player.metadata.buttonListener.widgetId) {
            player.metadata.buttonListener.event.next(buttonId);
        }
    }

    if(matchingHooks.length === 0) {
        player.outgoingPackets.chatboxMessage(`Unhandled button interaction: ${widgetId}:${buttonId}`);
        return null;
    }

    return {
        hooks: matchingHooks,
        action: {
            player, widgetId, buttonId
        }
    };
};


/**
 * Button action pipe definition.
 */
export default [ 'button', buttonActionPipe ] as ActionPipe;
