import { loadConfigurationFiles } from '@server/config/index';
import { cache } from '@server/game-server';

export type EquipmentSlot = 'head' | 'back' | 'neck' | 'main_hand' | 'off_hand' | 'torso' |
    'legs' | 'hands' | 'feet' | 'ring' | 'quiver';

export const equipmentIndices = {
    'head': 0,
    'back': 1,
    'neck': 2,
    'main_hand': 3,
    'torso': 4,
    'off_hand': 5,
    'legs': 7,
    'hands': 9,
    'feet': 10,
    'ring': 12,
    'quiver': 13
};

export const equipmentIndex = (equipmentSlot: EquipmentSlot): number => equipmentIndices[equipmentSlot];

export type EquipmentType = 'hat' | 'helmet' | 'torso' | 'full_top' | 'one_handed' | 'two_handed';

export interface ItemRequirements {
    skills?: { [key: string]: number };
    quests?: { [key: string]: number };
}

export interface OffensiveBonuses {
    speed?: number;
    stab?: number;
    slash?: number;
    crush?: number;
    magic?: number;
    ranged?: number;
}

export interface DefensiveBonuses {
    stab?: number;
    slash?: number;
    crush?: number;
    magic?: number;
    ranged?: number;
}

export interface EquipmentData {
    equipmentSlot: EquipmentSlot;
    equipmentType?: EquipmentType;
    requirements?: ItemRequirements;
    offensiveBonuses?: OffensiveBonuses;
    defensiveBonuses?: DefensiveBonuses;
    skillBonuses?: { [key: string]: number };
}

export interface ItemConfiguration {
    game_id: number;
    description?: string;
    tradable?: boolean;
    weight?: number;
    equippable?: boolean;
    equipment_data?: {
        equipment_slot: EquipmentSlot;
        equipment_type?: EquipmentType;
        requirements?: ItemRequirements;
        offensive_bonuses?: OffensiveBonuses;
        defensive_bonuses?: DefensiveBonuses;
        skill_bonuses?: { [key: string]: number };
    };
    metadata?: { [key: string]: unknown };
}

export class ItemDetails {
    key: string;
    gameId: number;
    name: string = '';
    description: string = '';
    tradable: boolean = false;
    equippable: boolean = false;
    weight: number;
    equipmentData: EquipmentData;
    metadata: { [key: string]: unknown } = {};
    stackable: boolean = false;
    value: number = 0;
    members: boolean = false;
    groundOptions: string[] = [];
    inventoryOptions: string[] = [];
    teamId: number;
    notedId: number;
    noteTemplateId: number;
    stackableIds: number[];
    stackableAmounts: number[];
}

function translateConfig(key: string, config: ItemConfiguration): any {
    return {
        key,
        gameId: config.game_id,
        description: config.description,
        tradable: config.tradable,
        equippable: config.equippable,
        weight: config.weight,
        equipmentData: config.equipment_data ? {
            equipmentType: config.equipment_data?.equipment_type || undefined,
            equipmentSlot: config.equipment_data?.equipment_slot || undefined,
            requirements: config.equipment_data?.requirements || undefined,
            offensiveBonuses: config.equipment_data?.offensive_bonuses || undefined,
            defensiveBonuses: config.equipment_data?.defensive_bonuses || undefined,
            skillBonuses: config.equipment_data?.skill_bonuses || undefined,
        } : undefined,
        metadata: config.metadata
    };
}

export async function loadItemConfigurations(): Promise<{ items: { [key: string]: ItemDetails }, idMap: { [key: number]: string } }> {
    let itemConfigs: { [key: string]: ItemConfiguration } = {};
    const idMap: { [key: number]: string } = {};
    const items: { [key: string]: ItemDetails } = {};

    itemConfigs = await loadConfigurationFiles<ItemConfiguration>('data/items');

    const itemKeys = Object.keys(itemConfigs);
    itemKeys.forEach(key => {
        const itemConfig = itemConfigs[key];
        idMap[itemConfig.game_id] = key;
        items[key] = { ...translateConfig(key, itemConfig), ...cache.itemDefinitions.get(itemConfig.game_id) };
    });

    return { items, idMap };
}
