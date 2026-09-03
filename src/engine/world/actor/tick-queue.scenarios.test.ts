import type { DelayManager } from '@engine/world/actor/delay-manager';
import { QueueType, type TickQueue } from '@engine/world/actor/tick-queue';
import { createActorHarness, flushPromises } from '@engine/world/actor/utils/_testing';
import type { Subject } from 'rxjs';

/**
 * Scenario coverage for the tick queue, driving the queue and the delay manager together in the
 * order the game loop does.
 *
 * Each scenario mirrors a real stacked action, either one of the known uses listed in
 * docs/queue.md (damage is strong, fletching is weak, scrawled note is normal, changing window
 * mode is soft) or one of the queue's two current call sites, woodcutting and the spinning wheel.
 */
describe('TickQueue scenarios', () => {
    let tickQueue: TickQueue;
    let delayManager: DelayManager;
    let movementEvent: Subject<void>;
    let hasModalOpenMock: jest.Mock;
    let advance: (ticks?: number) => Promise<void>;

    beforeEach(() => {
        ({ tickQueue, delayManager, movementEvent, hasModalOpenMock, advance } = createActorHarness('player'));
    });

    describe('chopping a tree', () => {
        // woodcutting.plugin.ts chops on a three tick cycle using a weak task per swing.
        const chop = (log: number[], swings = 3) =>
            (async () => {
                for (let swing = 0; swing < swings; swing++) {
                    await tickQueue.requestTicks({ ticks: 3, type: QueueType.WEAK, useGlobalTimer: true });
                    log.push(swing);
                }
            })();

        it('should swing once every three ticks', async () => {
            const swings: number[] = [];
            chop(swings).catch(() => undefined);

            await advance(9);

            expect(swings).toEqual([0, 1, 2]);
        });

        it('should not swing early', async () => {
            const swings: number[] = [];
            chop(swings).catch(() => undefined);

            await advance(2);

            expect(swings).toEqual([]);
        });

        describe('and the player walks away', () => {
            it('should stop chopping', async () => {
                const swings: number[] = [];
                chop(swings).catch(() => undefined);

                await advance(3);
                movementEvent.next();
                await advance(6);

                expect(swings).toEqual([0]);
            });

            it('should report the interruption to the script', async () => {
                const interrupted = jest.fn();
                chop([]).catch(interrupted);

                movementEvent.next();
                await flushPromises();

                expect(interrupted).toHaveBeenCalledWith('Movement interrupted action');
            });
        });

        describe('and the player clicks a second tree', () => {
            // The plugin restarts by queueing a strong task, which clears the in-flight weak swing.
            it('should abandon the first tree', async () => {
                const swings: number[] = [];
                chop(swings).catch(() => undefined);
                await advance(1);

                tickQueue.requestTicks({ ticks: 0, type: QueueType.STRONG }).catch(() => undefined);
                await advance(6);

                expect(swings).toEqual([]);
            });

            it('should start the new chop', async () => {
                const restarted = jest.fn();
                chop([]).catch(() => undefined);
                await advance(1);

                tickQueue.requestTicks({ ticks: 0, type: QueueType.STRONG }).then(restarted);
                await advance(1);

                expect(restarted).toHaveBeenCalled();
            });
        });
    });

    describe('spinning a batch of five items', () => {
        // spinning-wheel.plugin.ts spins the first item immediately, then one every three ticks.
        const spin = (made: number[], count = 5) =>
            (async () => {
                for (let i = 0; i < count; i++) {
                    await tickQueue.requestTicks({ ticks: i === 0 ? 0 : 3, type: QueueType.WEAK });
                    made.push(i);
                }
            })();

        it('should make the first item on the next tick', async () => {
            const made: number[] = [];
            spin(made).catch(() => undefined);

            await advance(1);

            expect(made).toEqual([0]);
        });

        it('should make the whole batch given enough ticks', async () => {
            const made: number[] = [];
            spin(made).catch(() => undefined);

            await advance(13);

            expect(made).toEqual([0, 1, 2, 3, 4]);
        });

        describe('and the player moves partway through', () => {
            it('should stop after the items already made', async () => {
                const made: number[] = [];
                spin(made).catch(() => undefined);

                await advance(4);
                movementEvent.next();
                await advance(12);

                expect(made).toEqual([0, 1]);
            });
        });
    });

    describe('taking damage while fletching', () => {
        // docs/queue.md known uses: damage is strong, fletching is weak.
        it('should cancel the fletching', async () => {
            const fletched = jest.fn();
            const interrupted = jest.fn();
            tickQueue.requestTicks({ ticks: 3, type: QueueType.WEAK }).then(fletched, interrupted);

            tickQueue.requestTicks({ ticks: 0, type: QueueType.STRONG }).catch(() => undefined);
            await advance(4);

            expect(fletched).not.toHaveBeenCalled();
        });

        it('should still apply the damage', async () => {
            const damaged = jest.fn();
            tickQueue.requestTicks({ ticks: 3, type: QueueType.WEAK }).catch(() => undefined);

            tickQueue.requestTicks({ ticks: 0, type: QueueType.STRONG }).then(damaged);
            await advance(1);

            expect(damaged).toHaveBeenCalled();
        });
    });

    describe('reading a scrawled note', () => {
        // docs/queue.md known uses: the follow up dialogue is queued as a normal script, and normal
        // scripts are skipped while a modal interface is open.
        it('should wait while the note interface is open', async () => {
            hasModalOpenMock.mockReturnValue(true);
            const opened = jest.fn();
            tickQueue.requestTicks({ ticks: 0, type: QueueType.NORMAL }).then(opened);

            await advance(3);

            expect(opened).not.toHaveBeenCalled();
        });

        it('should open the dialogue once the note is closed', async () => {
            hasModalOpenMock.mockReturnValue(true);
            const opened = jest.fn();
            tickQueue.requestTicks({ ticks: 0, type: QueueType.NORMAL }).then(opened);

            await advance(3);
            hasModalOpenMock.mockReturnValue(false);
            await advance(1);

            expect(opened).toHaveBeenCalled();
        });
    });

    describe('teleporting', () => {
        // docs/delays.md: a Falador teleport causes a three tick delay, during which queues do not
        // get processed.
        it('should block a queued action for the length of the delay', async () => {
            const acted = jest.fn();
            tickQueue.requestTicks({ ticks: 0, type: QueueType.NORMAL }).then(acted);
            delayManager.applyDelay(3);

            await advance(2);

            expect(acted).not.toHaveBeenCalled();
        });

        it('should let the action run once the delay ends', async () => {
            const acted = jest.fn();
            tickQueue.requestTicks({ ticks: 0, type: QueueType.NORMAL }).then(acted);
            delayManager.applyDelay(3);

            await advance(3);

            expect(acted).toHaveBeenCalled();
        });

        describe('and the player changes window mode mid teleport', () => {
            // docs/queue.md known uses: changing window mode is a soft script, and soft scripts
            // execute even while the player is delayed.
            it('should still apply the change', async () => {
                const resized = jest.fn();
                delayManager.applyDelay(3);
                tickQueue.requestTicks({ ticks: 0, type: QueueType.SOFT }).then(resized);

                await advance(1);

                expect(resized).toHaveBeenCalled();
            });
        });
    });

    describe('stacking every queue type at once', () => {
        // A strong script clears the weak ones as it is queued; everything else runs in the exact
        // order it was added.
        it('should drop the weak script and run the rest in order', async () => {
            const order: string[] = [];

            tickQueue.requestTicks({ ticks: 0, type: QueueType.NORMAL }).then(() => order.push('normal'));
            tickQueue.requestTicks({ ticks: 0, type: QueueType.WEAK }).then(
                () => order.push('weak'),
                () => undefined,
            );
            tickQueue.requestTicks({ ticks: 0, type: QueueType.STRONG }).then(() => order.push('strong'));
            tickQueue.requestTicks({ ticks: 0, type: QueueType.SOFT }).then(() => order.push('soft'));

            await advance(1);

            expect(order).toEqual(['normal', 'strong', 'soft']);
        });
    });

    describe('arriving at a rock to mine it', () => {
        // docs/delays.md: arriving delays the player for one server tick, and any input during that
        // tick is ignored.
        //
        // Actor.tick() decrements delays before processing the queue, so a one tick delay applied
        // during tick N has already expired by the time tick N+1 processes the queue. The arrive
        // delay therefore blocks nothing.
        it.failing('should ignore a queued action on the tick it arrives', async () => {
            const acted = jest.fn();
            delayManager.applyArriveDelay();
            tickQueue.requestTicks({ ticks: 0, type: QueueType.NORMAL }).then(acted);

            await advance(1);

            expect(acted).not.toHaveBeenCalled();
        });
    });
});
