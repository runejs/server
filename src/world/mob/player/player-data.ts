import { Item } from '@server/world/items/item';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { logger } from '@runejs/logger/dist/logger';
import { Player } from './player';
import { SkillValue } from '@server/world/mob/skills';

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

export interface PlayerSettings {
    musicVolume: number;
    soundEffectVolume: number;
    splitPrivateChatEnabled: boolean;
    twoMouseButtonsEnabled: boolean;
    screenBrightness: number;
    chatEffectsEnabled: boolean;
    acceptAidEnabled: boolean;
    runEnabled: boolean;
    autoRetaliateEnabled: boolean;
}

export interface PlayerSave {
    username: string;
    rights: number;
    position: {
        x: number;
        y: number;
        level: number;
    };
    lastLogin: {
        date: Date;
        address: string;
    };
    appearance: Appearance;
    inventory: Item[];
    equipment: Item[];
    skills: SkillValue[];
    settings: PlayerSettings;
}

export const defaultAppearance = (): Appearance => {
    return {
        gender: 0,
        head: 0,
        torso: 18,
        arms: 26,
        legs: 36,
        hands: 33,
        feet: 42,
        facialHair: 10,
        hairColor: 0,
        torsoColor: 0,
        legColor: 0,
        feetColor: 0,
        skinColor: 0
    } as Appearance;
};

export const defaultSettings = (): PlayerSettings => {
    return {
        musicVolume: 0,
        soundEffectVolume: 0,
        splitPrivateChatEnabled: false,
        twoMouseButtonsEnabled: false,
        screenBrightness: 2,
        chatEffectsEnabled: true,
        acceptAidEnabled: true,
        runEnabled: false,
        autoRetaliateEnabled: true
    } as PlayerSettings;
};

export function savePlayerData(player: Player): boolean {
    const fileName = player.username.toLowerCase() + '.json';
    const filePath = join('data/saves', fileName);

    const playerSave: PlayerSave = {
        username: player.username,
        position: {
            x: player.position.x,
            y: player.position.y,
            level: player.position.level
        },
        lastLogin: {
            date: player.loginDate,
            address: player.lastAddress
        },
        rights: player.rights.valueOf(),
        appearance: player.appearance,
        inventory: player.inventory.items,
        equipment: player.equipment.items,
        skills: player.skills.values,
        settings: player.settings
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
    const filePath = join('data/saves', fileName);

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
