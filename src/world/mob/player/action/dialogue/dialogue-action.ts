import { Player } from '@server/world/mob/player/player';
import { gameCache } from '@server/game-server';
import { Npc } from '@server/world/mob/npc/npc';
import { skillDetails } from '@server/world/mob/skills';

const interfaceIds = {
    PLAYER: [ 968, 973, 979, 986 ],
    NPC: [ 4882, 4887, 4893, 4900 ],
    OPTIONS: [ 2459, 2469, 2480, 2492 ]
};

const lineConstraints = {
    PLAYER: [ 1, 4 ],
    NPC: [ 1, 4 ],
    OPTIONS: [ 2, 5 ],
    LEVEL_UP: [ 2, 2 ]
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

export type DialogueType = 'PLAYER' | 'NPC' | 'OPTIONS' | 'LEVEL_UP';

export interface DialogueOptions {
    type: DialogueType;
    npc?: number;
    emote?: DialogueEmote;
    title?: string;
    skillId?: number;
    lines: string[];
}

export class DialogueAction {

    private _action: number = null;

    public constructor(private readonly p: Player) {
    }

    public player(emote: DialogueEmote, lines: string[]): Promise<DialogueAction> {
        return this.dialogue({ emote, lines, type: 'PLAYER' });
    }

    public npc(npc: Npc, emote: DialogueEmote, lines: string[]): Promise<DialogueAction> {
        return this.dialogue({ emote, lines, type: 'NPC', npc: npc.id });
    }

    public options(title: string, options: string[]): Promise<DialogueAction> {
        return this.dialogue({ type: 'OPTIONS', title, lines: options });
    }

    public dialogue(options: DialogueOptions): Promise<DialogueAction> {
        if(options.lines.length < lineConstraints[options.type][0] || options.lines.length > lineConstraints[options.type][1]) {
            throw 'Invalid line length.';
        }

        if(options.type === 'NPC' && options.npc === undefined) {
            throw 'NPC not supplied.';
        }

        if(options.type === 'LEVEL_UP' && options.skillId === undefined) {
            throw 'Skill ID not supplied.';
        }

        this._action = null;

        let interfaceIndex = options.lines.length - 1;
        if(options.type === 'OPTIONS') {
            interfaceIndex--;
        }

        let interfaceId = -1;

        if(options.type === 'LEVEL_UP') {
            interfaceId = skillDetails.map(skill => skill.advancementInterfaceId === undefined ? -1 : skill.advancementInterfaceId)[options.skillId];
        } else {
            interfaceId = interfaceIds[options.type][interfaceIndex];
        }

        if(interfaceId === undefined || interfaceId === null || interfaceId === -1) {
            return Promise.resolve(this);
        }

        let textOffset = 1;

        if(options.type === 'PLAYER' || options.type === 'NPC') {
            if(!options.emote) {
                options.emote = DialogueEmote.DEFAULT;
            }

            if(options.type === 'NPC') {
                this.p.packetSender.setInterfaceModel2(interfaceId + 1, options.npc);
                this.p.packetSender.updateInterfaceString(interfaceId + 2, gameCache.npcDefinitions.get(options.npc).name);
            } else if(options.type === 'PLAYER') {
                this.p.packetSender.setInterfacePlayerHead(interfaceId + 1);
                this.p.packetSender.updateInterfaceString(interfaceId + 2, this.p.username);
            }

            this.p.packetSender.playInterfaceAnimation(interfaceId + 1, options.emote);
            textOffset += 2;
        } else if(options.type === 'OPTIONS') {
            this.p.packetSender.updateInterfaceString(interfaceId + 1, options.title);
            textOffset += 1;
        }

        for(let i = 0; i < options.lines.length; i++) {
            this.p.packetSender.updateInterfaceString(interfaceId + textOffset + i, options.lines[i]);
        }

        this.p.packetSender.showChatboxInterface(interfaceId);

        return new Promise<DialogueAction>(resolve => {
            this.p.dialogueInteractionEvent.subscribe(action => {
                this._action = action;
                resolve(this);
            })
        });
    }

    public close(): void {
        this.p.packetSender.closeActiveInterfaces();
    }

    public get action(): number {
        return this._action;
    }

    public set action(value: number) {
        this._action = value;
    }
}

export const dialogueAction = (player: Player, options?: DialogueOptions): Promise<DialogueAction> => {
    if(options) {
        return new DialogueAction(player).dialogue(options);
    } else {
        return Promise.resolve(new DialogueAction(player));
    }
};
