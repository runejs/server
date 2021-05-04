/**
 * Different types of world regions.
 * map: 64x64 tile (13x13 tile chunks) full map region file.
 * chunk: 8x8 tile chunk within a map.
 */
import { Position } from '@engine/world/position';
import { Room } from '@plugins/skills/construction/con-house';

export type RegionType = 'map' | 'chunk';

/**
 * A type for defining region tile sizes.
 */
export type RegionSizeMap = {
    [key in RegionType]: number;
};

/**
 * A map of region types to tile sizes.
 */
export const regionSizes: RegionSizeMap = {
    'map': 64,
    'chunk': 8
};


export interface ConstructedMap {
    position: Position;
    rooms: Room[][][];
    centerOffsetX?: number;
    centerOffsetY?: number;
}


export const getRotatedObjectX = (orientation: number, localX: number, localY: number): number => {
    if(orientation === 0) {
        return localX;
    }
    if(orientation === 1) {
        if(localX === 7) {
            return localY;
        } else {
            return 7 - localY;
        }
    }
    if(orientation === 2) {
        if(localY === 0) {
            return localX;
        } else {
            return 7 - localX;
        }
    }
    return localY;
};

export const getRotatedObjectY = (orientation: number, localX: number, localY: number): number => {
    if(orientation === 0) {
        return localY;
    }
    if(orientation === 1) {
        return localX;
    }
    if(orientation === 2) {
        return 7 - localY;
    }
    return 7 - localX;
};
