export const canLight = (logLevel: number, playerLevel: number): boolean => {
    playerLevel++;
    const hostRatio = Math.random() * logLevel;
    const clientRatio = Math.random() * ((playerLevel - logLevel) * (1 + (logLevel * 0.01)));
    return hostRatio < clientRatio;
};

export const canChain = (logLevel: number, playerLevel: number): boolean => {
    playerLevel++;
    const hostRatio = Math.random() * logLevel;
    const clientRatio = Math.random() * ((playerLevel - logLevel) * (1 + (logLevel * 0.01)));
    return clientRatio - hostRatio < 3.5;
};
