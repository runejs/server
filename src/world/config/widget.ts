import { Subject } from 'rxjs';

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
    permanent?: boolean;
    forceClosed?: () => void;
    beforeOpened?: () => void;
    afterOpened?: () => void;
    closed?: Subject<void>;
}
