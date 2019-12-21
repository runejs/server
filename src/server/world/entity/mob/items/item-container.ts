import { Item } from './item';

export class ItemContainer {

    private readonly _size: number;
    private readonly _items: Item[];

    public constructor(size: number) {
        this._size = size;
        this._items = new Array(size);

        for(let i = 0; i < size; i++) {
            this._items[i] = null;
        }
    }

    public add(item: Item): void {
        for(let i = 0; i < this._size; i++) {
            if(this._items[i] === null) {
                this._items[i] = item;
                return;
            }
        }
    }

    public get size(): number {
        return this._size;
    }

    public get items(): Item[] {
        return this._items;
    }
}
