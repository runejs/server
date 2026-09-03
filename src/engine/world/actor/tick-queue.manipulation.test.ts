import { QueueType, type TickQueue } from '@engine/world/actor/tick-queue';
import { createActorHarness } from '@engine/world/actor/utils/_testing';

/**
 * Tick manipulation coverage.
 *
 * Tick manipulation is the family of techniques where a second, faster action is interleaved with a
 * skilling action so the skilling action rolls on a shorter cycle than it naturally would — three
 * tick fishing and mining being the best known examples.
 *
 * `tick-queue.ts` names this as an open TODO against the wiki's Tick manipulation page, and
 * `requestTicks` already carries a `useGlobalTimer` flag described as "the global action timer that
 * can be manipulated". Nothing manipulates it yet: `ActionTimer.setTimer` is only ever called from
 * `requestTicks` itself.
 *
 * Unlike the queue and delay suites there is no vendored specification for this in the repository,
 * so the target behaviour below is drawn from the wiki mechanic rather than an in-repo document.
 * The assertions are kept to structural properties — cycle lengths and which action gates which —
 * rather than frame exact sequences.
 */
describe('tick manipulation', () => {
    let tickQueue: TickQueue;
    let advance: (ticks?: number) => Promise<void>;

    beforeEach(() => {
        ({ tickQueue, advance } = createActorHarness('player'));
    });

    /**
     * Runs `count` actions back to back, each waiting `ticks` ticks, recording the tick each one
     * landed on. Models a skilling loop such as woodcutting's chop cycle.
     */
    const cycle = (ticks: number, count: number, landings: number[] = []) => {
        const promise = (async () => {
            for (let i = 0; i < count; i++) {
                await tickQueue.requestTicks({ ticks, type: QueueType.WEAK, useGlobalTimer: true });
                landings.push(tickQueue.currentTick);
            }
        })();

        promise.catch(() => undefined);
        return landings;
    };

    describe('the shared action timer', () => {
        it('should run an unmanipulated action on its natural cycle', async () => {
            const landings = cycle(4, 3);

            await advance(12);

            expect(landings).toEqual([4, 8, 12]);
        });

        it('should hold an action back when a later action sets a longer timer', async () => {
            const landings: number[] = [];
            tickQueue.requestTicks({ ticks: 1, useGlobalTimer: true }).then(() => landings.push(tickQueue.currentTick));
            tickQueue.requestTicks({ ticks: 5, useGlobalTimer: true }).catch(() => undefined);

            await advance(6);

            expect(landings).toEqual([5]);
        });

        // This is the structural reason tick manipulation cannot be expressed today. A task is
        // gated by BOTH its own elapsed tick count and the shared timer, so shortening the timer
        // can never bring an action forward — only lengthening it can push one back.
        it('should not bring an action forward when a later action sets a shorter timer', async () => {
            const landings: number[] = [];
            tickQueue.requestTicks({ ticks: 4, useGlobalTimer: true }).then(() => landings.push(tickQueue.currentTick));
            tickQueue.requestTicks({ ticks: 1, useGlobalTimer: true }).catch(() => undefined);

            await advance(6);

            expect(landings).toEqual([4]);
        });
    });

    // Target behaviour, not yet implemented. Each of these starts failing the suite once tick
    // manipulation is supported, which is the signal to drop the .failing.
    describe('unimplemented specification', () => {
        // The manipulation primitive: an action that resets the shared timer should make the next
        // skilling roll eligible on the timer's cadence rather than the action's own.
        it.failing('should let a manipulating action bring the next roll forward', async () => {
            const landings: number[] = [];
            tickQueue.requestTicks({ ticks: 4, useGlobalTimer: true }).then(() => landings.push(tickQueue.currentTick));
            tickQueue.requestTicks({ ticks: 1, useGlobalTimer: true }).catch(() => undefined);

            await advance(6);

            expect(landings).toEqual([1]);
        });

        // Three tick mining: a four tick skilling cycle interleaved with a three tick manipulating
        // action should roll every three ticks.
        it.failing('should pull a four tick skilling cycle down to three ticks', async () => {
            const landings = cycle(4, 4);
            cycle(3, 4);

            await advance(12);

            expect(landings).toEqual([3, 6, 9, 12]);
        });

        // Three tick fishing: barbarian fishing rolls on a five tick cycle unmanipulated.
        it.failing('should pull a five tick skilling cycle down to three ticks', async () => {
            const landings = cycle(5, 4);
            cycle(3, 4);

            await advance(12);

            expect(landings).toEqual([3, 6, 9, 12]);
        });

        // Dropping the manipulating action should return the skilling action to its own cycle.
        it.failing('should return to the natural cycle once manipulation stops', async () => {
            const landings = cycle(4, 4);
            cycle(3, 1);

            await advance(12);

            expect(landings).toEqual([3, 7, 11]);
        });
    });
});
