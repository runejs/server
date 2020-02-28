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
    equipmentStats: {
        widgetId: 465,
        containerId: 103
    },
    equipmentStatsInventory: {
        widgetId: 336,
        containerId: 0
    },
    skillGuide: 308,
    skillsTab: 320,
    logoutTab: 182,
    settingsTab: 261,
    shop: {
        shopInventory: 3900,
        shopScreen: 3824,
        playerInventory: 0,
        playerTab: 56,
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
    musicPlayer: 18,
    attackStyle: 43,
    brightness: 166,
    unknown: 167, // ????
    musicVolume: 168,
    soundEffectVolume: 169,
    mouseButtons: 170,
    chatEffects: 171,
    autoRetaliate: 172,
    runMode: 173,
    splitPrivateChat: 287,
    bankInsertMode: 304,
    acceptAid: 427,
    areaEffectVolume: 872,
};

export interface ActiveWidget {
    widgetId: number;
    secondaryWidgetId?: number;
    type: 'SCREEN' | 'CHAT' | 'FULLSCREEN' | 'SCREEN_AND_TAB';
    disablePlayerMovement?: boolean;
    closeOnWalk?: boolean;
    forceClosed?: Function;
}
