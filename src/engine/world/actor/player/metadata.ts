import { Subject, Subscription } from 'rxjs';
import { Chunk } from '@engine/world/map';
import { Position } from '@engine/world/position';
import { LandscapeObject } from '@runejs/filestore';

/**
 * The definition of the metadata directly available on a {@link Player}.
 *
 * This is a subset of the metadata available on an {@link Actor}. See {@link ActorMetadata} for more information.
 *
 * You cannot guarantee that all of these properties will be present on an actor,
 * so you should always check for their existence before using them.
 *
 * @author jameskmonger
 */
export type PlayerMetadata = {
    /**
     * The player's client configuration options (varps).
     */
    configs: number[];

    /**
     * The player's current and previous chunks.
     */
    updateChunk: {
        oldChunk: Chunk;
        newChunk: Chunk;
    };

    /**
     * The player's last position before teleporting.
     */
    lastPosition: Position;

    /**
     * Used to prevent the `object_interaction` pipe from running.
     *
     * TODO (jameskmonger) We should probably deprecate this, it seems like it's already been
     *          replaced by the `busy` property which is itself deprecated. This is only
     *          used in Goblin Diplomacy.
     */
    blockObjectInteractions: boolean;

    /**
     * The player's currently open shop.
     *
     * TODO (jameskmonger) This is currently an instance of `Shop`. We shouldn't be storing whole instances of classes in the metadata.
     */
    lastOpenedShop: any;

    /**
     * A subscription to the player's "widget closed" events.
     *
     * Used to remove a player from a shop when they close the shop's widget.
     */
    shopCloseListener: Subscription;

    /**
     * Allows listening to a player clicking on the tab at the specified index.
     *
     * The `event` property is a `Subject` that will emit a `boolean` value when the player clicks on the tab.
     *
     * TODO (jameskmonger) This is only used in Goblin Diplomacy. It is only present when the player is taking part
     *                  in Goblin Displomacy.
     */
    tabClickEvent: {
        tabIndex: number;
        event: Subject<boolean>;
    };

    /**
     * Used to process dialogue trees.
     */
    dialogueIndices: Record<string, number>;

    /**
     * The player's current dialogue tree.
     *
     * This is a `ParsedDialogueTree` type, but that type is not exported.
     */
    dialogueTree: any;

    /**
     * A list of custom landscape objects that have been spawned by the player.
     *
     * Initialised by, and used by, the `spawn-scenery` command.
     */
    spawnedScenery: LandscapeObject[];

    /**
     * The last custom landscape object that was spawned by the player.
     *
     * Used to provide `undo` functionality to the `spawn-scenery` command.
     */
    lastSpawnedScenery: LandscapeObject;

    /**
     * The timestamp of the last time the player lit a fire.
     *
     * Used to prevent the player from lighting fires too quickly.
     *
     * TODO (jameskmonger) this should not be using Dates for timing and will be converted in the new task system
     */
    lastFire: number;

    /**
     * The ID of the player's currently open skill guide.
     */
    activeSkillGuide: number;
};
