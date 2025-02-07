import type { ActionHook } from '@engine/action/hook/action-hook';
import type { ItemOnNpcAction } from '@engine/action/pipe/item-on-npc.action';
import type { ItemOnPlayerAction } from '@engine/action/pipe/item-on-player.action';
import type { NpcInteractionAction } from '@engine/action/pipe/npc-interaction.action';
import type { PlayerInteractionAction } from '@engine/action/pipe/player-interaction.action';
import { ActorActorInteractionTask } from '@engine/task/impl/actor-actor-interaction-task';
import type { Actor } from '@engine/world/actor/actor';
import type { Player } from '@engine/world/actor/player/player';

/**
 * All actions supported by this plugin task.
 */
type ActorAction = PlayerInteractionAction | ItemOnPlayerAction | NpcInteractionAction | ItemOnNpcAction;

/**
 * An ActionHook for a supported ObjectAction.
 */
type ActorActionHook<TAction extends ActorAction> = ActionHook<TAction, (data: TAction) => void>;

type ActorKey = 'otherPlayer' | 'npc';

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
export class WalkToActorPluginTask<
    TAction extends ActorAction,
    TActorKey extends ActorKey,
    TOtherActor extends Actor,
> extends ActorActorInteractionTask<Player, TOtherActor> {
    /**
     * The plugins to execute when the player arrives at the object.
     */
    private plugins: ActorActionHook<TAction>[];

    private data: ActorActionData<TAction>;

    private actorKey: TActorKey;

    constructor(
        plugins: ActorActionHook<TAction>[],
        player: Player,
        actorKey: TActorKey,
        other: TOtherActor,
        data: ActorActionData<TAction>,
    ) {
        super(player, other);

        this.plugins = plugins;
        this.data = data;
        this.actorKey = actorKey;
    }

    /**
     * Executed every tick to check if the player has arrived yet and calls the plugins if so.
     */
    public async execute(): Promise<void> {
        // call super to manage waiting for the movement to complete
        await super.execute();

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
                ...this.data,
            };

            // I wish I didn't have to cast here, but TypeScript is making it difficult
            plugin.handler(action as unknown as TAction);
        });

        // this task only executes once, on arrival
        this.stop();
    }
}
