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




export const getTemplateRotatedX = (orientation: number, localX: number, localY: number,
                                    sizeX: number = 1, sizeY: number = 1): number => {
    if(orientation === 1 || orientation === 3) {
        const i = sizeX;
        sizeX = sizeY;
        sizeY = i;
    }

    if(orientation === 0) {
        return localX;
    }
    if(orientation === 1) {
        return 7 - (localY - sizeY + 1);
    }
    if(orientation === 2) {
        return 7 - (localX + sizeX + 1);
    }
    return localY;
};

export const getTemplateRotatedY = (orientation: number, localX: number, localY: number,
                                    sizeX: number = 1, sizeY: number = 1): number => {
    if(orientation === 1 || orientation === 3) {
        const i = sizeX;
        sizeX = sizeY;
        sizeY = i;
    }

    if(orientation === 0) {
        return localY;
    }
    if(orientation === 1) {
        return localX;
    }
    if(orientation === 2) {
        return 7 - (localY + sizeY + 1);
    }
    return 7 - (localX - sizeX + 1);
};







export const getTemplateLocalX = (orientation: number, localX: number, localY: number,
                                  sizeX: number = 1, sizeY: number = 1): number => {
    if(orientation === 2) {
        const i = sizeX;
        sizeX = sizeY;
        sizeY = i;
    }

    if(orientation === 0) {
        return localX;
    } else if(orientation === 1) {
        return 7 - (localY + sizeY) + 1;
    } else if(orientation === 2) {
        return 7 - (localX + sizeX) + 1;
    } else { // 3
        return localY;
    }
};

export const getTemplateLocalY = (orientation: number, localX: number, localY: number,
                                  sizeX: number = 1, sizeY: number = 1): number => {
    if(orientation === 2) {
        const i = sizeX;
        sizeX = sizeY;
        sizeY = i;
    }

    if(orientation === 0) {
        return localY;
    } else if(orientation === 1) {
        return localX;
    } else if(orientation === 2) {
        return 7 - (localY + sizeY) + 1;
    } else { // 3
        return 7 - (localX + sizeX) + 1;
    }
};
