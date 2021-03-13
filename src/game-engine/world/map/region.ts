/**
 * Different types of world regions.
 * map: 64x64 tile (13x13 tile chunks) full map region file.
 * chunk: 8x8 tile chunk within a map.
 */
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
