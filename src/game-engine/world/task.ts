import { lastValueFrom, timer } from 'rxjs';
import { World } from '@engine/world/index';
import { take } from 'rxjs/operators';


export const schedule = async (ticks: number): Promise<number> => {
    return lastValueFrom(timer(ticks * World.TICK_LENGTH).pipe(take(1)));
};

export const wait = async (waitLength: number): Promise<number> => {
    return lastValueFrom(timer(waitLength).pipe(take(1)));
};
