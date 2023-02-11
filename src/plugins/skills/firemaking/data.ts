import { findItem } from '@engine/config';
import { Burnable } from './types';

// using ! here because we know the items exist
export const FIREMAKING_LOGS: Burnable[] = [
    {
        logItem: findItem('rs:logs')!,
        requiredLevel: 1,
        experienceGained: 40
    },
    {
        logItem: findItem('rs:oak_logs')!,
        requiredLevel: 15,
        experienceGained: 60
    },
    {
        logItem: findItem('rs:willow_logs')!,
        requiredLevel: 30,
        experienceGained: 90
    },
    {
        logItem: findItem('rs:teak_logs')!,
        requiredLevel: 35,
        experienceGained: 105
    },
    {
        logItem: findItem('rs:maple_logs')!,
        requiredLevel: 45,
        experienceGained: 135
    },
    {
        logItem: findItem('rs:mahogany_logs')!,
        requiredLevel: 50,
        experienceGained: 157.5
    },
    {
        logItem: findItem('rs:yew_logs')!,
        requiredLevel: 60,
        experienceGained: 202.5
    },
    {
        logItem: findItem('rs:magic_logs')!,
        requiredLevel: 75,
        experienceGained: 303.8
    }
];
