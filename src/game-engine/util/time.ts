export const rsTime = (date: Date): number => {
    const days = Math.round(date.getTime() / 0x5265c00);
    return days - 11745;
};

export const daysSinceLastLogin = (lastLogin: Date): number => {
    if(!lastLogin) {
        return -1;
    }

    return Math.floor(Math.abs(new Date().valueOf() - lastLogin.valueOf()) / (1000 * 60 * 60 * 24));
};
