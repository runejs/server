export const widgets: any = {
    characterDesign: 269,
    furnace: {
        widgetId: 311,
        slots: {
            slot0: { modelId: 4, titleId: 16 },
            slot1: { modelId: 5, titleId: 20 },
            slot2: { modelId: 6, titleId: 24 },
            slot3: { modelId: 7, titleId: 28 },
            slot4: { modelId: 8, titleId: 32 },
            slot5: { modelId: 9, titleId: 36 },
            slot6: { modelId: 10, titleId: 40 },
            slot7: { modelId: 11, titleId: 44 },
            slot8: { modelId: 12, titleId: 48 },
        }
    },
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
    bank: {
        screenWidget: {
            widgetId: 12,
            containerId: 89,
        },
        tabWidget: {
            widgetId: 266,
            containerId: 0
        }
    },
    skillGuide: 308,
    skillsTab: 320,
    logoutTab: 182,
    settingsTab: 261,
    emotesTab: 464,
    musicPlayerTab: 239,
    questTab: 274,
    shop: {
        widgetId: 300,
        containerId: 75,
        title: 76
    },
    shopPlayerInventory: {
        widgetId: 301,
        containerId: 0
    },
    questJournal: 275,
    questReward: 277,
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
    },
    whatWouldYouLikeToSpin: 459
};

export const widgetScripts = {
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
    bankWithdrawNoteMode: 115,
    acceptAid: 427,
    areaEffectVolume: 872,
    questPoints: 101
};

export interface PlayerWidget {
    widgetId: number;
    secondaryWidgetId?: number;
    type: 'SCREEN' | 'CHAT' | 'FULLSCREEN' | 'SCREEN_AND_TAB';
    disablePlayerMovement?: boolean;
    closeOnWalk?: boolean;
    forceClosed?: Function;
    beforeOpened?: Function;
    afterOpened?: Function;
}
