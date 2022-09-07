import { ConstructedRegion } from '../map';

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
     * TODO Should this live on Actor rather than on {@link Player}? I don't think NPCs can have a custom map.
     */
    customMap: ConstructedRegion;

    /**
     * Set to true if the actor is currently teleporting.
     */
    teleporting: boolean;
};
