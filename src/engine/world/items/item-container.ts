import { Item } from './item';
import { Subject } from 'rxjs';
import { filestore } from '@server/game/game-server';
import { hasValueNotNull } from '@engine/util/data';
import { findItem } from '@engine/config/config-handler';
import { logger } from '@runejs/common';
import { fromNote } from '@engine/world/items/item';


export interface ContainerUpdateEvent {
    slot?: number;
    item?: Item | null;
    type: 'ADD' | 'REMOVE' | 'SWAP' | 'SET' | 'SET_ALL' | 'UPDATE_AMOUNT' | 'CLEAR_ALL';
}

export const getItemFromContainer = (itemId: number, slot: number, container: ItemContainer): Item | null => {
    if(slot < 0 || slot > container.items.length - 1) {
        return null;
    }

    const item = container.items[slot];
    if(!item || item.itemId !== itemId) {
        return null;
    }

    return item;
};

/**
 * This class represents a container of items.
 *
 * TODO (jameskmonger) We should use a Map instead of an array for the items.
 */
type InventoryMapType = (Item | null)[];

export class ItemContainer {

    private readonly _size: number;
    private readonly _items: InventoryMapType;
    private readonly _containerUpdated: Subject<ContainerUpdateEvent>;

    public constructor(size: number) {
        this._size = size;
        this._items = new Array(size);
        this._containerUpdated = new Subject<ContainerUpdateEvent>();

        for(let i = 0; i < size; i++) {
            this._items[i] = null;
        }
    }

    public clear(fireEvent: boolean = true): void {
        this._items.forEach((item, index) => this._items[index] = null);

        if(fireEvent) {
            this._containerUpdated.next({ type: 'CLEAR_ALL' });
        }
    }

    public has(item: number | Item): boolean {
        return this.findIndex(item) !== -1;
    }

    public amount(item: number | Item): number {
        const itemId = typeof item === 'number' ? item : item.itemId;
        return this._items.map(item => item && item.itemId === itemId ? (item.amount || 0) : 0)
            .reduce((accumulator, currentValue) => accumulator + currentValue);
    }

    /**
     * Finds all slots within the container that contain the specified items.
     * @param search The item id or Item object to search for.
     * @returns An array of slot numbers.
     */
    public findAll(search: number | Item): number[] {
        if(typeof search !== 'number') {
            search = search.itemId;
        }

        const searchItem = findItem(search);

        if (!searchItem) {
            logger.error(`Could not find item '${search}' when searching for items in container.`);
            return [];
        }

        const stackable = searchItem.stackable;

        if(stackable) {
            const index = this.findIndex(search);

            if(!hasValueNotNull(index) || index === -1) {
                return [];
            } else {
                return [ index ];
            }
        } else {
            const slots: number[] = [];

            for(let i = 0; i < this.size; i++) {
                const item = this.items[i];

                if(item?.itemId === search) {
                    slots.push(i);
                }
            }

            return slots;
        }
    }

    public findIndex(item: number | Item): number {
        const itemId = (typeof item === 'number') ? item : item.itemId;
        return this._items.findIndex(i => i?.itemId === itemId);
    }

    public setAll(items: (Item | null)[], fireEvent: boolean = true): void {
        for(let i = 0; i < this._size; i++) {
            this._items[i] = items[i];
        }

        if(fireEvent) {
            this._containerUpdated.next({ type: 'SET_ALL' });
        }
    }

    public set(slot: number, item: Item | null, fireEvent: boolean = true): void {
        this._items[slot] = item;
        if(fireEvent) {
            this._containerUpdated.next({ type: 'SET', slot, item });
        }
    }

    public findItemIndex(item: Item): number {
        for(let i = 0; i < this._size; i++) {
            const inventoryItem = this._items[i];

            if (inventoryItem === null) {
                continue;
            }

            if(inventoryItem.itemId === item.itemId &&
                inventoryItem.amount >= item.amount) {
                return i;
            }
        }

        return -1;
    }

    public add(item: number | string | Item, fireEvent: boolean = true): { item: Item, slot: number } | null {
        if (typeof item === 'number') {
            item = { itemId: item, amount: 1 } as Item;
        } else if (typeof item === 'string') {
            const itemDetails = findItem(item);
            if(!itemDetails) {
                logger.warn(`Item ${item} not configured on the server.`);
                return null;
            }

            item = { itemId: itemDetails.gameId, amount: 1 };
        }

        const existingItemIndex = this.findItemIndex({ itemId: item.itemId, amount: 1 });
        const cacheItem = findItem(item.itemId);

        if (!cacheItem) {
            logger.error(`Could not find item '${item.itemId}' in cache when adding item to container.`);
            return null;
        }

        if (existingItemIndex !== -1 && (cacheItem.stackable || cacheItem.bankNoteId != null)) {
            const newItem = {
                itemId: item.itemId,
                // using ! here because we know the item exists in the inventory
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                amount: this._items[existingItemIndex]!.amount += item.amount
            } as Item;

            this.set(existingItemIndex, newItem, false);

            if (fireEvent) {
                this._containerUpdated.next({ type: 'UPDATE_AMOUNT', slot: existingItemIndex, item });
            }

            // Item already in inventory and is stackable
            return { item: newItem, slot: existingItemIndex };
        } else {
            const newItemIndex = this.getFirstOpenSlot();
            if (newItemIndex === -1 || item.amount === 0) {
                // Not enough container space, or the amount of item being added is 0.
                return null;
            }

            this._items[newItemIndex] = item;

            if (fireEvent) {
                this._containerUpdated.next({ type: 'ADD', slot: newItemIndex, item });
            }

            // Item added to inventory
            return { item, slot: newItemIndex };
        }
    }

    public addStacking(item: number | Item, fireEvent: boolean = true): { item: Item, slot: number } | null {
        if (typeof item === 'number') {
            item = { itemId: item, amount: 1 } as Item;
        }

        const existingItemIndex = this.findItemIndex({ itemId: item.itemId, amount: 1 });

        if (existingItemIndex !== -1) {
            const newItem = {
                itemId: item.itemId,
                // using ! here because we know the item exists in the inventory
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                amount: this._items[existingItemIndex]!.amount += item.amount
            } as Item;

            this.set(existingItemIndex, newItem, false);

            if (fireEvent) {
                this._containerUpdated.next({ type: 'UPDATE_AMOUNT', slot: existingItemIndex, item });
            }

            // Item already in inventory and is stackable
            return { item: newItem, slot: existingItemIndex };
        } else {
            const newItemIndex = this.getFirstOpenSlot();
            if(newItemIndex === -1) {
                // Not enough container space
                return null;
            }

            this._items[newItemIndex] = item;

            if (fireEvent) {
                this._containerUpdated.next({ type: 'ADD', slot: newItemIndex, item });
            }

            // Item added to inventory
            return { item, slot: newItemIndex };
        }
    }

    public amountInStack(slot: number): number {
        return this._items[slot]?.amount || 0;
    }

    public removeFirst(item: number | Item, fireEvent: boolean = true): number {
        const slot = this.findIndex(item);
        if(slot === -1) {
            return -1;
        }

        this._items[slot] = null;

        if(fireEvent) {
            this._containerUpdated.next({ type: 'REMOVE', slot });
        }

        return slot;
    }

    public remove(slot: number, fireEvent: boolean = true): Item | null {
        const item = this._items[slot];
        this._items[slot] = null;

        if(fireEvent) {
            this._containerUpdated.next({ type: 'REMOVE', slot });
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
        for(let i = 0; i < this._size; i++) {
            if(!hasValueNotNull(this._items[i])) {
                count++;
            }
        }

        return count;
    }

    public getOpenSlots(): number[] {
        const slots: number[] = [];

        for(let i = 0; i < this._size; i++) {
            if(!hasValueNotNull(this._items[i])) {
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

            const itemData = findItem(item.itemId);

            if(!itemData?.weight) {
                continue;
            }

            weight += itemData.weight;
        }

        return weight;
    }

    public canFit(item: Item, everythingStacks: boolean = false): boolean {
        const itemDefinition = filestore.configStore.itemStore.getItem(item.itemId);
        if(!itemDefinition) {
            throw new Error(`Item ID ${ item.itemId } not found!`);
        }
        if(itemDefinition.stackable || everythingStacks || fromNote(item) > -1) {
            if(this.has(item.itemId)) {
                // using ! here because we know that we have the item in the inventory
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                const invItem = this.items[this.findIndex(item.itemId)]!;
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

    public get items(): (Item | null)[] {
        return this._items;
    }

    public get containerUpdated(): Subject<ContainerUpdateEvent> {
        return this._containerUpdated;
    }

}
