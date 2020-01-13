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

export enum ChatEmotes {
    JOYFUL = 588,
    CALM_TALK_1 = 589,
    CALM_TALK_2 = 590,
    DEFAULT = 591,
    EVIL_1 = 592,
    EVIL_2 = 593,
    EVIL_3 = 594,
    ANNOYED = 595,
    DISTRESSED_1 = 596,
    DISTRESSED_2 = 597,
    BOWS_HEAD_SAD = 598,
    DRUNK_LEFT = 600,
    DRUNK_RIGHT = 601,
    NOT_INTERESTED = 602,
    SLEEPY = 603,
    DEVILISH = 604,
    LAUGH_1 = 605,
    LAUGH_2 = 606,
    LAUGH_3 = 607,
    LAUGH_4 = 608,
    EVIL_LAUGH = 609,
    SAD_1 = 610,
    SAD_2 = 611,
    SAD_3 = 598,
    SAD_4 = 613,
    CONSIDERING = 612,
    ANGRY_1 = 614,
    ANGRY_2 = 615,
    ANGRY_3 = 616,
    ANGRY_4 = 617
}
