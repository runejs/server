import { Position } from '@engine/world/position';


export const MAP_SIZE = 13;


export type RoomType =
    'empty'
    | 'empty_grass'
    | 'garden'
    | 'formal_garden'
    | 'parlor'
    | 'kitchen'
    | 'dining_room'
    | 'bedroom'
    | 'skill_hall'
    | 'quest_hall'
    | 'portal_chamber'
    | 'combat_room'
    | 'games_room'
    | 'treasure_room'
    | 'chapel'
    | 'study'
    | 'throne_room'
    | 'workshop'
    | 'oubliette'
    | 'costume_room';


export const RoomStyle = {
    basic_wood: 0,
    basic_stone: 1,
    whitewashed_stone: 2,
    fremennik_wood: 3,
    tropical_wood: 4,
    fancy_stone: 5
};


/**
 * A map of room types to their respective world map template positions within the game.
 */
export const roomTemplates: { [key in RoomType]: Position } = {
    empty:          new Position(1856, 5056),
    empty_grass:    new Position(1864, 5056),
    garden:         new Position(1856, 5064),
    formal_garden:  new Position(1872, 5064),
    parlor:         new Position(1856, 5112),
    kitchen:        new Position(1872, 5112),
    dining_room:    new Position(1888, 5112),
    bedroom:        new Position(1904, 5112),
    skill_hall:     new Position(1864, 5104),
    quest_hall:     new Position(1912, 5104),
    portal_chamber: new Position(1864, 5088),
    combat_room:    new Position(1880, 5088),
    games_room:     new Position(1896, 5088),
    treasure_room:  new Position(1912, 5088),
    chapel:         new Position(1872, 5096),
    study:          new Position(1888, 5096),
    throne_room:    new Position(1904, 5096),
    workshop:       new Position(1856, 5096),
    oubliette:      new Position(1904, 5080),
    costume_room:   new Position(1904, 5064, 0)
};


/**
 * A map of room builder widget button ids to their respective room types.
 */
export const roomBuilderButtonMap: { [key: number]: RoomType } = {
    160: 'parlor',
    161: 'garden',
    162: 'kitchen',
    163: 'dining_room',
    164: 'workshop',
    165: 'bedroom',
    166: 'skill_hall',
    167: 'games_room',
    168: 'combat_room',
    169: 'quest_hall',
    170: 'study',
    171: 'costume_room',
    172: 'chapel',
    173: 'portal_chamber',
    174: 'formal_garden',
    175: 'throne_room',
    176: 'oubliette',
    177: 'treasure_room', // @TODO dungeon corridor
    178: 'treasure_room', // @TODO dungeon junction
    179: 'treasure_room', // @TODO dungeon stair
    180: 'treasure_room'
};


export const instance1 = new Position(6400, 6400);
export const instance1PohSpawn = new Position(6400 + 36, 6400 + 36);
export const instance1Max = new Position(6400 + 64, 6400 + 64);
export const instance2 = new Position(6400, 6464);
export const instance2PohSpawn = new Position(6400 + 36, 6464 + 36); // for reference
export const instance2Max = new Position(6400 + 64, 6464 + 64);

// Standard home outer door ids: closed[13100, 13101], open[13102, 13103]
