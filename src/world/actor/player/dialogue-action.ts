import { Player } from '@server/world/actor/player/player';
import { cache } from '@server/game-server';
import { Npc } from '@server/world/actor/npc/npc';
import { WidgetsClosedWarning } from '@server/error-handling';

export const dialogueWidgetIds = {
    PLAYER: [ 64, 65, 66, 67 ],
    NPC: [ 241, 242, 243, 244 ],
    OPTIONS: [ 228, 230, 232, 234 ],
    TEXT: [ 210, 211, 212, 213, 214 ]
};

type LineConstraint = [ number, number ];

/**
 * Min -> max lines for a specific dialogue type.
 */
const lineConstraints: { [key: string]: LineConstraint } = {
    PLAYER: [ 1, 4 ],
    NPC: [ 1, 4 ],
    OPTIONS: [ 2, 5 ],
    TEXT: [ 1, 5 ]
};

export enum DialogueEmote {
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

export type DialogueType = 'PLAYER' | 'NPC' | 'OPTIONS' | 'TEXT';

export interface DialogueOptions {
    type: DialogueType;
    npc?: number;
    emote?: DialogueEmote;
    title?: string;
    skillId?: number;
    lines: string[];
}

// @DEPRECATED
export class DialogueAction {

    private _action: number = null;

    public constructor(private readonly p: Player) {
    }

    public async player(emote: DialogueEmote, lines: string[]): Promise<DialogueAction> {
        return this.dialogue({ emote, lines, type: 'PLAYER' });
    }

    public async npc(npc: Npc | number, emote: DialogueEmote, lines: string[]): Promise<DialogueAction> {
        return this.dialogue({ emote, lines, type: 'NPC', npc: typeof npc === 'number' ? npc : npc.id });
    }

    public async options(title: string, options: string[]): Promise<DialogueAction> {
        return this.dialogue({ type: 'OPTIONS', title, lines: options });
    }

    public async dialogue(options: DialogueOptions): Promise<DialogueAction> {
        if(options.lines.length < lineConstraints[options.type][0] || options.lines.length > lineConstraints[options.type][1]) {
            throw new Error('Invalid line length.');
        }

        if(options.type === 'NPC' && options.npc === undefined) {
            throw new Error('NPC not supplied.');
        }

        this._action = null;

        let widgetIndex = options.lines.length - 1;
        if(options.type === 'OPTIONS') {
            widgetIndex--;
        }

        const widgetId = dialogueWidgetIds[options.type][widgetIndex];

        if(widgetId === undefined || widgetId === null || widgetId === -1) {
            return Promise.resolve(this);
        }

        let textOffset = 0;

        if(options.type === 'PLAYER' || options.type === 'NPC') {
            if(!options.emote) {
                options.emote = DialogueEmote.DEFAULT;
            }

            if(options.type === 'NPC') {
                this.p.outgoingPackets.setWidgetNpcHead(widgetId, 0, options.npc);
                this.p.outgoingPackets.updateWidgetString(widgetId, 1, cache.npcDefinitions.get(options.npc).name);
            } else if(options.type === 'PLAYER') {
                this.p.outgoingPackets.setWidgetPlayerHead(widgetId, 0);
                this.p.outgoingPackets.updateWidgetString(widgetId, 1, this.p.username);
            }

            this.p.outgoingPackets.playWidgetAnimation(widgetId, 0, options.emote);
            textOffset = 2;
        } else if(options.type === 'OPTIONS') {
            this.p.outgoingPackets.updateWidgetString(widgetId, 0, options.title);
            textOffset = 1;
        } else if(options.type === 'TEXT') {
            textOffset = 0;
        }

        for(let i = 0; i < options.lines.length; i++) {
            this.p.outgoingPackets.updateWidgetString(widgetId, textOffset + i, options.lines[i]);
        }

        return new Promise<DialogueAction>((resolve, reject) => {
            this.p.interfaceState.openWidget(widgetId, {
                slot: 'chatbox'
            })

            const sub = this.p.dialogueInteractionEvent.subscribe(action => {
                sub.unsubscribe();
                this._action = action;
                resolve(this);
            });
        });
    }

    public close(): void {
        this.p.outgoingPackets.closeActiveWidgets();
    }

    public get action(): number {
        return this._action;
    }

    public set action(value: number) {
        this._action = value;
    }
}

export const dialogueAction = async (player: Player, options?: DialogueOptions): Promise<DialogueAction> => {
    if(options) {
        return new DialogueAction(player).dialogue(options);
    } else {
        return Promise.resolve(new DialogueAction(player));
    }
};
