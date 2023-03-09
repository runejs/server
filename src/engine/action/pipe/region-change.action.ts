import { Player } from '@engine/world/actor';
import { Coords, Position } from '@engine/world';
import { RegionType } from '@engine/world/map';
import { ActionHook, getActionHooks, ActionPipe } from '@engine/action';


/**
 * Defines a player region change action hook.
 */
export interface RegionChangeActionHook extends ActionHook<RegionChangeAction, regionChangeActionHandler> {
    // Optional single region type for the action hook to apply to.
    regionType?: RegionType;
    // Optional multiple region types for the action hook to apply to.
    regionTypes?: RegionType[];
    // Optional teleporting requirement
    teleporting?: boolean;
}


/**
 * The player region change action hook handler function to be called when the hook's conditions are met.
 */
export type regionChangeActionHandler = (regionChangeAction: RegionChangeAction) => void;


/**
 * Details about a player region change action being performed.
 */
export interface RegionChangeAction {
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
 * Creates a RegionChangeAction object from the given inputs.
 *
 * TODO (Jameskmonger) I changed this function's return type to `| null` to satisfy TypeScript,
 *          not sure if this is correct or if the code was just wrong before.
 *
 * @param player The player.
 * @param originalPosition The player's original position.
 * @param currentPosition The player's current position.
 * @param teleporting Whether or not the player is teleporting; defaults to false.
 */
export const regionChangeActionFactory = (player: Player,
    originalPosition: Position, currentPosition: Position,
    teleporting: boolean = false): RegionChangeAction | null => {
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
        regionTypes.push('region');
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


/**
 * The pipe that the game engine hands player region change actions off to.
 * @param actionData
 */
const regionChangeActionPipe = (actionData: RegionChangeAction): void => {
    if(!actionData) {
        return;
    }

    const { regionTypes } = actionData;

    if(!regionTypes || regionTypes.length === 0) {
        return;
    }

    // Find all action hooks that match the provided input
    const actionList = getActionHooks<RegionChangeActionHook>('region_change')?.filter(actionHook => {
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
            if (actionHook && actionHook.handler) {
                actionHook.handler(actionData);
            }

            resolve();
        }));
};


/**
 * Player region change action pipe definition.
 */
export default [ 'region_change', regionChangeActionPipe ] as ActionPipe;
