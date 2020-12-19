import { Item } from '@server/world/items/item';

export interface Bar {
    barId: number;
    quest?: string;
    requiredLevel: number;
    ingredients: Item[];
    experience: number;
}

export interface Smeltable {
    takesInput: boolean;
    count: number;
    bar: Bar;
}
