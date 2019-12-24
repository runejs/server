export const interfaceIds = {
    characterDesign: 3559
};

export interface ActiveInterface {
    interfaceId: number;
    canWalk: boolean;
    closeOnWalk?: boolean;
}
