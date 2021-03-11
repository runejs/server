import { Npc } from '@engine/world/actor/npc/npc';
import { ActionHook, ActionPipe, getActionHooks } from '@engine/world/action/hooks';
import { basicStringFilter } from '@engine/world/action/hook-filters';


/**
 * Defines an npc init action hook.
 */
export interface NpcInitActionHook extends ActionHook<npcInitActionHandler> {
    // A single NPC key or a list of NPC keys that this action applies to.
    npcs?: string | string[];
}


/**
 * The npc init action hook handler function to be called when the hook's conditions are met.
 */
export type npcInitActionHandler = (npcAction: NpcInitAction) => void;


/**
 * Details about an npc init action being performed.
 */
export interface NpcInitAction {
    // The npc that is being initialized.
    npc: Npc;
}


/**
 * The pipe that the game engine hands npc init actions off to.
 * @param npc
 */
const npcInitActionPipe = ({ npc }: NpcInitAction): void => {
    const actionHooks = getActionHooks<NpcInitActionHook>('npc_init_action')
        .filter(plugin => (!plugin.npcs || basicStringFilter(plugin.npcs, npc.key)));
    actionHooks.forEach(actionHook => actionHook.handler({ npc }));
};


/**
 * Npc init action pipe definition.
 */
export default [ 'npc_init_action', npcInitActionPipe ] as ActionPipe;
