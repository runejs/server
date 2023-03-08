import { ItemDetails } from '@engine/config';

/**
 * The definition for a burnable log.
 */
export type Burnable = {
    /**
     * The item details for the log.
     */
    logItem: ItemDetails;

    /**
     * The firemaking level required to light the log.
     */
    requiredLevel: number;

    /**
     * The experience gained for lighting the log.
     */
    experienceGained: number;
}
