import { LocationObject } from '@runejs/cache-parser';

export interface ModifiedLocationObject extends LocationObject {
    metadata?: { [key: string]: any };
}

export const objectKey = (object: LocationObject, level: boolean = false): string => {
    return `${object.x},${object.y}${level ? `,${object.level}` : ''},${object.objectId}`;
};
