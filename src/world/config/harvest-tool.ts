import { Player } from '@server/world/actor/player/player';
import { Skill } from '@server/world/actor/skills';

export interface HarvestTool {
    itemId: number;
    level: number;
    animation: number;
    pulses: number;
    modifier: number;
}


export enum Pickaxe {
    BRONZE,
    IRON,
    STEEL,
    MITHRIL,
    ADAMANT,
    RUNE,
}

export enum Axe {
    BRONZE,
    IRON,
    STEEL,
    MITHRIL,
    ADAMANT,
    RUNE,
    DRAGON
}


const Pickaxes: HarvestTool[] = [
    {itemId: 1265, level: 1, animation: 625, pulses: 8, modifier: 0},
    {itemId: 1267, level: 1, animation: 626, pulses: 7, modifier: 0},
    {itemId: 1269, level: 6, animation: 627, pulses: 6, modifier: 0},
    {itemId: 1273, level: 21, animation: 629, pulses: 5, modifier: 0},
    {itemId: 1271, level: 31, animation: 628, pulses: 4, modifier: 0},
    {itemId: 1275, level: 41, animation: 624, pulses: 3, modifier: 0}
];


const Axes: HarvestTool[] = [
    {itemId: 1351, level: 1, animation: 879, pulses: 8, modifier: 0},
    {itemId: 1349, level: 1, animation: 877, pulses: 7, modifier: 0},
    {itemId: 1353, level: 6, animation: 875, pulses: 6, modifier: 0},
    {itemId: 1355, level: 21, animation: 871, pulses: 5, modifier: 0},
    {itemId: 1357, level: 31, animation: 869, pulses: 4, modifier: 0},
    {itemId: 1359, level: 41, animation: 867, pulses: 3, modifier: 0},
    {itemId: 6739, level: 61, animation: 2846, pulses: 3, modifier: 10}
];

/**
 * Checks the players inventory and equipment for pickaxe
 * @param player
 * @return the highest level pickage the player can use, or null if theres none found
 */
export function getBestPickaxe(player: Player): HarvestTool | null {
    for (let i = Pickaxes.length - 1; i >= 0; i--) {
        if (player.skills.hasSkillLevel(Skill.MINING, Pickaxes[i].level)) {
            if (player.hasItemOnPerson(Pickaxes[i].itemId)) {
                return Pickaxes[i];
            }
        }
    }
    return null;
}
/**
 * Checks the players inventory and equipment for axe
 * @param player
 * @return the highest level axe the player can use, or null if theres none found
 */
export function getBestAxe(player: Player): HarvestTool | null {
    for (let i = Axes.length - 1; i >= 0; i--) {
        if (player.skills.hasSkillLevel(Skill.WOODCUTTING, Axes[i].level)) {
            if (player.hasItemOnPerson(Axes[i].itemId)) {
                return Axes[i];
            }
        }
    }
    return null;
}

export function getPickaxe(pickaxe: Pickaxe): HarvestTool {
    return Pickaxes[pickaxe];
}


export function getAxe(axe: Axe): HarvestTool {
    return Axes[axe];
}
