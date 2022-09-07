import { randomBetween } from '@engine/util';
import { IHarvestable } from '@engine/world/config';

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
