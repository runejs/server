import { findItem } from '@engine/config';
import { Burnable } from './types';

// using ! here because we know the items exist
export const FIREMAKING_LOGS: Burnable[] = [
    {

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        logItem: findItem('rs:logs')!,
        requiredLevel: 1,
        experienceGained: 40
    },
    {

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        logItem: findItem('rs:oak_logs')!,
        requiredLevel: 15,
        experienceGained: 60
    },
    {

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        logItem: findItem('rs:willow_logs')!,
        requiredLevel: 30,
        experienceGained: 90
    },
    {

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        logItem: findItem('rs:teak_logs')!,
        requiredLevel: 35,
        experienceGained: 105
    },
    {

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        logItem: findItem('rs:maple_logs')!,
        requiredLevel: 45,
        experienceGained: 135
    },
    {

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        logItem: findItem('rs:mahogany_logs')!,
        requiredLevel: 50,
        experienceGained: 157.5
    },
    {

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        logItem: findItem('rs:yew_logs')!,
        requiredLevel: 60,
        experienceGained: 202.5
    },
    {

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        logItem: findItem('rs:magic_logs')!,
        requiredLevel: 75,
        experienceGained: 303.8
    }
];
