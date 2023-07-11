import { LandscapeObject, ObjectConfig } from '@runejs/filestore';
import { ActorLandscapeObjectInteractionTask, ActorWorldItemInteractionTask } from '@engine/task/impl';
import { WorldItem } from '@engine/world';
import { Player } from '@engine/world/actor';
import { SpawnedItemInteractionHook } from '../spawned-item-interaction.action';
import { ObjectInteractionAction, ObjectInteractionActionHook } from '../object-interaction.action';
import { ItemOnObjectAction, ItemOnObjectActionHook } from '../item-on-object.action';
import { ItemOnItemAction } from '../item-on-item.action';
import { ActionHook } from '@engine/action/hook';

type ObjectAction = ObjectInteractionAction | ItemOnObjectAction;
type ObjectActionHook<TAction extends ObjectAction> = ActionHook<TAction, (data: TAction) => void>;
type ObjectActionData<TAction extends ObjectAction> = Omit<TAction, 'player' | 'object' | 'position'>;

/**
* This is a task to migrate old `walkTo` item interaction actions to the new task system.
*
* This is a first-pass implementation to allow for removal of the old action system.
* It will be refactored in future to be more well suited to our plugin system.
*/
export class WalkToObjectPluginTask<TAction extends ObjectAction> extends ActorLandscapeObjectInteractionTask<Player> {
    /**
     * The plugins to execute when the player arrives at the object.
     */
    private plugins: ObjectActionHook<TAction>[];

    private data: ObjectActionData<TAction>;

    constructor(plugins: ObjectActionHook<TAction>[], player: Player, landscapeObject: LandscapeObject, data: ObjectActionData<TAction>) {
        super(
            player,
            landscapeObject,
            // TODO (jkm) handle object size
            // TODO (jkm) pass orientation instead of size
            1,
            1,
        );

        this.plugins = plugins;
        this.data = data;
    }

    /**
     * Executed every tick to check if the player has arrived yet and calls the plugins if so.
     */
    public execute(): void {
        // call super to manage waiting for the movement to complete
        super.execute();

        // check if the player has arrived yet
        const landscapeObject = this.landscapeObject;
        const landscapeObjectPosition = this.landscapeObjectPosition;
        if (!landscapeObject || !landscapeObjectPosition) {
            return;
        }

        // call the relevant plugins
        this.plugins.forEach(plugin => {
            if (!plugin || !plugin.handler) {
                return;
            }

            const action = {
                player: this.actor,
                object: landscapeObject,
                position: landscapeObjectPosition,
                ...this.data
            } as TAction;

            plugin.handler(action);
        });

        // this task only executes once, on arrival
        this.stop();
    }
}
