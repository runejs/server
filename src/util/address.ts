export const addressToInt = (address: string): number => {
    if(!address) {
        return 0;
    }

    const parts = address.split('.');
    if(!parts || parts.length !== 4) {
        return 0;
    }

    const num = parts.map(p => parseInt(p));

    return ((num[0] & 0xff) << 24) + ((num[1] & 0xff) << 16) + ((num[2] & 0xff) << 8) + (num[3] & 0xff);
};
