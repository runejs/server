import type { Actor, ActorType } from '@engine/world/actor/actor';
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
