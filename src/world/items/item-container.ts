import { Item } from './item';
import { Subject } from 'rxjs';
import { cache, world } from '@server/game-server';
import { hasValueNotNull } from '@server/util/data';

export interface ContainerUpdateEvent {
    slot?: number;
    item?: Item;
    type: 'ADD' | 'REMOVE' | 'SWAP' | 'SET' | 'SET_ALL' | 'UPDATE_AMOUNT';
}

export class ItemContainer {

    private readonly _size: number;
    private readonly _items: Item[];
    private readonly _containerUpdated: Subject<ContainerUpdateEvent>;

    public constructor(size: number) {
        this._size = size;
        this._items = new Array(size);
        this._containerUpdated = new Subject<ContainerUpdateEvent>();

        for (let i = 0; i < size; i++) {
            this._items[i] = null;
        }
    }

    public has(item: number | Item): boolean {
        return this.findIndex(item) !== -1;
    }

    /**
     * Finds all slots within the container that contain the specified items.
     * @param search The item id or Item object to search for.
     * @returns An array of slot numbers.
     */
    public findAll(search: number | Item): number[] {
        if (typeof search !== 'number') {
            search = search.itemId;
        }

        const stackable = world.itemData.get(search).stackable;

        if (stackable) {
            const index = this.findIndex(search);

            if (!hasValueNotNull(index) || index === -1) {
                return [];
            } else {
                return [index];
            }
        } else {
            const slots = [];

            for (let i = 0; i < this.size; i++) {
                const item = this.items[i];

                if (hasValueNotNull(item) && item.itemId === search) {
                    slots.push(i);
                }
            }

            return slots;
        }
    }

    public findIndex(item: number | Item): number {
        const itemId = (typeof item === 'number') ? item : item.itemId;
        return this._items.findIndex(i => hasValueNotNull(i) && i.itemId === itemId);
    }

    public setAll(items: Item[], fireEvent: boolean = true): void {
        for (let i = 0; i < this._size; i++) {
            this._items[i] = items[i];
        }

        if (fireEvent) {
            this._containerUpdated.next({type: 'SET_ALL'});
        }
    }

    public set(slot: number, item: Item, fireEvent: boolean = true): void {
        this._items[slot] = item;
        if (fireEvent) {
            this._containerUpdated.next({type: 'SET', slot, item});
        }
    }

    public findItemIndex(item: Item): number {
        for (let i = 0; i < this._size; i++) {
            if (hasValueNotNull(this._items[i]) &&
                this._items[i].itemId === item.itemId &&
                this._items[i].amount >= item.amount) {
                return i;
            }
        }

        return -1;
    }

    public add(item: number | Item, fireEvent: boolean = true): { item: Item, slot: number } {
        if (typeof item === 'number') {
            item = {itemId: item, amount: 1} as Item;
        }

        const existingItemIndex = this.findItemIndex({itemId: item.itemId, amount: 1});
        const cacheItem = world.itemData.get(item.itemId);

        if (existingItemIndex !== -1 && cacheItem.stackable) {
            const newItem = {
                itemId: item.itemId,
                amount: this._items[existingItemIndex].amount += item.amount
            } as Item;

            this.set(existingItemIndex, newItem, false);

            if (fireEvent) {
                this._containerUpdated.next({type: 'UPDATE_AMOUNT', slot: existingItemIndex, item});
            }

            // Item already in inventory and is stackable
            return {item: newItem, slot: existingItemIndex};
        } else {
            const newItemIndex = this.getFirstOpenSlot();
            if (newItemIndex === -1) {
                // Not enough container space
                return null;
            }

            this._items[newItemIndex] = item;

            if (fireEvent) {
                this._containerUpdated.next({type: 'ADD', slot: newItemIndex, item});
            }

            // Item added to inventory
            return {item, slot: newItemIndex};
        }
    }

    public addStacking(item: number | Item, fireEvent: boolean = true): { item: Item, slot: number } {
        if (typeof item === 'number') {
            item = {itemId: item, amount: 1} as Item;
        }

        const existingItemIndex = this.findItemIndex({itemId: item.itemId, amount: 1});

        if (existingItemIndex !== -1) {
            const newItem = {
                itemId: item.itemId,
                amount: this._items[existingItemIndex].amount += item.amount
            } as Item;

            this.set(existingItemIndex, newItem, false);

            if (fireEvent) {
                this._containerUpdated.next({type: 'UPDATE_AMOUNT', slot: existingItemIndex, item});
            }

            // Item already in inventory and is stackable
            return {item: newItem, slot: existingItemIndex};
        } else {
            const newItemIndex = this.getFirstOpenSlot();
            if (newItemIndex === -1) {
                // Not enough container space
                return null;
            }

            this._items[newItemIndex] = item;

            if (fireEvent) {
                this._containerUpdated.next({type: 'ADD', slot: newItemIndex, item});
            }

            // Item added to inventory
            return {item, slot: newItemIndex};
        }
    }

    public amountInStack(index: number): number {
        return this._items[index].amount;
    }

    public removeFirst(item: number | Item, fireEvent: boolean = true): number {
        const slot = this.findIndex(item);
        if (slot === -1) {
            return -1;
        }

        this._items[slot] = null;

        if (fireEvent) {
            this._containerUpdated.next({type: 'REMOVE', slot});
        }

        return slot;
    }

    public remove(slot: number, fireEvent: boolean = true): Item {
        const item = this._items[slot];
        this._items[slot] = null;

        if (fireEvent) {
            this._containerUpdated.next({type: 'REMOVE', slot});
        }
        return item;

    }

    public getFirstOpenSlot(): number {
        return this._items.findIndex(item => !hasValueNotNull(item));
    }

    public hasSpace(): boolean {
        return this.getFirstOpenSlot() !== -1;
    }

    public getOpenSlotCount(): number {
        let count = 0;
        for (let i = 0; i < this._size; i++) {
            if (!hasValueNotNull(this._items[i])) {
                count++;
            }
        }

        return count;
    }

    public getOpenSlots(count: number): number[] {
        const slots: number[] = [];

        for (let i = 0; i < this._size; i++) {
            if (!hasValueNotNull(this._items[i])) {
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

        for (const item of this._items) {
            if (!hasValueNotNull(item)) {
                continue;
            }

            const itemData = world.itemData.get(item.itemId);
            if (!!hasValueNotNull(itemData) || itemData.weight === undefined) {
                continue;
            }

            weight += itemData.weight;
        }

        return weight;
    }

    public canFit(item: Item, everythingStacks: boolean = false): boolean {
        const itemDefinition = cache.itemDefinitions.get(item.itemId);
        if (!itemDefinition) {
            throw new Error(`Item ID ${item.itemId} not found!`);
        }
        if (itemDefinition.stackable || everythingStacks) {
            if (this.has(item.itemId)) {
                const invItem = this.items[this.findIndex(item.itemId)];
                return invItem.amount + item.amount <= 2147483647;
            }
            return this.hasSpace();
        } else {
            return this.getOpenSlotCount() >= item.amount;
        }
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
