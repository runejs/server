import { Actor } from '@engine/world/actor/actor';

/**
 * Types of delays that can be applied to actors
 *
 * @see {@link https://osrs-docs.com/docs/mechanics/delays/#known-delays}
 */
export enum DelayType {
    /**
     * 1-tick delay applied when an entity moves to synchronize animations
     */
    ARRIVE = 'arrive',

    /**
     * Normal delay that prevents actions for a specified duration
     */
    NORMAL = 'normal',
}

/**
 * Manages delay states and timing for an Actor.
 *
 * Delays prevent most actions and script execution:
 * - Blocks queue processing (except soft tasks)
 * - Blocks entity interactions
 * - Blocks most interface interactions
 * - Allows some predetermined movement to continue
 *
 * @see {@link https://osrs-docs.com/docs/mechanics/delays/} - OSRS Delay System
 */
export class DelayManager {
    /** Current delay type if any */
    private currentDelay: DelayType | null = null;

    /** Ticks remaining in current delay */
    private delayTicks: number = 0;

    /** Tick when current delay started */
    private delayStartTick: number = 0;

    constructor(private actor: Actor) {}

    /**
     * Apply an arrive delay (1 tick) to synchronize with movement
     */
    public applyArriveDelay(): void {
        // Only apply if no current delay
        if (!this.currentDelay) {
            this.currentDelay = DelayType.ARRIVE;
            this.delayTicks = 1;
            this.delayStartTick = this.actor.tickQueue.currentTick;
        }
    }

    /**
     * Apply a normal delay for a specified duration
     * @param ticks Number of ticks to delay for
     */
    public applyDelay(ticks: number): void {
        // Override any current delay
        this.currentDelay = DelayType.NORMAL;
        this.delayTicks = ticks;
        this.delayStartTick = this.actor.tickQueue.currentTick;
    }

    /**
     * Process delays on each game tick
     */
    public tick(): void {
        if (this.delayTicks > 0) {
            this.delayTicks--;
            if (this.delayTicks === 0) {
                this.currentDelay = null;
            }
        }
    }

    /**
     * Check if actor is currently delayed
     */
    public isDelayed(): boolean {
        return this.delayTicks > 0;
    }

    /**
     * Get the type of current delay if any
     */
    public getDelayType(): DelayType | null {
        return this.currentDelay;
    }

    /**
     * Get remaining ticks in current delay
     */
    public getRemainingTicks(): number {
        return this.delayTicks;
    }
}
