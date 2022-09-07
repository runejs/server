import { Chunk } from '@engine/world/map';
import { Position } from '@engine/world/position';

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
};
