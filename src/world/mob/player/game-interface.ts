export const interfaceIds = {
    characterDesign: 3559,
    inventory: 3214,
    equipment: 1688
};

export const interfaceSettings = {
    runMode: 173,
    musicVolume: 168,
    soundEffectVolume: 169,
    splitPrivateChat: 287,
    mouseButtons: 170,
    brightness: 166,
    chatEffects: 171,
    acceptAid: 427,
    autoRetaliate: 172,
    musicPlayer: 18,
    attackStyle: 43
};

export interface ActiveInterface {
    interfaceId: number;
    canWalk: boolean;
    closeOnWalk?: boolean;
}
