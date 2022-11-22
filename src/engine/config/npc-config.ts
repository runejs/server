import { DefensiveBonuses } from '@engine/config/item-config';
import { loadConfigurationFiles } from '@runejs/common/fs';
import { filestore } from '@server/game/game-server';
import _ from 'lodash';
import { NpcConfig } from '@runejs/filestore';
import { logger } from '@runejs/common';
import { QuestRequirement } from '@engine/action';


export interface NpcSkills {
    [key: string]: number;
}

export interface OffensiveStats {
    speed?: number;
    attack?: number;
    strength?: number;
    magic?: number;
    magicStrength?: number;
    ranged?: number;
    rangedStrength?: number;
}

export interface NpcCombatAnimations {
    attack?: number | number[];
    defend?: number;
    death?: number;
}

export interface DropTable {
    itemKey: string;
    frequency: string;
    amount?: number;
    amountMax?: number;
    questRequirement?: QuestRequirement;
}

export interface NpcPresetConfiguration {
    [key: string]: NpcServerConfig;
}

export interface NpcServerConfig {
    extends?: string | string[];
    game_id: number;
    skills?: NpcSkills;
    killable?: boolean;
    respawn_time?: number;
    offensive_stats?: {
        speed?: number;
        attack?: number;
        strength?: number;
        magic?: number;
        magic_strength?: number;
        ranged?: number;
        ranged_strength?: number;
    };
    defensive_stats?: DefensiveBonuses;
    variations?: [{
        suffix: string;
    } & NpcServerConfig];
    animations?: NpcCombatAnimations;
    drop_table?: DropTable[];
    metadata: { [key: string]: unknown };
}

/**
 * Full server + cache details about a specific game NPC.
 */
export class NpcDetails extends NpcConfig {

    extends?: string | string[];
    key: string;
    skills?: NpcSkills;
    killable?: boolean;
    respawnTime?: number;
    offensiveStats?: OffensiveStats;
    defensiveStats?: DefensiveBonuses;
    combatAnimations?: NpcCombatAnimations;
    dropTable?: DropTable[] = [];
    metadata: { [key: string]: unknown } = {};

    public constructor(defaultValues: { [key: string]: any }) {
        super();
        Object.keys(defaultValues).forEach(key => this[key] = defaultValues[key]);
    }

}

export function translateNpcServerConfig(npcKey: string, config: NpcServerConfig): NpcDetails {
    return new NpcDetails({
        key: npcKey,
        extends: config.extends || undefined,
        skills: config.skills || {},
        killable: config.killable || false,
        respawnTime: config.respawn_time || 1,
        offensiveStats: config.offensive_stats ? {
            speed: config.offensive_stats.speed || undefined,
            attack: config.offensive_stats.attack || undefined,
            strength: config.offensive_stats.strength || undefined,
            magic: config.offensive_stats.magic || undefined,
            magicStrength: config.offensive_stats.magic_strength || undefined,
            ranged: config.offensive_stats.ranged || undefined,
            rangedStrength: config.offensive_stats.ranged_strength || undefined
        } : undefined,
        defensiveStats: config.defensive_stats || undefined,
        combatAnimations: config.animations || {},
        dropTable: config.drop_table || undefined,
        metadata: config.metadata || {}
    });
}

export async function loadNpcConfigurations(path: string): Promise<{
    npcs: { [key: string]: NpcDetails };
    npcIds: { [key: number]: string }; npcPresets: NpcPresetConfiguration;
}> {
    const npcIds: { [key: number]: string } = {};
    const npcs: { [key: string]: NpcDetails } = {};
    let npcPresets: NpcPresetConfiguration = {};

    const files = await loadConfigurationFiles(path);

    files.forEach(npcConfigs => {
        const npcKeys = Object.keys(npcConfigs);
        npcKeys.forEach(key => {
            if (key === 'presets') {
                npcPresets = { ...npcPresets, ...npcConfigs[key] };
            } else {
                const npcConfig = npcConfigs[key] as NpcServerConfig;
                if (!isNaN(npcConfig.game_id)) {
                    npcIds[npcConfig.game_id] = key;
                    npcs[key] = {
                        ...translateNpcServerConfig(key, npcConfig),
                        ...filestore.configStore.npcStore.getNpc(npcConfig.game_id)
                    };
                }
                if (npcConfig.variations) {
                    for (const variation of npcConfig.variations) {
                        try {
                            const subKey = key + ':' + variation.suffix;
                            const baseItem = JSON.parse(JSON.stringify({
                                ...translateNpcServerConfig(key, npcConfig),
                                ...filestore.configStore.npcStore.getNpc(npcConfig.game_id)
                            }));

                            const subBaseItem = JSON.parse(JSON.stringify({
                                ...translateNpcServerConfig(subKey, variation),
                                ...filestore.configStore.npcStore.getNpc(variation.game_id)
                            }));
                            npcIds[variation.game_id] = subKey;
                            npcs[subKey] = _.merge(baseItem, subBaseItem);
                        } catch (error) {
                            logger.error(`Error registering npc variant ${key}_${variation.suffix}`);
                            logger.error(error);
                        }
                    }
                }
            }
        });
    });

    return { npcs, npcIds, npcPresets };
}
