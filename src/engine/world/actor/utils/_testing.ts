import type { Actor, ActorType } from '@engine/world/actor/actor';
import { DelayManager } from '@engine/world/actor/delay-manager';
import { TickQueue } from '@engine/world/actor/tick-queue';
import { Subject } from 'rxjs';

/**
 * Builds a minimal fake Actor for testing the actor sub-systems that do not need a world.
 *
 * `TickQueue` and `DelayManager` only reach for a handful of members, so the whole actor graph
 * (which eagerly constructs the walking queue, skills, pathfinding and the active world) can be
 * avoided entirely.
 *
 * @param type Whether the actor should satisfy the `isPlayer` guard. NPC actors are built without
 *             an `interfaceState`, so any unguarded access to it fails the test loudly.
 */
export function createMockActor(type: ActorType = 'player') {
    const movementEvent = new Subject<void>();
    const interfaceClosed = new Subject<void>();
    const isDelayedMock = jest.fn().mockReturnValue(false);
    const closeAllSlotsMock = jest.fn();
    const hasModalOpenMock = jest.fn().mockReturnValue(false);

    const actor = {
        type,
        walkingQueue: { movementEvent },
        delayManager: { isDelayed: isDelayedMock },
        tickQueue: { currentTick: 0 },
        interfaceState:
            type === 'player'
                ? {
                      closeAllSlots: closeAllSlotsMock,
                      hasModalOpen: hasModalOpenMock,
                      closed: interfaceClosed,
                  }
                : undefined,
    } as unknown as Actor;

    return { actor, movementEvent, interfaceClosed, isDelayedMock, closeAllSlotsMock, hasModalOpenMock };
}

/**
 * Lets any pending promise callbacks run.
 *
 * `TickQueue.requestTicks` is declared `async`, so the promise handed to the caller settles a
 * couple of microtasks after the task resolves inside the synchronous tick loop.
 */
export function flushPromises(): Promise<void> {
    return new Promise(resolve => setImmediate(resolve));
}

/**
 * Builds a fake actor wired up with a real TickQueue and a real DelayManager, for testing the
 * two together rather than in isolation.
 *
 * `advance` mirrors `Actor.tick()`, which decrements delays before processing the queue, and then
 * lets promise callbacks run so a script awaiting a task can queue its next one — which is how the
 * game loop behaves across ticks.
 */
export function createActorHarness(type: ActorType = 'player') {
    const mock = createMockActor(type);
    const actor = mock.actor as unknown as { tickQueue: TickQueue; delayManager: DelayManager };

    const tickQueue = new TickQueue(mock.actor);
    actor.tickQueue = tickQueue;
    actor.delayManager = new DelayManager(mock.actor);

    const { delayManager } = actor;

    const tick = (): void => {
        delayManager.tick();
        tickQueue.tick();
    };

    const advance = async (ticks = 1): Promise<void> => {
        for (let i = 0; i < ticks; i++) {
            tick();
            await flushPromises();
        }
    };

    return { ...mock, tickQueue, delayManager, tick, advance };
}

/**
 * Records how a promise settled without leaving an unhandled rejection behind.
 *
 * Interruptions reject with a bare string, so the recorded reason is the string itself.
 */
export function track(promise: Promise<void>) {
    const settled = { resolved: false, rejected: false, reason: undefined as unknown };

    promise.then(
        () => {
            settled.resolved = true;
        },
        reason => {
            settled.rejected = true;
            settled.reason = reason;
        },
    );

    return settled;
}
