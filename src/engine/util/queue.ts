/**
 * A first-in-first-out queue.
 *
 * @author jameskmonger
 */
export class Queue<TItem> {
    private _items: TItem[] = [];

    /**
     * Get the items in the queue.
     */
    public get items(): TItem[] {
        return this._items;
    }

    /**
     * Get the length of the queue.
     */
    public get length(): number {
        return this._items.length;
    }

    /**
     * Is the queue empty?
     */
    public get isEmpty(): boolean {
        return this._items.length === 0;
    }

    /**
     * Does the queue contain items?
     */
    public get isNotEmpty(): boolean {
        return this._items.length > 0;
    }

    /**
     * Add an item to the end of the queue.
     * @param item The item to add.
     */
    public enqueue(item: TItem): void {
        this._items.push(item);
    }

    /**
     * Remove an item from the front of the queue.
     * @returns The item removed.
     */
    public dequeue(): TItem | undefined {
        const item = this._items.shift();

        if (!item) {
            return undefined;
        }

        return item;
    }

    /**
     * Get the item at the front of the queue without removing it.
     * @returns The item at the front of the queue.
     */
    public peek(): TItem {
        return this._items[0];
    }

    /**
     * Remove all items from the queue.
     */
    public clear(): void {
        this._items = [];
    }
}
