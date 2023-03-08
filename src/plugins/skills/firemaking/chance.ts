/**
 * Roll a chance to light a fire.
 *
 * TODO (jameskmonger) this was ported from the old codebase and needs to be documented.
 *
 * @param logLevel The firemaking level required to light the log.
 * @param playerLevel The player's current firemaking level.
 * @returns `true` if the player successfully lights the fire, `false` otherwise.
 */
export const canLight = (logLevel: number, playerLevel: number): boolean => {
    if (playerLevel < logLevel) {
        return false;
    }

    playerLevel++;
    const hostRatio = Math.random() * logLevel;
    const clientRatio = Math.random() * ((playerLevel - logLevel) * (1 + (logLevel * 0.01)));
    return hostRatio < clientRatio;
};

/**
 * Roll a chance to 'chain' a fire.
 *
 * TODO (jameskmonger) this was ported from the old codebase and needs to be documented.
 *                      what is "chain"?
 *
 * @param logLevel The firemaking level required to light the log.
 * @param playerLevel The player's current firemaking level.
 * @returns `true` if the player successfully lights the fire, `false` otherwise.
 */
export const canChain = (logLevel: number, playerLevel: number): boolean => {
    if (playerLevel < logLevel) {
        return false;
    }

    playerLevel++;
    const hostRatio = Math.random() * logLevel;
    const clientRatio = Math.random() * ((playerLevel - logLevel) * (1 + (logLevel * 0.01)));
    return clientRatio - hostRatio < 3.5;
};
