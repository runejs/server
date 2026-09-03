import type { Actor } from '@engine/world/actor/actor';
import { QueueType, TickQueue } from '@engine/world/actor/tick-queue';
import { createMockActor, flushPromises, track } from '@engine/world/actor/utils/_testing';
import type { Subject } from 'rxjs';

describe('TickQueue', () => {
    let actor: Actor;
    let queue: TickQueue;
    let movementEvent: Subject<void>;
    let isDelayedMock: jest.Mock;
    let closeAllSlotsMock: jest.Mock;
    let hasModalOpenMock: jest.Mock;

    beforeEach(() => {
        ({ actor, movementEvent, isDelayedMock, closeAllSlotsMock, hasModalOpenMock } = createMockActor('player'));
        queue = new TickQueue(actor);
    });

    describe('when requesting ticks', () => {
        describe('and the type is STRONG', () => {
            it('should reject any queued weak tasks immediately', async () => {
                const weak = track(queue.requestTicks({ ticks: 5, type: QueueType.WEAK }));

                track(queue.requestTicks({ ticks: 5, type: QueueType.STRONG }));
                await flushPromises();

                expect(weak.rejected).toBe(true);
                expect(weak.reason).toBe('Strong task present');
            });

            it('should close modal interfaces', () => {
                track(queue.requestTicks({ ticks: 5, type: QueueType.STRONG }));

                expect(closeAllSlotsMock).toHaveBeenCalled();
            });
        });

        describe('and the type is SOFT', () => {
            it('should close modal interfaces', () => {
                track(queue.requestTicks({ ticks: 5, type: QueueType.SOFT }));

                expect(closeAllSlotsMock).toHaveBeenCalled();
            });
        });

        describe.each([QueueType.WEAK, QueueType.NORMAL])('and the type is %s', type => {
            it('should not close modal interfaces', () => {
                track(queue.requestTicks({ ticks: 5, type }));

                expect(closeAllSlotsMock).not.toHaveBeenCalled();
            });
        });

        describe('and the actor is an npc', () => {
            it('should not reach for the interface state', () => {
                const npc = createMockActor('npc');
                const npcQueue = new TickQueue(npc.actor);

                expect(() => track(npcQueue.requestTicks({ ticks: 5, type: QueueType.STRONG }))).not.toThrow();
            });
        });

        describe('and no type is given', () => {
            it('should default to NORMAL, skipping while a modal is open', async () => {
                hasModalOpenMock.mockReturnValue(true);

                const task = track(queue.requestTicks({ ticks: 0 }));
                queue.tick();
                await flushPromises();

                expect(task.resolved).toBe(false);
            });
        });
    });

    describe('when ticking', () => {
        it('should increment the current tick exactly once', () => {
            queue.tick();
            queue.tick();

            expect(queue.currentTick).toBe(2);
        });

        it('should not complete a zero tick task on the same tick it was queued', async () => {
            const task = track(queue.requestTicks({ ticks: 0 }));
            await flushPromises();

            expect(task.resolved).toBe(false);
        });

        it('should complete a zero tick task on the following tick', async () => {
            const task = track(queue.requestTicks({ ticks: 0 }));

            queue.tick();
            await flushPromises();

            expect(task.resolved).toBe(true);
        });

        it('should not complete a task before its ticks have elapsed', async () => {
            const task = track(queue.requestTicks({ ticks: 3 }));

            queue.tick();
            queue.tick();
            await flushPromises();

            expect(task.resolved).toBe(false);
        });

        it('should complete a task once its ticks have elapsed', async () => {
            const task = track(queue.requestTicks({ ticks: 3 }));

            queue.tick();
            queue.tick();
            queue.tick();
            await flushPromises();

            expect(task.resolved).toBe(true);
        });

        describe('and several tasks are queued', () => {
            it('should process them in insertion order', async () => {
                const order: string[] = [];

                queue.requestTicks({ ticks: 0 }).then(() => order.push('first'));
                queue.requestTicks({ ticks: 0 }).then(() => order.push('second'));
                queue.requestTicks({ ticks: 0 }).then(() => order.push('third'));

                queue.tick();
                await flushPromises();

                expect(order).toEqual(['first', 'second', 'third']);
            });

            it('should complete every due task in a single tick', async () => {
                const tasks = [
                    track(queue.requestTicks({ ticks: 0 })),
                    track(queue.requestTicks({ ticks: 0 })),
                    track(queue.requestTicks({ ticks: 0 })),
                ];

                queue.tick();
                await flushPromises();

                expect(tasks.every(task => task.resolved)).toBe(true);
            });
        });
    });

    describe('when the actor is delayed', () => {
        beforeEach(() => {
            isDelayedMock.mockReturnValue(true);
        });

        describe.each([QueueType.WEAK, QueueType.NORMAL, QueueType.STRONG])('and the task is %s', type => {
            it('should not be processed', async () => {
                const task = track(queue.requestTicks({ ticks: 0, type }));

                queue.tick();
                await flushPromises();

                expect(task.resolved).toBe(false);
            });

            it('should remain queued until the delay ends', async () => {
                const task = track(queue.requestTicks({ ticks: 0, type }));

                queue.tick();
                isDelayedMock.mockReturnValue(false);
                queue.tick();
                await flushPromises();

                expect(task.resolved).toBe(true);
            });
        });

        describe('and the task is SOFT', () => {
            it('should still be processed', async () => {
                const task = track(queue.requestTicks({ ticks: 0, type: QueueType.SOFT }));

                queue.tick();
                await flushPromises();

                expect(task.resolved).toBe(true);
            });
        });
    });

    describe('when a modal interface is open', () => {
        beforeEach(() => {
            hasModalOpenMock.mockReturnValue(true);
        });

        describe('and the task is NORMAL', () => {
            it('should be skipped', async () => {
                const task = track(queue.requestTicks({ ticks: 0, type: QueueType.NORMAL }));

                queue.tick();
                await flushPromises();

                expect(task.resolved).toBe(false);
            });

            it('should remain queued and complete once the modal closes', async () => {
                const task = track(queue.requestTicks({ ticks: 0, type: QueueType.NORMAL }));

                queue.tick();
                hasModalOpenMock.mockReturnValue(false);
                queue.tick();
                await flushPromises();

                expect(task.resolved).toBe(true);
            });
        });

        describe.each([QueueType.STRONG, QueueType.SOFT])('and the task is %s', type => {
            it('should be processed anyway', async () => {
                const task = track(queue.requestTicks({ ticks: 0, type }));

                queue.tick();
                await flushPromises();

                expect(task.resolved).toBe(true);
            });
        });
    });

    describe('when a strong task is queued alongside a weak task', () => {
        it('should reject the weak task', async () => {
            track(queue.requestTicks({ ticks: 5, type: QueueType.STRONG }));
            const weak = track(queue.requestTicks({ ticks: 0, type: QueueType.WEAK }));

            queue.tick();
            await flushPromises();

            expect(weak.rejected).toBe(true);
            expect(weak.reason).toBe('Strong task present');
        });

        it('should drop the rejected weak task rather than retrying it every tick', async () => {
            const rejectSpy = jest.fn();

            track(queue.requestTicks({ ticks: 5, type: QueueType.STRONG }));
            queue.requestTicks({ ticks: 0, type: QueueType.WEAK }).catch(rejectSpy);

            queue.tick();
            queue.tick();
            queue.tick();
            await flushPromises();

            expect(rejectSpy).toHaveBeenCalledTimes(1);
        });
    });

    describe('when the actor moves', () => {
        it('should reject queued weak tasks', async () => {
            const weak = track(queue.requestTicks({ ticks: 5, type: QueueType.WEAK }));

            movementEvent.next();
            await flushPromises();

            expect(weak.rejected).toBe(true);
            expect(weak.reason).toBe('Movement interrupted action');
        });

        describe.each([QueueType.NORMAL, QueueType.STRONG, QueueType.SOFT])('and a %s task is queued', type => {
            it('should leave it alone', async () => {
                const task = track(queue.requestTicks({ ticks: 5, type }));

                movementEvent.next();
                await flushPromises();

                expect(task.rejected).toBe(false);
            });
        });
    });

    describe('when using the global timer', () => {
        it('should not complete the task while the timer is still active', async () => {
            const task = track(queue.requestTicks({ ticks: 2, useGlobalTimer: true }));

            queue.tick();
            await flushPromises();

            expect(task.resolved).toBe(false);
        });

        it('should complete the task once the timer has run down', async () => {
            const task = track(queue.requestTicks({ ticks: 2, useGlobalTimer: true }));

            queue.tick();
            queue.tick();
            await flushPromises();

            expect(task.resolved).toBe(true);
        });

        describe('and a second task overwrites the shared timer', () => {
            it('should hold back the first task past its own tick count', async () => {
                const first = track(queue.requestTicks({ ticks: 1, useGlobalTimer: true }));
                track(queue.requestTicks({ ticks: 5, useGlobalTimer: true }));

                queue.tick();
                await flushPromises();

                expect(first.resolved).toBe(false);
            });
        });
    });

    describe('when the actor is destroyed', () => {
        it('should reject every queued task', async () => {
            const first = track(queue.requestTicks({ ticks: 5 }));
            const second = track(queue.requestTicks({ ticks: 5 }));

            queue.destroy();
            await flushPromises();

            expect([first.rejected, second.rejected]).toEqual([true, true]);
        });

        it('should reject with the destroyed reason', async () => {
            const task = track(queue.requestTicks({ ticks: 5 }));

            queue.destroy();
            await flushPromises();

            expect(task.reason).toBe('Actor destroyed');
        });

        it('should empty the queue so later ticks process nothing', async () => {
            const rejectSpy = jest.fn();

            queue.requestTicks({ ticks: 0 }).catch(rejectSpy);

            queue.destroy();
            queue.tick();
            queue.tick();
            await flushPromises();

            expect(rejectSpy).toHaveBeenCalledTimes(1);
        });
    });

    // Behaviour specified by docs/queue.md and docs/delays.md that the current implementation
    // does not yet meet. Documented here so the gap stays visible.
    describe('unmet specification', () => {
        // queue.md:57 - a script setting a delay should stop the rest of the queue being processed
        // that tick. Task continuations run as microtasks, so a delay set by a resolving task
        // cannot be observed inside the synchronous tick loop.
        it.todo('should stop processing the queue once a task sets a delay');

        // queue.md:51 - modal interfaces should close at the start of the processing block when a
        // strong task is present, not per task as they are processed.
        it.todo('should close modal interfaces at the start of the processing block');

        // The constructor subscribes to walkingQueue.movementEvent and never unsubscribes, so a
        // destroyed actor's queue still reacts to its walking queue.
        it.todo('should unsubscribe from movement events when destroyed');
    });
});
