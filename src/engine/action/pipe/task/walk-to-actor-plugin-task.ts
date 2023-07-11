import { LandscapeObject } from '@runejs/filestore';
import { ActorLandscapeObjectInteractionTask } from '@engine/task/impl';
import { Actor, Npc, Player } from '@engine/world/actor';
import { ObjectInteractionAction } from '../object-interaction.action';
import { ItemOnObjectAction } from '../item-on-object.action';
import { ActionHook } from '@engine/action/hook';
import { NpcInteractionAction } from '../npc-interaction.action';
import { ActorActorInteractionTask } from '@engine/task/impl/actor-actor-interaction-task';

/**
 * All actions supported by this plugin task.
 */
type ActorAction = NpcInteractionAction;

/**
 * An ActionHook for a supported ObjectAction.
 */
type ActorActionHook<TAction extends ActorAction> = ActionHook<TAction, (data: TAction) => void>;

type ActorKey = 'npc';

/**
 * The data unique to the action being executed (i.e. excluding shared data)
 */
type ActorActionData<TAction extends ActorAction> = Omit<TAction, 'player' | ActorKey | 'position'>;

/**
* This is a task to migrate old `walkTo` item interaction actions to the new task system.
*
* This is a first-pass implementation to allow for removal of the old action system.
* It will be refactored in future to be more well suited to our plugin system.
*/
export class WalkToActorPluginTask<TAction extends ActorAction, TActorKey extends ActorKey, TOtherActor extends Actor> extends ActorActorInteractionTask<Player, TOtherActor> {
    /**
     * The plugins to execute when the player arrives at the object.
     */
    private plugins: ActorActionHook<TAction>[];

    private data: ActorActionData<TAction>;

    private actorKey: TActorKey;

    constructor(plugins: ActorActionHook<TAction>[], player: Player, actorKey: TActorKey, other: TOtherActor, data: ActorActionData<TAction>) {
        super(
            player,
            other,
        );

        this.plugins = plugins;
        this.data = data;
        this.actorKey = actorKey;
    }

    /**
     * Executed every tick to check if the player has arrived yet and calls the plugins if so.
     */
    public execute(): void {
        // call super to manage waiting for the movement to complete
        super.execute();

        // check if the player has arrived yet
        const other = this.other;
        const otherPosition = this.other?.position;
        if (!other || !otherPosition) {
            return;
        }

        // call the relevant plugins
        this.plugins.forEach(plugin => {
            if (!plugin || !plugin.handler) {
                return;
            }

            const action = {
                player: this.actor,
                position: otherPosition,
                [this.actorKey]: other,
                ...this.data
            };

            // I wish I didn't have to cast here, but TypeScript is making it difficult
            plugin.handler(action as unknown as TAction);
        });

        // this task only executes once, on arrival
        this.stop();
    }
}
