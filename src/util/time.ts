export const rsTime = (date: Date): number => {
    const days = Math.round(date.getTime() / 0x5265c00);
    return days - 11745;
};
