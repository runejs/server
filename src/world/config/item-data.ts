import { readFileSync, writeFileSync } from 'fs';
import { ItemDefinition } from '@runejs/cache-parser';
import { logger } from '@runejs/logger';
import { JSON_SCHEMA, safeLoad, safeDump } from 'js-yaml';

export enum EquipmentSlot {
    HEAD = 0,
    BACK = 1,
    NECK = 2,
    MAIN_HAND = 3,
    TORSO = 4,
    OFF_HAND = 5,
    LEGS = 7,
    GLOVES = 9,
    BOOTS = 10,
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

export enum TorsoType {
    VEST = 'VEST',
    FULL = 'FULL'
}

export enum WeaponType {
    TWO_HANDED = 'TWO_HANDED',
    ONE_HANDED = 'ONE_HANDED'
}

export interface EquipmentBonuses {
    offencive?: {
        speed?: number;
        stab: number;
        slash: number;
        crush: number;
        magic: number;
        ranged: number;
    };
    defencive?: {
        stab: number;
        slash: number;
        crush: number;
        magic: number;
        ranged: number;
    };
    skill?: {
        strength: number;
        prayer: number;
    };
}

export interface ItemData {
    id: number;
    desc?: string;
    canTrade: boolean;
    questItem?: boolean;
    weight?: number;
    alchemy?: {
        high?: number;
        low?: number;
    };
    equipment?: {
        slot?: EquipmentSlot;
        helmetType?: HelmetType;
        torsoType?: TorsoType;
        weaponType?: WeaponType;
        bonuses?: EquipmentBonuses;
    };
}

export interface ItemDetails extends ItemDefinition, ItemData {
}

function checkField(origin: ItemDetails, destination: ItemData, fieldName: string): void {
    if(origin[fieldName] !== undefined) {
        destination[fieldName] = origin[fieldName];
    }
}

export function saveItemData(itemDetailsMap: Map<number, ItemDetails>): void {
    const itemArray = Array.from(itemDetailsMap.values()).filter(itemData => itemData.desc !== undefined && itemData.desc !== null).map(itemDetails => {
        const itemData: ItemData = {
            id: itemDetails.id,
            desc: itemDetails.desc,
            canTrade: false
        };

        checkField(itemDetails, itemData, 'canTrade');
        checkField(itemDetails, itemData, 'questItem');
        checkField(itemDetails, itemData, 'weight');
        checkField(itemDetails, itemData, 'alchemy');
        checkField(itemDetails, itemData, 'equipment');

        return itemData;
    });

    try {
        const backupItemData = safeLoad(readFileSync('data/config/item-data.yaml', 'utf8'), { schema: JSON_SCHEMA }) as ItemData[];

        if(backupItemData && backupItemData.length !== 0) {
            writeFileSync('data/config/item-data-backup.yaml', safeDump(backupItemData, { schema: JSON_SCHEMA }), 'utf8');
        }

        writeFileSync('data/config/item-data.yaml', safeDump(itemArray, { schema: JSON_SCHEMA }), 'utf8');
    } catch(error) {
        logger.error('Error saving game item data: ' + error);
    }
}

export function parseItemData(itemDefinitions: Map<number, ItemDefinition>): Map<number, ItemDetails> {
    try {
        logger.info('Parsing additional item data...');

        const itemDataList = safeLoad(readFileSync('data/config/item-data.yaml', 'utf8'), { schema: JSON_SCHEMA }) as ItemData[];

        if(!itemDataList || itemDataList.length === 0) {
            throw new Error('Unable to read item data.');
        }

        const itemDetailsMap: Map<number, ItemDetails> = new Map<number, ItemDetails>();
        itemDefinitions.forEach((itemDefinition: ItemDefinition) => {
            let itemData = itemDataList.find(i => i.id === itemDefinition.id);

            if(!itemData) {
                itemData = {
                    id: itemDefinition.id,
                    canTrade: false
                };
            }

            const itemDetails: ItemDetails = { ...itemDefinition, ...itemData };
            itemDetailsMap.set(itemDetails.id, itemDetails);
        });

        logger.info(`Additional info found for ${itemDataList.length} items.`);

        return itemDetailsMap;
    } catch(error) {
        logger.error('Error parsing game item data: ' + error);
        return null;
    }
}
