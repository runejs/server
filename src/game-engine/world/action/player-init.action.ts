import { ActionHook, getActionHooks } from '@engine/world/action/hooks';
import { Player } from '@engine/world/actor/player/player';
import { ActionPipe } from '@engine/world/action/index';


/**
 * Defines a player init action hook.
 */
export type PlayerInitActionHook = ActionHook<PlayerInitAction, playerInitActionHandler>;


/**
 * The player init action hook handler function to be called when the hook's conditions are met.
 */
export type playerInitActionHandler = (playerInitAction: PlayerInitAction) => void;


/**
 * Details about a player init action being performed.
 */
export interface PlayerInitAction {
    // The player that is being initialized.
    player: Player;
}


/**
 * The pipe that the game engine hands player init actions off to.
 * @param player
 */
const playerInitActionPipe = ({ player }: PlayerInitAction): void => {
    const actionHooks = getActionHooks<PlayerInitActionHook>('player_init');
    actionHooks.forEach(actionHook => actionHook.handler({ player }));
};


/**
 * Player init action pipe definition.
 */
export default [ 'player_init', playerInitActionPipe ] as ActionPipe;
