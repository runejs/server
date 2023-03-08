import { loadConfigurationFiles } from '@runejs/common/fs';
import { SkillName } from '@engine/world/actor/skills';
import { logger } from '@runejs/common';
import { deepMerge } from '@engine/util/objects';


export type WeaponStyle = 'axe' | 'hammer' | 'bow' | 'claws' | 'crossbow' | 'longsword'
    | '2h_sword' | 'pickaxe' | 'halberd' | 'staff' | 'scythe' | 'spear' | 'mace'
    | 'dagger' | 'magical_staff' | 'darts' | 'unarmed';

export const weaponWidgetIds = {
    'axe': 75,
    'hammer': 76,
    'bow': 77,
    'claws': 78,
    'crossbow': 79,
    // @TODO 80
    'longsword': 81, // also scimitar
    '2h_sword': 82,
    'pickaxe': 83,
    'halberd': 84,
    'staff': 85,
    'scythe': 86,
    'spear': 87,
    'mace': 88,
    'dagger': 89,
    'magical_staff': 90,
    'darts': 91,
    'unarmed': 92,
    // @TODO 93
};

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
export const getEquipmentSlot = (index: number): EquipmentSlot =>
    Object.keys(equipmentIndices).find(key => equipmentIndices[key] === index) as EquipmentSlot;

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

export interface SkillBonuses {
    [key: string]: number;
}

export interface WeaponInfo {
    style: WeaponStyle;
    playerAnimations: any;
}

export interface ItemMetadata {
    [key: string]: unknown;
    consume_effects?: {
        replaced_by?: string;
        clock: string; // Name of timer to be used for cooldown
        skills?: {
            [key in SkillName]: number | [number, number];
        };
        energy?: number | [number, number];
        special: boolean;
    };
}



export interface EquipmentData {
    equipmentSlot: EquipmentSlot;
    equipmentType?: EquipmentType;
    requirements?: ItemRequirements;
    offensiveBonuses?: OffensiveBonuses;
    defensiveBonuses?: DefensiveBonuses;
    skillBonuses?: SkillBonuses;
    weaponInfo?: WeaponInfo;
}

export interface ItemPresetConfiguration {
    [key: string]: ItemConfiguration;
}

export interface ItemConfiguration {
    extends?: string | string[];
    game_id?: number;
    examine?: string;
    tradable?: boolean;
    variations?: [{
        suffix: string;
    } & ItemConfiguration];
    weight?: number;
    equippable?: boolean;
    consumable?: boolean;
    destroy?: string | boolean;
    groups?: string[];
    equipment_data?: {
        equipment_slot: EquipmentSlot;
        equipment_type?: EquipmentType;
        requirements?: ItemRequirements;
        offensive_bonuses?: OffensiveBonuses;
        defensive_bonuses?: DefensiveBonuses;
        skill_bonuses?: SkillBonuses;
        weapon_info?: WeaponInfo;
    };
    metadata?: ItemMetadata;
}

/**
 * Full server + cache details about a specific game item.
 */
export class ItemDetails {
    extends?: string | string[];
    key: string;
    gameId: number;
    name: string = '';
    examine: string = '';
    tradable: boolean = false;
    equippable: boolean = false;
    destroy?: string | boolean;
    weight: number;
    equipmentData: EquipmentData;
    metadata: ItemMetadata = {};
    consumable?: boolean;
    stackable: boolean = false;
    value: number = 0;
    groups: string[] = [];
    members: boolean = false;
    groundOptions: string[] = [];
    inventoryOptions: string[] = [];
    teamId: number;
    bankNoteId: number;
    bankNoteTemplate: number;
    stackableIds: number[];
    stackableAmounts: number[];

    public constructor(item?: ItemDetails) {
        if(item) {
            const keys = Object.keys(item);
            keys.forEach(key => this[key] = item[key]);
        }
    }

    get lowAlchValue(): number {
        return Math.floor(this.value * 0.4);
    }

    get highAlchValue(): number {
        return Math.floor(this.lowAlchValue * 1.5);
    }

    get minimumValue(): number {
        return Math.floor(this.lowAlchValue * 0.25);
    }
}

export function translateItemConfig(key: string | undefined, config: ItemConfiguration): any {
    return {
        key,
        extends: config.extends || undefined,
        gameId: config.game_id,
        examine: config.examine,
        tradable: config.tradable,
        equippable: config.equippable,
        weight: config.weight,
        destroy: config.destroy || undefined,
        groups: config.groups || [],
        consumable: config.consumable,
        equipmentData: config.equipment_data ? {
            equipmentType: config.equipment_data?.equipment_type || undefined,
            equipmentSlot: config.equipment_data?.equipment_slot || undefined,
            requirements: config.equipment_data?.requirements || undefined,
            offensiveBonuses: config.equipment_data?.offensive_bonuses || undefined,
            defensiveBonuses: config.equipment_data?.defensive_bonuses || undefined,
            skillBonuses: config.equipment_data?.skill_bonuses || undefined,
            weaponInfo: config.equipment_data?.weapon_info || undefined,
        } : undefined,
        metadata: config.metadata? { ...config.metadata } : {}
    };
}

export async function loadItemConfigurations(path: string): Promise<{ items: { [key: string]: ItemDetails };
    itemIds: { [key: number]: string }; itemPresets: ItemPresetConfiguration; itemGroups: Record<string, Record<string, boolean>>; }> {
    const itemIds: { [key: number]: string } = {};
    const items: { [key: string]: ItemDetails } = {};
    const itemGroups : Record<string, Record<string, boolean>> = {} // Record where key is group id, and value is an array of all itemstags in group
    let itemPresets: ItemPresetConfiguration = {};

    const files = await loadConfigurationFiles(path);
    const itemConfigurations: Record<string, ItemConfiguration> = {};

    files.forEach(itemConfigs => {
        const itemKeys = Object.keys(itemConfigs);
        itemKeys.forEach(key => {
            if(key === 'presets') {
                itemPresets = { ...itemPresets, ...itemConfigs[key] };
            } else {
                itemConfigurations[key] = itemConfigs[key] as ItemConfiguration;
            }
        });
    });
    Object.entries(itemConfigurations).forEach(([key, itemConfig]) => {
        if(itemConfig.game_id !== undefined && !isNaN(itemConfig.game_id)) {
            itemIds[itemConfig.game_id] = key;
            let item = { ...translateItemConfig(key, itemConfig) }
            if(item?.extends) {
                let extensions = item.extends;
                if(typeof extensions === 'string') {
                    extensions = [ extensions ];
                }

                extensions.forEach(extKey => {
                    const extensionItem = itemPresets[extKey];
                    if(extensionItem) {
                        const preset = translateItemConfig(undefined, extensionItem);
                        item = deepMerge(item, preset);
                    }
                });
            }
            items[key] = item;
            item.groups.forEach((group) => {
                if(!itemGroups[group]) {
                    itemGroups[group] = {};
                }
                itemGroups[group][key] = true;
            })
        }

        if(itemConfig.variations) {
            for(const subItem of itemConfig.variations) {
                if (!subItem.game_id) {
                    logger.warn(`Item ${key} has a variation without a game_id. Skipping.`);
                    continue;
                }

                const subKey = subItem.suffix ? key + ':' + subItem.suffix : key;
                const baseItem = JSON.parse(JSON.stringify({ ...translateItemConfig(key, itemConfig) }));
                const subBaseItem = JSON.parse(JSON.stringify({ ...translateItemConfig(subKey, subItem) }));
                itemIds[subItem.game_id] = subKey;

                if(!items[subKey]) {
                    let item = deepMerge(baseItem, subBaseItem);
                    if(item?.extends) {
                        let extensions = item.extends;
                        if(typeof extensions === 'string') {
                            extensions = [ extensions ];
                        }

                        extensions.forEach(extKey => {
                            const extensionItem = itemPresets[extKey];
                            if(extensionItem) {
                                const preset = translateItemConfig(undefined, extensionItem);
                                item = deepMerge(item, preset);
                            }
                        });
                    }
                    items[subKey] = item;
                    items[subKey].groups.forEach((group) => {
                        if(!itemGroups[group]) {
                            itemGroups[group] = {};
                        }
                        itemGroups[group][subKey] = true;
                    })
                } else {
                    logger.warn(`Duplicate item key ${subKey} found - the item was not loaded.`);
                }
            }
        }
    })

    return { items, itemIds, itemPresets, itemGroups };
}
