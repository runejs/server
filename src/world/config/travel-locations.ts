import { readFileSync } from 'fs';
import { JSON_SCHEMA, safeLoad } from 'js-yaml';
import { Position } from '@server/world/position';

interface RawTravelLocation {
    name: string;
    x: number;
    y: number;
}

export interface TravelLocation {
    name: string;
    key: string;
    position: Position;
}

const readLocations = (): TravelLocation[] => {
    const locationData = safeLoad(
        readFileSync('data/config/travel-locations-data.yaml', 'utf8'),
        { schema: JSON_SCHEMA }) as RawTravelLocation[];
    return locationData.map((location) => {
        return {
            name: location.name,
            key: location.name.toLowerCase(),
            position: new Position(location.x, location.y, 0),
        };
    }) as TravelLocation[];
};

export default class TravelLocations {
    private readonly locations: TravelLocation[];

    public constructor () {
        this.locations = readLocations();
    }

    public find (search: string): TravelLocation {
        search = search.toLowerCase().trim();
        for (const location of this.locations) {
            if (location.key.indexOf(search) >= 0) {
                return location;
            }
        }
        return null;
    }
}
