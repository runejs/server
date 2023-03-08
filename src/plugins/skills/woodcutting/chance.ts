import { randomBetween } from '@engine/util';
import { IHarvestable } from '@engine/world/config';

/**
 * Roll a random number between 0 and 255 and compare it to the percent needed to cut the tree.
 *
 * @param tree The tree to cut
 * @param toolLevel The level of the axe being used
 * @param woodcuttingLevel The player's woodcutting level
 *
 * @returns True if the tree was successfully cut, false otherwise
 */
export const canCut = (
    tree: IHarvestable,
    toolLevel: number,
    woodcuttingLevel: number
): boolean => {
    const successChance = randomBetween(0, 255);

    const percentNeeded =
        tree.baseChance + toolLevel + woodcuttingLevel;
    return successChance <= percentNeeded;
};
