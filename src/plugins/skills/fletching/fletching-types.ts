import { Item }from '@engine/world/items/item';
export interface Fletchable {
    item: Item;
    level: number;
    experience: number;
    ingredient: Item[];
}