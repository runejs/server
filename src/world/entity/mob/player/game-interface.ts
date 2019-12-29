export const interfaceIds = {
    characterDesign: 3559,
    inventory: 3214,
    equipment: 1688
};

export interface ActiveInterface {
    interfaceId: number;
    canWalk: boolean;
    closeOnWalk?: boolean;
}
