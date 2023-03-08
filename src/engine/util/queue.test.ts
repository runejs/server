import { Queue } from './queue'

describe('Queue', () => {
    let queue: Queue<number>;
    beforeEach(() => {
        queue = new Queue<number>();
    });

    describe('checking Queue length', () => {
        it('should be empty when created', () => {
            expect(queue.isEmpty).toBe(true);
            expect(queue.isNotEmpty).toBe(false);
        });

        it('should be not empty when an item is added', () => {
            queue.enqueue(1);
            expect(queue.isEmpty).toBe(false);
            expect(queue.isNotEmpty).toBe(true);
        });

        it('should be empty when all items are removed', () => {
            queue.enqueue(1);
            queue.dequeue();
            expect(queue.isEmpty).toBe(true);
            expect(queue.isNotEmpty).toBe(false);
        });

        it('should return the correct length', () => {
            queue.enqueue(1);
            queue.enqueue(2);
            queue.enqueue(3);
            expect(queue.length).toBe(3);
        });
    });

    it('should return the correct items', () => {
        queue.enqueue(1);
        queue.enqueue(2);
        queue.enqueue(3);
        expect(queue.items).toEqual([1, 2, 3]);
    });

    describe('when peeking', () => {
        it('should return the correct item', () => {
            queue.enqueue(1);
            queue.enqueue(2);
            queue.enqueue(3);
            expect(queue.peek()).toBe(1);
        });

        it('should not remove the item', () => {
            queue.enqueue(1);
            queue.enqueue(2);
            queue.enqueue(3);
            queue.peek();
            expect(queue.items).toEqual([1, 2, 3]);
        });

        it('should return undefined when the queue is empty', () => {
            expect(queue.peek()).toBeUndefined();
        });
    });

    describe('when dequeuing', () => {
        it('should return the correct item', () => {
            queue.enqueue(1);
            queue.enqueue(2);
            queue.enqueue(3);
            expect(queue.dequeue()).toBe(1);
        });

        it('should remove the item', () => {
            queue.enqueue(1);
            queue.enqueue(2);
            queue.enqueue(3);
            queue.dequeue();
            expect(queue.items).toEqual([2, 3]);
        });

        it('should return undefined when the queue is empty', () => {
            expect(queue.dequeue()).toBeUndefined();
        });
    });

    describe('when clearing', () => {
        it('should remove all items', () => {
            queue.enqueue(1);
            queue.enqueue(2);
            queue.enqueue(3);
            queue.clear();
            expect(queue.items).toEqual([]);
        });
    });

    describe('when iterating', () => {
        it('should iterate over all items', () => {
            queue.enqueue(1);
            queue.enqueue(2);
            queue.enqueue(3);
            const items: number[] = [];
            for (const item of queue.items) {
                items.push(item);
            }
            expect(items).toEqual([1, 2, 3]);
        });
    });
})
