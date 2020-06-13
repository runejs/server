import { Item } from '@server/world/items/item';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { logger } from '@runejs/logger';
import { Player } from './player';
import { SkillValue } from '@server/world/actor/skills';
import { hasValueNotNull } from '@server/util/data';


export interface QuestProgress {
    questId: string;
    stage: string;
    attributes: { [key: string]: any };
}

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

export class PlayerSettings {
    musicVolume: number = 0;
    soundEffectVolume: number = 0;
    areaEffectVolume: number = 0;
    splitPrivateChatEnabled: boolean = false;
    twoMouseButtonsEnabled: boolean = true;
    screenBrightness: number = 2;
    chatEffectsEnabled: boolean = true;
    acceptAidEnabled: boolean = true;
    runEnabled: boolean = false;
    autoRetaliateEnabled: boolean = true;
    attackStyle: number = 0;
    bankInsertMode: number = 0;
    bankWithdrawNoteMode: number = 0;
}

export interface PlayerSave {
    username: string;
    passwordHash: string;
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
    bank: Item[];
    equipment: Item[];
    skills: SkillValue[];
    settings: PlayerSettings;
    savedMetadata: { [key: string]: any };
    quests: QuestProgress[];
    achievements: string[];
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
    return new PlayerSettings();
};

export const validateSettings = (player: Player): void => {
    const existingKeys = Object.keys(player.settings);
    const newSettings = new PlayerSettings();
    const newKeys = Object.keys(newSettings);

    if(newKeys.length === existingKeys.length) {
        return;
    }

    const missingKeys = newKeys.filter(key => existingKeys.indexOf(key) === -1);
    for(const key of missingKeys) {
        player.settings[key] = newSettings[key];
    }
};

export function savePlayerData(player: Player): boolean {
    const fileName = player.username.toLowerCase() + '.json';
    const filePath = join('data/saves', fileName);

    const playerSave: PlayerSave = {
        username: player.username,
        passwordHash: player.passwordHash,
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
        bank: player.bank.items.filter((item) => {
            return hasValueNotNull(item);
        }),
        equipment: player.equipment.items,
        skills: player.skills.values,
        settings: player.settings,
        savedMetadata: player.savedMetadata,
        quests: player.quests,
        achievements: player.achievements
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
