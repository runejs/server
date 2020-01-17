import { LandscapeObject } from '@runejs/cache-parser';

export interface ModifiedLandscapeObject extends LandscapeObject {
    metadata?: { [key: string]: any };
}
