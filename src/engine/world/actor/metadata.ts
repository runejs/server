import { ConstructedRegion } from '../map';
import { Position } from '../position';
import { Actor } from './actor';

/**
 * The definition of the metadata available on an {@link Actor}.
 *
 * You cannot guarantee that all of these properties will be present on an actor,
 * so you should always check for their existence before using them.
 *
 * @author jameskmonger
 */
export type ActorMetadata = {
    /**
     * The custom constructed map region for this actor.
     *
     * TODO (jameskmonger) Should this live on Actor rather than on {@link Player}? I don't think NPCs can have a custom map.
     */
    customMap: ConstructedRegion;

    /**
     * The player's current target position.
     *
     * Used within the action pipeline.
     */
    walkingTo: Position;

    /**
     * The actor currently being `tailed` by this actor.
     *
     * TODO (jameskmonger) we should delete this - only used by deleted code in the old combat plugin
     */
    tailing: Actor;

    /**
     * The actor currently being followed by this actor.
     */
    following: Actor;

    /**
     * The actor which the local actor is facing towards.
     */
    faceActor: Actor;

    /**
     * Whether a walk action has cleared the actor which the local actor is facing towards.
     *
     * TODO (jameskmonger) does this belong on this metadata?
     */
    faceActorClearedByWalking: boolean;

    /**
     * Set to true if the actor is currently teleporting.
     */
    teleporting: boolean;
};
