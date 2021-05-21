import { Item } from '@engine/world/items/item';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { logger } from '@runejs/core';
import { Player } from './player';
import { SkillValue } from '@engine/world/actor/skills';
import { hasValueNotNull } from '@engine/util/data';
import { PlayerQuest } from '@engine/config/quest-config';
import { MusicPlayerLoopMode, MusicPlayerMode } from '@plugins/music/music-tab.plugin';

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
    musicPlayerMode: number = MusicPlayerMode.AUTO;
    musicPlayerLoopMode: number = MusicPlayerLoopMode.ENABLED;
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
    publicChatMode: number = 0;
    privateChatMode: number = 0;
    tradeMode: number = 0;
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
    questList: PlayerQuest[];
    musicTracks: Array<number>;
    achievements: string[];
    friendsList: string[];
    ignoreList: string[];
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
            level: player.position.level > 3 ? 0 : player.position.level
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
        questList: player.quests,
        musicTracks: player.musicTracks,
        achievements: player.achievements,
        friendsList: player.friendsList,
        ignoreList: player.ignoreList
    };

    try {
        writeFileSync(filePath, JSON.stringify(playerSave, null, 4));
        return true;
    } catch(error) {
        logger.error(`Error saving player data for ${player.username}.`);
        return false;
    }
}

export function playerExists(username: string): boolean {
    const fileName = username.toLowerCase() + '.json';
    const filePath = join('data/saves', fileName);
    return existsSync(filePath);
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
        const playerSave = JSON.parse(fileData) as PlayerSave;
        if(playerSave?.position?.level > 3) {
            playerSave.position.level = 0;
        }
        return playerSave;
    } catch(error) {
        logger.error(`Malformed player save data for ${username}.`);
        return null;
    }
}
