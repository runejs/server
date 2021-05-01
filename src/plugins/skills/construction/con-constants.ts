import { Position } from '@engine/world/position';


export const MAP_SIZE = 13;


export type RoomType = 'empty' | 'empty_grass' | 'garden_1' | 'garden_2' | 'parlor';


export type RoomTemplateMap = {
    [key in RoomType]: Position;
};

export const roomTemplates: RoomTemplateMap = {
    empty: new Position(1856, 5056),
    empty_grass: new Position(1864, 5056),
    garden_1: new Position(1856, 5064),
    garden_2: new Position(1872, 5064),
    parlor: new Position(1856, 5112),
};


export const instance1 = new Position(6400, 6400);
export const instance1PohSpawn = new Position(6400 + 36, 6400 + 36);
export const instance1Max = new Position(6400 + 64, 6400 + 64);
export const instance2 = new Position(6400, 6464);
export const instance2PohSpawn = new Position(6400 + 36, 6464 + 36);
export const instance2Max = new Position(6400 + 64, 6464 + 64);
