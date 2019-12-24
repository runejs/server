import { Item } from '../items/item';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { logger } from '@runejs/logger/dist/logger';
import { Player } from './player';

export interface Appearance {
    gender: number;
    head: number;
    torso: number;
    arms: number;
    legs: number;
    hands: number;
    feet: number;
    facialHair: number;
    hairColor: number;
    torsoColor: number;
    legColor: number;
    feetColor: number;
    skinColor: number;
}

export interface PlayerSave {
    username: string;
    position: {
        x: number;
        y: number;
        level: number;
    };
    appearance: Appearance;
    inventory: Item[];
}

export function defaultAppearance(): Appearance {
    return {
        gender: 0,
        head: 0,
        torso: 10,
        arms: 26,
        legs: 36,
        hands: 33,
        feet: 42,
        facialHair: 18,
        hairColor: 0,
        torsoColor: 0,
        legColor: 0,
        feetColor: 0,
        skinColor: 0
    } as Appearance;
}

export function savePlayerData(player: Player): boolean {
    const fileName = player.username.toLowerCase() + '.json';
    const filePath = join(__dirname, '../../../../../../data/saves', fileName);

    const playerSave: PlayerSave = {
        username: player.username,
        position: {
            x: player.position.x,
            y: player.position.y,
            level: player.position.level
        },
        appearance: player.appearance,
        inventory: player.inventory.items
    };

    try {
        writeFileSync(filePath, JSON.stringify(playerSave, null, 4));
        return true;
    } catch(error) {
        logger.error(`Error saving player data for ${player.username}.`);
        return false;
    }
}

export function loadPlayerSave(username: string): PlayerSave {
    const fileName = username.toLowerCase() + '.json';
    const filePath = join(__dirname, '../../../../../../data/saves', fileName);

    if(!existsSync(filePath)) {
        return null;
    }

    const fileData = readFileSync(filePath, 'utf8');

    if(!fileData) {
        return null;
    }

    try {
        return JSON.parse(fileData) as PlayerSave;
    } catch(error) {
        logger.error(`Malformed player save data for ${username}.`);
        return null;
    }
}
