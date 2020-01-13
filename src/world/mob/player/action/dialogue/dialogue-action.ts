import { Player } from '@server/world/mob/player/player';
import { gameCache } from '@server/game-server';

const interfaceIds = {
    PLAYER: [ 968, 973, 979, 986 ],
    NPC: [ 4882, 4887, 4893, 4900 ]
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

export type DialogueType = 'PLAYER' | 'NPC';

export interface DialogueOptions {
    type: DialogueType;
    npc?: number;
    emote?: DialogueEmote;
    lines: string[];
}

export const closeDialogue = (player: Player): void => {
    player.packetSender.closeActiveInterfaces();
};

export const dialogueAction = (player: Player, options: DialogueOptions): Promise<number> => {
    if(options.lines.length === 0 || options.lines.length > 4) {
        throw 'Invalid line length.';
    }

    if(options.type === 'NPC' && options.npc === undefined) {
        throw 'NPC not supplied.';
    }

    const interfaceId = interfaceIds[options.type][options.lines.length - 1];
    let textOffset = 1;

    if(options.type === 'PLAYER' || options.type === 'NPC') {
        if(!options.emote) {
            options.emote = DialogueEmote.DEFAULT;
        }

        if(options.type === 'NPC') {
            player.packetSender.setInterfaceModel2(interfaceId + 1, options.npc);
            player.packetSender.updateInterfaceString(interfaceId + 2, gameCache.npcDefinitions.get(options.npc).name);
        } else if(options.type === 'PLAYER') {
            // @TODO
            player.packetSender.updateInterfaceString(interfaceId + 2, player.username);
        }

        player.packetSender.playInterfaceAnimation(interfaceId + 1, options.emote);
        textOffset += 2;
    }

    for(let i = 0; i < options.lines.length; i++) {
        player.packetSender.updateInterfaceString(interfaceId + textOffset + i, options.lines[i]);
    }

    player.packetSender.showChatboxInterface(interfaceId);

    return new Promise<number>(resolve => {
        player.dialogueInteractionEvent.subscribe(value => {
            resolve(value);
        })
    });
};
