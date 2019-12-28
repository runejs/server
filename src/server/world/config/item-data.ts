import { readFileSync } from 'fs';
import { ItemDefinition } from '@runejs/cache-parser';
import { logger } from '@runejs/logger/dist/logger';
import { join } from 'path';
import { serverDir } from '../../game-server';

export enum EquipmentSlot {
    HEAD = 0,
    BACK = 1,
    NECK = 2,
    MAIN_HAND = 3,
    TORSO = 4,
    OFF_HAND = 5,
    LEGS = 7,
    HANDS = 9,
    FEET = 10,
    RING = 12,
    QUIVER = 13
}

export const equipmentSlotIndex = (slot: EquipmentSlot): number => {
    return parseInt(EquipmentSlot[slot], 10);
};

export enum HelmetType {
    HAT = 'HAT',
    FULL_HELMET = 'FULL_HELMET'
}

export interface EquipmentBonuses {
    offencive?: {
        speed: number;
        stab: number;
        slash: number;
        crush: number;
        magic: number;
        randed: number;
    },
    defencive?: {
        stab: number;
        slash: number;
        crush: number;
        magic: number;
        ranged: number;
    },
    skill?: {
        strength: number;
        prayer: number;
    }
}

export interface ItemDetails {
    id: number;
    desc: string;
    canTrade: boolean;
    questItem?: boolean;
    equipmentSlot?: EquipmentSlot;
    helmetType?: HelmetType;
    equipmentBonuses?: EquipmentBonuses;
    weight?: number;
    alchemy?: {
        high?: number;
        low?: number;
    }
}

export interface ItemData extends ItemDefinition, ItemDetails {
}

export function parseItemData(itemDefinitions: Map<number, ItemDefinition>): Map<number, ItemData> {
    try {
        logger.info('Parsing additional item data...');

        const fileData = readFileSync(join(serverDir, 'data/config/item-data.json'), 'utf8');

        if(!fileData) {
            throw 'Unable to read item data.';
        }

        const itemDetailsList = JSON.parse(fileData) as ItemDetails[];

        if(!itemDetailsList || itemDetailsList.length === 0) {
            throw 'No item details were found.';
        }

        const itemDataMap: Map<number, ItemData> = new Map<number, ItemData>();
        itemDefinitions.forEach(itemDefinition => {
            let itemDetails = itemDetailsList.find(i => i.id === itemDefinition.id);

            if(!itemDetails) {
                itemDetails = {
                    id: itemDefinition.id,
                    desc: itemDefinition.name,
                    canTrade: false
                };
            }

            const itemData: ItemData = { ...itemDefinition, ...itemDetails };
            itemDataMap.set(itemData.id, itemData);
        });

        logger.info(`Additional info found for ${itemDetailsList.length} items.`);

        return itemDataMap;
    } catch(error) {
        logger.error('Error parsing game item data: ' + error);
        return null;
    }
}
