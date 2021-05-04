/**
 * Different types of world regions.
 * map: 64x64 tile (13x13 tile chunks) full map region file.
 * chunk: 8x8 tile chunk within a map.
 */
import { Position } from '@engine/world/position';
import { Room } from '@plugins/skills/construction/con-house';


export type RegionType = 'mapfile' | 'region' | 'chunk';

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
    'mapfile': 104,
    'region': 64,
    'chunk': 8
};


export abstract class ConstructedChunk {

    public rotation: number;

    protected constructor(rotation: number = 0) {
        this.rotation = rotation;
    }

    public abstract getTemplatePosition(): Position;

    public get templatePosition(): Position {
        return this.getTemplatePosition();
    }

}

export interface ConstructedRegion {
    renderPosition: Position;
    chunks: ConstructedChunk[][][];
    drawOffsetX?: number;
    drawOffsetY?: number;
}


export const getRotatedLocalX = (orientation: number, localX: number, localY: number): number => {
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

export const getRotatedLocalY = (orientation: number, localX: number, localY: number): number => {
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
