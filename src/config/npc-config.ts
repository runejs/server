import { DefensiveBonuses } from '@server/config/item-config';
import { loadConfigurationFiles } from '@server/config/index';
import { cache } from '@server/game-server';

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

export interface NpcAnimations {
    attack?: number | number[];
    defend?: number;
    death?: number;
    stand?: number;
    walk?: number;
    turnAround?: number;
    turnRight?: number;
    turnLeft?: number;
}

export type DropTable = [ [ string, string, number, number? ] ];

export interface NpcPresetConfiguration {
    [key: string]: NpcConfiguration;
}

export interface NpcConfiguration {
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
    animations?: NpcAnimations;
    drop_table?: DropTable;
    metadata: { [key: string]: unknown };
}

/**
 * Full server + cache details about a specific game NPC.
 */
export class NpcDetails {
    extends?: string | string[];
    key: string;
    gameId: number;
    name?: string;
    skills?: NpcSkills;
    killable?: boolean;
    respawnTime?: number;
    offensiveStats?: OffensiveStats;
    defensiveStats?: DefensiveBonuses;
    animations?: NpcAnimations;
    dropTable?: DropTable;
    metadata: { [key: string]: unknown } = {};
    options?: string[];
    models?: number[];
    headModels?: number[];
    minimapVisible?: boolean;
    combatLevel?: number;
    boundary?: number;
    sizeX?: number;
    sizeY?: number;
    renderPriority?: boolean;
    headIcon?: number;
    clickable?: boolean;
    turnDegrees?: number;
}

export function translateNpcConfig(npcKey: string, config: NpcConfiguration): NpcDetails {
    return {
        key: npcKey,
        extends: config.extends || undefined,
        gameId: config.game_id,
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
        animations: config.animations || {},
        dropTable: config.drop_table || undefined,
        metadata: config.metadata || {}
    };
}

export async function loadNpcConfigurations(path: string): Promise<{ npcs: { [key: string]: NpcDetails };
    npcIds: { [key: number]: string }; npcPresets: NpcPresetConfiguration; }> {
    const npcIds: { [key: number]: string } = {};
    const npcs: { [key: string]: NpcDetails } = {};
    let npcPresets: NpcPresetConfiguration = {};

    const files = await loadConfigurationFiles(path);

    files.forEach(npcConfigs => {
        const npcKeys = Object.keys(npcConfigs);
        npcKeys.forEach(key => {
            if(key === 'presets') {
                npcPresets = { ...npcPresets, ...npcConfigs[key] };
            } else {
                const npcConfig = npcConfigs[key] as NpcConfiguration;
                npcIds[npcConfig.game_id] = key;
                npcs[key] = { ...translateNpcConfig(key, npcConfig),
                    ...cache.npcDefinitions.get(npcConfig.game_id) };
            }
        });
    });

    return { npcs, npcIds, npcPresets };
}
