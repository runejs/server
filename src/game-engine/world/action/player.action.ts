import { Player } from '@engine/world/actor/player/player';
import { Position } from '@engine/world/position';
import { ActionHook, getActionHooks } from '@engine/world/action/hooks';
import { logger } from '@runejs/core';
import { playerWalkTo } from '@engine/game-server';
import { basicStringFilter, questHookFilter } from '@engine/world/action/hook-filters';


/**
 * Defines a player action hook.
 */
export interface PlayerActionHook extends ActionHook<playerActionHandler> {
    // A single option name or a list of option names that this action applies to.
    options: string | string[];
    // Whether or not the player needs to walk to the other player before performing the action.
    walkTo: boolean;
}


/**
 * The player action hook handler function to be called when the hook's conditions are met.
 */
export type playerActionHandler = (playerAction: PlayerAction) => void;


/**
 * Details about a player action being performed.
 */
export interface PlayerAction {
    // The player performing the action.
    player: Player;
    // The player that the action is being performed on.
    otherPlayer: Player;
    // The position that the other player was at when the action was initiated.
    position: Position;
}


/**
 * The pipe that the game engine hands player actions off to.
 * @param player
 * @param otherPlayer
 * @param position
 * @param option
 */
const playerActionPipe = (player: Player, otherPlayer: Player, position: Position, option: string): void => {
    if(player.busy) {
        return;
    }

    // Find all player action plugins that reference this option
    let interactionActions = getActionHooks<PlayerActionHook>('player_action')
        .filter(plugin => questHookFilter(player, plugin) && basicStringFilter(plugin.options, option));
    const questActions = interactionActions.filter(plugin => plugin.questRequirement !== undefined);

    if(questActions.length !== 0) {
        interactionActions = questActions;
    }

    if(interactionActions.length === 0) {
        player.sendMessage(`Unhandled Player interaction: ${option} @ ${position.x},${position.y},${position.level}`);
        return;
    }

    player.actionsCancelled.next(null);

    // Separate out walk-to actions from immediate actions
    const walkToPlugins = interactionActions.filter(plugin => plugin.walkTo);
    const immediatePlugins = interactionActions.filter(plugin => !plugin.walkTo);

    // Make sure we walk to the other player before running any of the walk-to plugins
    if(walkToPlugins.length !== 0) {
        playerWalkTo(player, position)
            .then(() => {
                player.face(otherPlayer);
                walkToPlugins.forEach(plugin => plugin.handler({ player, otherPlayer, position }));
            })
            .catch(() => logger.warn(`Unable to complete walk-to action.`));
    }

    // Immediately run any non-walk-to plugins
    if(immediatePlugins.length !== 0) {
        immediatePlugins.forEach(plugin => plugin.handler({ player, otherPlayer, position }));
    }
};


/**
 * Player action pipe definition.
 */
export default [ 'player_action', playerActionPipe ];
