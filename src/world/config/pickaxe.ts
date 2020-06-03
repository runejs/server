import { Player } from '@server/world/actor/player/player';
import { Skill, Skills } from '@server/world/actor/skills';

interface IPickaxe {
    itemId: number;
    level: number;
    animation: number;
    pulses: number;
}


export enum Pickaxe {
    BRONZE,
    IRON,
    STEEL,
    MITHRIL,
    ADAMANT,
    RUNE,
}


const Pickaxes: IPickaxe[] = [
    {itemId: 1265, level: 1, animation: 625, pulses: 8},
    {itemId: 1267, level: 1, animation: 626, pulses: 7},
    {itemId: 1269, level: 6, animation: 627, pulses: 6},
    {itemId: 1273, level: 21, animation: 629, pulses: 5},
    {itemId: 1271, level: 31, animation: 628, pulses: 4},
    {itemId: 1275, level: 41, animation: 624, pulses: 3}
];

/**
 * Checks the players inventory and equipment for pickaxe
 * @param player
 * @return the highest level pickage the player can use, or null if theres none found
 */
export function getBestPickaxe(player: Player): IPickaxe | null {
    for (let i = Pickaxes.length - 1; i >= 0; i--) {
        if (player.skills.hasSkillLevel(Skill.MINING, Pickaxes[i].level)) {
            if (player.hasItemOnPerson(Pickaxes[i].itemId)) {
                return Pickaxes[i];
            }
        }
    }
    return null;
}

export function getPickaxe(pickaxe: Pickaxe): IPickaxe {
    return Pickaxes[pickaxe];
}
