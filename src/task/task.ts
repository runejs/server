import { of, timer } from 'rxjs';
import { World } from '@server/world/world';
import { delay } from 'rxjs/operators';

export abstract class Task<T> {

    public abstract async execute(): Promise<T>;

}

export const schedule = async (ticks: number): Promise<number> => {
    return timer(ticks * World.TICK_LENGTH).toPromise();
};

export const wait = async (waitLength): Promise<void> => {
    return of(null).pipe(delay(waitLength)).toPromise();
};
