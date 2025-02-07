/**
 * Manages the global action timer that can be manipulated
 */
export class ActionTimer {
    private timer: number = 0;

    public tick(): void {
        if (this.timer > 0) {
            this.timer--;
        }
    }

    public setTimer(ticks: number): void {
        this.timer = ticks;
    }

    public isActive(): boolean {
        return this.timer > 0;
    }
}
