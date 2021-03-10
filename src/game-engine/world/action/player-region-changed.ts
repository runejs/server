import { Player } from '@engine/world/actor/player/player';
import { Coords, Position } from '@engine/world/position';
import { ActionHook, getActionHooks } from '@engine/world/action/hooks';
import { RegionType } from '@engine/world/map/region';


/**
 * The definition for a player action function.
 */
export type playerRegionChangedHook = (playerActionData: PlayerRegionChangedData) => void;

/**
 * Details about a player being interacted with.
 */
export interface PlayerRegionChangedData {
    // The player performing the action.
    player: Player;
    // Whether or not the player is teleporting to their new location
    teleporting: boolean;
    // The original position that the player was at before moving to the new region.
    originalPosition: Position;
    // The position that the player ended up at in the new region.
    currentPosition: Position;
    // The player's original chunk coordinates
    originalChunkCoords: Coords;
    // The player's current chunk coordinates
    currentChunkCoords: Coords;
    // The player's original map region coordinates
    originalMapRegionCoords: Coords;
    // The player's current map region coordinates
    currentMapRegionCoords: Coords;
    // The player's original map region id
    originalMapRegionId: number;
    // The player's current map region id
    currentMapRegionId: number;
    // The region types that changed for the player.
    regionTypes: RegionType[];
}

/**
 * Defines a player region changed action.
 */
export interface PlayerRegionChangedAction extends ActionHook {
    // The action function to be performed.
    handler: playerRegionChangedHook;
    // Optional single region type for the action hook to apply to.
    regionType?: RegionType;
    // Optional multiple region types for the action hook to apply to.
    regionTypes?: RegionType[];
    // Optional teleporting requirement
    teleporting?: boolean;
}

/**
 * Creates a PlayerRegionChangedData object from the given inputs.
 * @param player The player.
 * @param originalPosition The player's original position.
 * @param currentPosition The player's current position.
 * @param teleporting Whether or not the player is teleporting; defaults to false.
 */
export const regionChangedDataFactory = (player: Player,
                                         originalPosition: Position, currentPosition: Position,
                                         teleporting: boolean = false): PlayerRegionChangedData => {
    const regionTypes: RegionType[] = [];
    const originalMapRegionId: number = ((originalPosition.x >> 6) << 8) + (originalPosition.y >> 6);
    const currentMapRegionId: number = ((currentPosition.x >> 6) << 8) + (currentPosition.y >> 6);
    const originalChunkCoords: Coords = {
        x: originalPosition.chunkX,
        y: originalPosition.chunkY,
        level: originalPosition.level
    };
    const currentChunkCoords: Coords = {
        x: currentPosition.chunkX,
        y: currentPosition.chunkY,
        level: currentPosition.level
    };

    if(originalMapRegionId !== currentMapRegionId) {
        regionTypes.push('map');
    }

    if(!Coords.equals(originalChunkCoords, currentChunkCoords)) {
        regionTypes.push('chunk');
    }

    if(regionTypes.length === 0) {
        return null;
    }

    return {
        player, regionTypes, teleporting,

        originalPosition,
        originalChunkCoords,
        originalMapRegionCoords: {
            x: originalPosition.x >> 6,
            y: originalPosition.y >> 6,
            level: originalPosition.level
        },
        originalMapRegionId,

        currentPosition: player.position,
        currentChunkCoords,
        currentMapRegionCoords: {
            x: currentPosition.x >> 6,
            y: currentPosition.y >> 6,
            level: currentPosition.level
        },
        currentMapRegionId
    };
};

const playerRegionChangedHandler = (actionData: PlayerRegionChangedData): void => {
    if(!actionData) {
        return;
    }

    const { regionTypes } = actionData;

    if(!regionTypes || regionTypes.length === 0) {
        return;
    }

    // Find all action hooks that match the provided input
    const actionList = getActionHooks('player_region_changed')?.filter((actionHook: PlayerRegionChangedAction) => {
        if(actionHook.teleporting && !actionData.teleporting) {
            return false;
        }

        if(actionHook.regionType) {
            return regionTypes.indexOf(actionHook.regionType) !== -1;
        } else if(actionHook.regionTypes && actionHook.regionTypes.length !== 0) {
            let valid = false;
            for(const type of actionHook.regionTypes) {
                if(regionTypes.indexOf(type) !== -1) {
                    valid = true;
                    break;
                }
            }

            return valid;
        }

        return false;
    }) || null;

    if(!actionList || actionList.length === 0) {
        // No matching actions found
        return;
    }

    actionList.forEach(async actionHook =>
        new Promise<void>(resolve => {
            actionHook.handler(actionData);
            resolve();
        }));
};

export default {
    action: 'player_region_changed',
    handler: playerRegionChangedHandler
};
