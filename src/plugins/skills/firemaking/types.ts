import { ItemDetails } from '@engine/config';

export type Burnable = {
    logItem: ItemDetails;
    requiredLevel: number;
    experienceGained: number;
}
