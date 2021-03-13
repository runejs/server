export interface DirectionData {
    index: number;
    deltaX: number;
    deltaY: number;
    rotation: number;
}

/**
 * A direction within the world.
 */
export type Direction = 'NORTH' | 'SOUTH' | 'EAST' | 'WEST' | 'NORTHEAST' | 'NORTHWEST' | 'SOUTHEAST' | 'SOUTHWEST';
export const directionData: { [key: string]: DirectionData } = {
    'NORTH': {
        index: 1,
        deltaX: 0,
        deltaY: 1,
        rotation: 1
    },
    'SOUTH': {
        index: 6,
        deltaX: 0,
        deltaY: -1,
        rotation: 3
    },
    'EAST': {
        index: 4,
        deltaX: 1,
        deltaY: 0,
        rotation: 2
    },
    'WEST': {
        index: 3,
        deltaX: -1,
        deltaY: 0,
        rotation: 0
    },
    'NORTHEAST': {
        index: 2,
        deltaX: 1,
        deltaY: 1,
        rotation: 1
    },
    'NORTHWEST': {
        index: 0,
        deltaX: -1,
        deltaY: 1,
        rotation: 0
    },
    'SOUTHEAST': {
        index: 7,
        deltaX: 1,
        deltaY: -1,
        rotation: 2
    },
    'SOUTHWEST': {
        index: 5,
        deltaX: -1,
        deltaY: -1,
        rotation: 3
    }
};
export const WNES: Direction[] = ['WEST', 'NORTH', 'EAST', 'SOUTH'];

export const directionFromIndex = (index: number): DirectionData => {
    const keys = Object.keys(directionData);
    for (const key of keys) {
        if (directionData[key].index === index) {
            return directionData[key];
        }
    }

    return null;
};

export const oppositeDirectionIndex = (index: number): number => {
    return 7 - index;
};
