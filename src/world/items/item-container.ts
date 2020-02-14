import { Item } from './item';
import { Subject } from 'rxjs';
import { world } from '@server/game-server';

export interface ContainerUpdateEvent {
    slot?: number;
    item?: Item;
    type: 'ADD' | 'REMOVE' | 'SWAP' | 'SET' | 'SET_ALL' | 'UPDATE_ALL';
}

export class ItemContainer {

    private readonly _size: number;
    private readonly _items: Item[];
    private readonly _containerUpdated: Subject<ContainerUpdateEvent>;

    public constructor(size: number) {
        this._size = size;
        this._items = new Array(size);
        this._containerUpdated = new Subject<ContainerUpdateEvent>();

        for(let i = 0; i < size; i++) {
            this._items[i] = null;
        }
    }

    public setAll(items: Item[], fireEvent: boolean = true): void {
        for(let i = 0; i < this._size; i++) {
            this._items[i] = items[i];
        }

        if(fireEvent) {
            this._containerUpdated.next({type: 'SET_ALL'});
        }
    }

    public set(slot: number, item: Item, fireEvent: boolean = true): void {
        this._items[slot] = item;
        if(fireEvent) {
            this._containerUpdated.next({type: 'SET', slot, item});
        }
    }

    public find(item: Item): number {
        for(let i = 0; i < this._size; i++) {
            if (this._items[i] !== null &&
                this._items[i].itemId === item.itemId &&
                this._items[i].amount >= item.amount) {
                return i;
            }
        }
        return null;
    }

    public add(item: Item, fireEvent: boolean = true): void {
        const findItem = this.find({itemId: item.itemId, amount: 1});
        if (findItem !== null) {
            const cacheItem = world.itemData.get(item.itemId);
            if (cacheItem.stackable) {
                this.set(findItem, {
                    itemId: item.itemId,
                    amount: this._items[findItem].amount += item.amount
                }, true);
                this._containerUpdated.next({type: 'UPDATE_ALL', slot: findItem, item});
                return;
            }
        }

        for(let i = 0; i < this._size; i++) {
            if(this._items[i] === null) {
                this._items[i] = item;
                if(fireEvent) {
                    this._containerUpdated.next({type: 'ADD', slot: i, item});
                }
                return;
            }
        }
    }

    public remove(slot: number, fireEvent: boolean = true): void {
        this._items[slot] = null;

        if(fireEvent) {
            this._containerUpdated.next({type: 'REMOVE', slot});
        }
    }

    public getFirstOpenSlot(): number {
        return this._items.findIndex(item => item === null);
    }

    public getOpenSlots(count: number): number[] {
        const slots: number[] = [];

        for(let i = 0; i < this._size; i++) {
            if(this._items[i] === null) {
                slots.push(i);
            }
        }

        return slots;
    }

    public swap(fromSlot: number, toSlot: number): void {
        const fromItem = this._items[fromSlot];
        const toItem = this._items[toSlot];

        this._items[toSlot] = fromItem;
        this._items[fromSlot] = toItem;
    }

    public weight(): number {
        let weight = 0;

        for(const item of this._items) {
            if(!item) {
                continue;
            }

            const itemData = world.itemData.get(item.itemId);
            if(!itemData || itemData.weight === undefined) {
                continue;
            }

            weight += itemData.weight;
        }

        return weight;
    }

    public get size(): number {
        return this._size;
    }

    public get items(): Item[] {
        return this._items;
    }

    public get containerUpdated(): Subject<ContainerUpdateEvent> {
        return this._containerUpdated;
    }
}
