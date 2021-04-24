import { Player } from '@engine/world/actor/player/player';
import { Position } from '@engine/world/position';
import { ActionHook, getActionHooks } from '@engine/world/action/hooks';
import { logger } from '@runejs/core';
import { playerWalkTo } from '@engine/game-server';
import { stringHookFilter, questHookFilter } from '@engine/world/action/hooks/hook-filters';
import { RunnableHooks } from '@engine/world/action/index';


/**
 * Defines a player action hook.
 */
export interface PlayerInteractionActionHook extends ActionHook<PlayerInteractionAction, playerInteractionActionHandler> {
    // A single option name or a list of option names that this action applies to.
    options: string | string[];
    // Whether or not the player needs to walk to the other player before performing the action.
    walkTo: boolean;
}


/**
 * The player action hook handler function to be called when the hook's conditions are met.
 */
export type playerInteractionActionHandler = (playerInteractionAction: PlayerInteractionAction) => void;


/**
 * Details about a player action being performed.
 */
export interface PlayerInteractionAction {
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
const playerInteractionActionPipe = (player: Player, otherPlayer: Player, position: Position,
                                     option: string): RunnableHooks<PlayerInteractionAction> => {
    // Find all player action plugins that reference this option
    let matchingHooks = getActionHooks<PlayerInteractionActionHook>('player_interaction')
        .filter(plugin => questHookFilter(player, plugin) && stringHookFilter(plugin.options, option));
    const questActions = matchingHooks.filter(plugin => plugin.questRequirement !== undefined);

    if(questActions.length !== 0) {
        matchingHooks = questActions;
    }

    if(matchingHooks.length === 0) {
        player.sendMessage(`Unhandled Player interaction: ${option} @ ${position.x},${position.y},${position.level}`);
        return null;
    }

    return {
        hooks: matchingHooks,
        actionPosition: position,
        action: {
            player,
            otherPlayer,
            position
        }
    }
};


/**
 * Player action pipe definition.
 */
export default [ 'player_interaction', playerInteractionActionPipe ];
