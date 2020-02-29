import { timer } from 'rxjs';
import { World } from '@server/world/world';

export abstract class Task<T> {

    public abstract async execute(): Promise<T>;

}

export const schedule = (ticks: number): Promise<number> => {
    return timer(ticks * World.TICK_LENGTH).toPromise();
};
