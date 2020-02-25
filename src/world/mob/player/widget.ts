export const widgetIds: any = {
    characterDesign: 269,
    inventory: {
        widgetId: 149,
        containerId: 0
    },
    equipment: {
        widgetId: 387,
        containerId: 25
    },
    shop: {
        shopInventory: 3900,
        shopScreen: 3824,
        playerInventory: 3823,
        playerTab: 3822,
        shopTitle: 3901
    },
    welcomeScreen: 378,
    welcomeScreenChildren: {
        cogs: 16,
        question: 17,
        drama: 18,
        bankPin: 19,
        bankPinQuestion: 20,
        scamming: 21,
        bankPinKey: 22,
        christmas: 23,
        killcount: 24
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
    secondaryWidgetId?: number;
    type: 'SCREEN' | 'CHAT' | 'FULLSCREEN' | 'SCREEN_AND_TAB';
    disablePlayerMovement?: boolean;
    closeOnWalk?: boolean;
    forceClosed?: Function;
}
