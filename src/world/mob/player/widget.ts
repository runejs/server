export const widgetIds = {
    characterDesign: 3559,
    inventory: 3214,
    equipment: 1688,
    shop: 3900,
    welcomeScreen: 15244,
    welcomeScreenChildren: {
        question: 17511,
        christmas: 15819,
        security: 15812,
        itemScam: 15801,
        passwordSecurity: 15791,
        goodBad: 15774,
        drama: 15767
    }
};

export const widgetSettings = {
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

export interface ActiveWidget {
    widgetId: number;
    childWidgetId?: number;
    type: 'SCREEN' | 'CHAT' | 'FULLSCREEN';
    disablePlayerMovement?: boolean;
    closeOnWalk?: boolean;
    forceClosed?: Function;
}
