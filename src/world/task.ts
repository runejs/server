import { lastValueFrom, of, timer } from 'rxjs';
import { World } from '@server/world/index';
import { delay, take } from 'rxjs/operators';

export abstract class Task<T> {

    public abstract async execute(): Promise<T>;

}

export const schedule = async (ticks: number): Promise<number> => {
    return lastValueFrom(timer(ticks * World.TICK_LENGTH).pipe(take(1)));
};

export const wait = async (waitLength: number): Promise<number> => {
    return lastValueFrom(timer(waitLength).pipe(take(1)));
};
