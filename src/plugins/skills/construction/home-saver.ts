import { Player } from '@engine/world/actor/player/player';
import { ConstructedRegion } from '@engine/world/map/region';
import JSON5 from 'json5';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { logger } from '@runejs/common';
import { join } from 'path';
import { House, Room } from '@plugins/skills/construction/house';


/**
 * Gets the PoH save file name for the given player.
 * @param player
 */
const getSaveFileName = (player: Player): string =>
    `${player.username.toLowerCase().replace(/ /g, '_')}.json5`;


/**
 * Loads and returns the given player's PoH as a ConstructedRegion object.
 * Returns null if the player does not have a house.
 * @param player
 */
export const loadHouse = (player: Player): House | null => {
    const houseSaveDir = join('data', 'houses');

    if(!existsSync(houseSaveDir)) {
        mkdirSync(houseSaveDir);
        return null;
    }

    const filePath = join(houseSaveDir, getSaveFileName(player));

    try {
        const customMapFile = readFileSync(filePath, 'utf-8');
        if(!customMapFile) {
            return null;
        }

        const customMap = JSON5.parse(customMapFile);
        if(!customMap) {
            return null;
        }

        const loadedHouse = customMap as House;
        const house = new House();
        house.copyRooms(loadedHouse.rooms);
        return house;
    } catch(error) {
        logger.error(`Error loading player house for ${player.username}.`);
        logger.error(error);
        return null;
    }
};


/**
 * Saves the given player's house as a JSON5 file.
 * @param player
 */
export const saveHouse = (player: Player): void => {
    const customMap = player.metadata.customMap as ConstructedRegion;
    if(!customMap) {
        return;
    }

    const houseSaveDir = join('data', 'houses');

    if(!existsSync(houseSaveDir)) {
        mkdirSync(houseSaveDir);
    }

    const filePath = join(houseSaveDir, getSaveFileName(player));

    const house = new House();
    house.rooms = customMap.chunks as Room[][][];

    try {
        writeFileSync(filePath, JSON5.stringify(house, null, 4));
    } catch(error) {
        logger.error(`Error saving player house for ${player.username}.`);
        logger.error(error);
    }
};
