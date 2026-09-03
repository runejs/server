import type { Actor } from '@engine/world/actor/actor';
import { QueueType, TickQueue } from '@engine/world/actor/tick-queue';
import { createMockActor, flushPromises, track } from '@engine/world/actor/utils/_testing';
import type { Subject } from 'rxjs';

describe('TickQueue', () => {
    let actor: Actor;
    let queue: TickQueue;
    let movementEvent: Subject<void>;
    let interfaceClosed: Subject<void>;
    let isDelayedMock: jest.Mock;
    let closeAllSlotsMock: jest.Mock;
    let hasModalOpenMock: jest.Mock;

    beforeEach(() => {
        ({ actor, movementEvent, interfaceClosed, isDelayedMock, closeAllSlotsMock, hasModalOpenMock } = createMockActor('player'));
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

    describe('specification', () => {
        // "If a strong or soft script is processed, modal interface is forcibly closed prior to it
        // processing." See docs/queue.md.
        describe.each([QueueType.STRONG, QueueType.SOFT])('when processing a %s task', type => {
            it('should close the modal before executing it', async () => {
                track(queue.requestTicks({ ticks: 0, type }));
                closeAllSlotsMock.mockClear();

                queue.tick();
                await flushPromises();

                expect(closeAllSlotsMock).toHaveBeenCalled();
            });
        });

        // "If any script sets a delay, processing further scripts cannot happen, and all scripts
        // except for soft thereafter will be skipped." See docs/queue.md.
        describe('when a delay becomes visible partway through a pass', () => {
            it('should skip the remaining tasks', async () => {
                isDelayedMock.mockReturnValueOnce(false).mockReturnValue(true);

                const first = track(queue.requestTicks({ ticks: 0 }));
                const second = track(queue.requestTicks({ ticks: 0 }));

                queue.tick();
                await flushPromises();

                expect([first.resolved, second.resolved]).toEqual([true, false]);
            });
        });

        // "While timers continue to tick down, they will pause once the timer reaches 0, until the
        // delay ends. It is unable to execute the script behind the timer itself while a delay
        // exists." See docs/delays.md.
        describe('when a global timer task is delayed', () => {
            it('should not execute until the delay ends', async () => {
                isDelayedMock.mockReturnValue(true);
                const task = track(queue.requestTicks({ ticks: 1, useGlobalTimer: true }));

                queue.tick();
                queue.tick();
                queue.tick();
                await flushPromises();

                expect(task.resolved).toBe(false);
            });

            it('should execute once the delay ends', async () => {
                isDelayedMock.mockReturnValue(true);
                const task = track(queue.requestTicks({ ticks: 1, useGlobalTimer: true }));

                queue.tick();
                isDelayedMock.mockReturnValue(false);
                queue.tick();
                await flushPromises();

                expect(task.resolved).toBe(true);
            });
        });
    });

    // Behaviour the OSRS documentation specifies that this implementation does not yet meet.
    // These are written as it.failing so the gap stays asserted rather than described: each one
    // starts passing the moment the behaviour is implemented, at which point drop the .failing.
    describe('unimplemented specification', () => {
        // "If any script sets a delay, processing further scripts cannot happen." A task delays the
        // actor from its own continuation, which is how production code would do it. Continuations
        // run as microtasks, so the delay lands after the synchronous tick loop has finished.
        // Satisfying this needs the queue moved off promises onto synchronous callbacks.
        it.failing('should stop processing once a running task sets a delay', async () => {
            queue.requestTicks({ ticks: 0 }).then(() => isDelayedMock.mockReturnValue(true));
            const second = track(queue.requestTicks({ ticks: 0 }));

            queue.tick();
            await flushPromises();

            expect(second.resolved).toBe(false);
        });

        // "At the start of the processing block, the queue is iterated and checked for any strong
        // scripts. If a strong script is in the queue, modal interface is closed before the
        // processing begins." Only the weak clearing half of this is implemented; the modal is
        // closed per task instead, so a strong task that is not yet due leaves the modal open.
        it.failing('should close the modal at the start of a pass when a strong task is queued', () => {
            track(queue.requestTicks({ ticks: 5, type: QueueType.STRONG }));
            closeAllSlotsMock.mockClear();

            queue.tick();

            expect(closeAllSlotsMock).toHaveBeenCalled();
        });

        // "In general, it seems like any action which closes an interface also clears all weak
        // scripts from the queue." Only movement clears weak tasks today; the queue does not watch
        // interfaceState.closed.
        it.failing('should clear weak tasks when an interface closes', async () => {
            const weak = track(queue.requestTicks({ ticks: 5, type: QueueType.WEAK }));

            interfaceClosed.next();
            await flushPromises();

            expect(weak.rejected).toBe(true);
        });

        // The constructor subscribes to walkingQueue.movementEvent and never unsubscribes, so a
        // destroyed queue keeps reacting to its actor's movement.
        it.failing('should stop reacting to movement once destroyed', async () => {
            queue.destroy();
            const weak = track(queue.requestTicks({ ticks: 5, type: QueueType.WEAK }));

            movementEvent.next();
            await flushPromises();

            expect(weak.rejected).toBe(false);
        });
    });
});
