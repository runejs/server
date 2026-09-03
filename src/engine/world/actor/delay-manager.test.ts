import type { Actor } from '@engine/world/actor/actor';
import { DelayManager, DelayType } from '@engine/world/actor/delay-manager';
import { createMockActor } from '@engine/world/actor/utils/_testing';

describe('DelayManager', () => {
    let actor: Actor;
    let delayManager: DelayManager;

    beforeEach(() => {
        ({ actor } = createMockActor('player'));
        delayManager = new DelayManager(actor);
    });

    describe('when newly created', () => {
        it('should not be delayed', () => {
            expect(delayManager.isDelayed()).toBe(false);
        });

        it('should have no delay type', () => {
            expect(delayManager.getDelayType()).toBeNull();
        });
    });

    describe('when applying an arrive delay', () => {
        beforeEach(() => {
            delayManager.applyArriveDelay();
        });

        it('should delay the actor', () => {
            expect(delayManager.isDelayed()).toBe(true);
        });

        it('should last a single tick', () => {
            expect(delayManager.getRemainingTicks()).toBe(1);
        });

        it('should report the arrive type', () => {
            expect(delayManager.getDelayType()).toBe(DelayType.ARRIVE);
        });

        describe('and a tick passes', () => {
            beforeEach(() => {
                delayManager.tick();
            });

            it('should no longer be delayed', () => {
                expect(delayManager.isDelayed()).toBe(false);
            });

            it('should clear the delay type', () => {
                expect(delayManager.getDelayType()).toBeNull();
            });
        });

        describe('and another arrive delay is applied', () => {
            it('should not extend the existing delay', () => {
                delayManager.applyArriveDelay();

                expect(delayManager.getRemainingTicks()).toBe(1);
            });
        });
    });

    describe('when applying a normal delay', () => {
        beforeEach(() => {
            delayManager.applyDelay(3);
        });

        it('should delay the actor for the given ticks', () => {
            expect(delayManager.getRemainingTicks()).toBe(3);
        });

        it('should report the normal type', () => {
            expect(delayManager.getDelayType()).toBe(DelayType.NORMAL);
        });

        it('should count down one tick at a time', () => {
            delayManager.tick();
            delayManager.tick();

            expect(delayManager.getRemainingTicks()).toBe(1);
        });

        it('should stay delayed until the final tick elapses', () => {
            delayManager.tick();
            delayManager.tick();
            delayManager.tick();

            expect(delayManager.isDelayed()).toBe(false);
        });

        describe('and an arrive delay is applied on top', () => {
            it('should be ignored', () => {
                delayManager.applyArriveDelay();

                expect(delayManager.getDelayType()).toBe(DelayType.NORMAL);
            });
        });

        describe('and another normal delay is applied on top', () => {
            it('should override the existing delay', () => {
                delayManager.applyDelay(10);

                expect(delayManager.getRemainingTicks()).toBe(10);
            });
        });
    });

    describe('when applying a zero tick delay', () => {
        beforeEach(() => {
            delayManager.applyDelay(0);
        });

        it('should not delay the actor', () => {
            expect(delayManager.isDelayed()).toBe(false);
        });

        it('should not leave a delay type behind', () => {
            expect(delayManager.getDelayType()).toBeNull();
        });

        it('should still allow a later arrive delay', () => {
            delayManager.applyArriveDelay();

            expect(delayManager.getDelayType()).toBe(DelayType.ARRIVE);
        });
    });

    describe('when ticking without a delay', () => {
        it('should not drop below zero', () => {
            delayManager.tick();
            delayManager.tick();

            expect(delayManager.getRemainingTicks()).toBe(0);
        });
    });
});
