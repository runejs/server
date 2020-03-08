import { Npc } from '@server/world/actor/npc/npc';
import { Player } from '@server/world/actor/player/player';
import { Subscription } from 'rxjs';
import { gameCache } from '@server/game-server';

export enum Emote {
    POMPOUS = 'POMPOUS',
    UNKOWN_CREATURE = 'UNKOWN_CREATURE',
    VERY_SAD = 'VERY_SAD',
    HAPPY = 'HAPPY',
    SHOCKED = 'SHOCKED',
    WONDERING = 'WONDERING',
    GOBLIN = 'GOBLIN',
    TREE = 'TREE',
    GENERIC = 'GENERIC',
    SKEPTICAL = 'SKEPTICAL',
    WORRIED = 'WORRIED',
    DROWZY = 'DROWZY',
    LAUGH = 'LAUGH',
    SAD = 'SAD',
    ANGRY = 'ANGRY',
    EASTER_BUNNY = 'EASTER_BUNNY',

    BLANK_STARE = 'BLANK_STARE',
    SINGLE_WORD = 'SINGLE_WORD',
    EVIL_STARE = 'EVIL_STARE',
    LAUGH_EVIL = 'LAUGH_EVIL'
}

// A big thanks to Dust R I P for all these emotes!
enum EmoteAnimation {
    POMPOUS_1LINE = 554,
    POMPOUS_2LINE = 555,
    POMPOUS_3LINE = 556,
    POMPOUS_4LINE = 557,
    UNKOWN_CREATURE_1LINE = 558,
    UNKOWN_CREATURE_2LINE = 559,
    UNKOWN_CREATURE_3LINE = 560,
    UNKOWN_CREATURE_4LINE = 561,
    VERY_SAD1LINE = 562,
    VERY_SAD2LINE = 563,
    VERY_SAD3LINE = 564,
    VERY_SAD4LINE = 565,
    SINGLE_WORD = 566,
    HAPPY_1LINE = 567,
    HAPPY_2LINE = 568,
    HAPPY_3LINE = 569,
    HAPPY_4LINE = 570,
    SHOCKED_1LINE = 571,
    SHOCKED_2LINE = 572,
    SHOCKED_3LINE = 573,
    SHOCKED_4LINE = 574,
    WONDERING_1LINE = 575,
    WONDERING_2LINE = 576,
    WONDERING_3LINE = 577,
    WONDERING_4LINE = 578,
    BLANK_STARE = 579,
    GOBLIN_1LINE = 580,
    GOBLIN_2LINE = 581,
    GOBLIN_3LINE = 582,
    GOBLIN_4LINE = 583,
    TREE_1LINE = 584,
    TREE_2LINE = 585,
    TREE_3LINE = 586,
    TREE_4LINE = 587,
    GENERIC_1LINE = 588,
    GENERIC_2LINE = 589,
    GENERIC_3LINE = 590,
    GENERIC_4LINE = 591,
    SKEPTICAL_1LINE = 592,
    SKEPTICAL_2LINE = 593,
    SKEPTICAL_3LINE = 594,
    SKEPTICAL_4LINE = 595,
    WORRIED_1LINE = 596,
    WORRIED_2LINE = 597,
    WORRIED_3LINE = 598,
    WORRIED_4LINE = 599,
    DROWZY_1LINE = 600,
    DROWZY_2LINE = 601,
    DROWZY_3LINE = 602,
    DROWZY_4LINE = 603,
    EVIL_STARE = 604,
    LAUGH_1LINE = 605,
    LAUGH_2LINE = 606,
    LAUGH_3LINE = 607,
    LAUGH_4LINE = 608,
    LAUGH_EVIL = 609,
    SAD_1LINE = 610,
    SAD_2LINE = 611,
    SAD_3LINE = 612,
    SAD_4LINE = 613,
    ANGRY_1LINE = 614,
    ANGRY_2LINE = 615,
    ANGRY_3LINE = 616,
    ANGRY_4LINE = 617,
    EASTER_BUNNY_1LINE = 1824,
    EASTER_BUNNY_2LINE = 1825,
    EASTER_BUNNY_3LINE = 1826,
    EASTER_BUNNY_4LINE = 1827,
}

const nonLineEmotes = [ Emote.BLANK_STARE, Emote.SINGLE_WORD, Emote.EVIL_STARE, Emote.LAUGH_EVIL ];
const playerWidgetIds = [ 64, 65, 66, 67 ];
const npcWidgetIds = [ 241, 242, 243, 244 ];
const optionWidgetIds = [ 228, 230, 232, 234 ];

// Thank you to the Apollo team for these values. :)
const charWidths = [ 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3,
    3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 4, 4, 7, 14, 9, 12, 12, 4, 5,
    5, 10, 8, 4, 8, 4, 7, 9, 7, 9, 8, 8, 8, 9, 7, 9, 9, 4, 5, 7,
    9, 7, 9, 14, 9, 8, 8, 8, 7, 7, 9, 8, 6, 8, 8, 7, 10, 9, 9, 8,
    9, 8, 8, 6, 9, 8, 10, 8, 8, 8, 6, 7, 6, 9, 10, 5, 8, 8, 7, 8,
    8, 7, 8, 8, 4, 7, 7, 4, 10, 8, 8, 8, 8, 6, 8, 6, 8, 8, 9, 8,
    8, 8, 6, 4, 6, 12, 3, 10, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3,
    3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3,
    4, 8, 11, 8, 8, 4, 8, 7, 12, 6, 7, 9, 5, 12, 5, 6, 10, 6, 6, 6,
    8, 8, 4, 5, 5, 6, 7, 11, 11, 11, 9, 9, 9, 9, 9, 9, 9, 13, 8, 8,
    8, 8, 8, 4, 4, 5, 4, 8, 9, 9, 9, 9, 9, 9, 8, 10, 9, 9, 9, 9,
    8, 8, 8, 8, 8, 8, 8, 8, 8, 13, 6, 8, 8, 8, 8, 4, 4, 5, 4, 8,
    8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8 ];

function wrapText(text: string, type: 'ACTOR' | 'TEXT'): string[] {
    const maxWidth = type === 'ACTOR' ? 350 : 430;
    const lines = [];

    let lineStartIdx = 0;
    let width = 0;
    let lastSpace = 0;
    let widthAfterSpace = 0;
    for(let i = 0; i < text.length; i++) {
        const charWidth = charWidths[text.charCodeAt(i)];
        width += charWidth;
        widthAfterSpace += charWidth;

        if(text.charAt(i) === ' ' || text.charAt(i) === '\n') {
            lastSpace = i;
            widthAfterSpace = 0;
        }

        if(width >= maxWidth || text.charAt(i) === '\n') {
            lines.push(text.substring(lineStartIdx, lastSpace));
            lineStartIdx = lastSpace + 1;
            width = widthAfterSpace;
        }
    }

    if(lineStartIdx !== text.length - 1) {
        lines.push(text.substring(lineStartIdx, text.length));
    }

    return lines;
}

function parseDialogueFunctionArgs(func): string[] {
    const str = func.toString();

    if(!str) {
        return null;
    }

    const argEndIndex = str.indexOf('=>');

    if(argEndIndex === -1) {
        return null;
    }

    let arg = str.substring(0, argEndIndex).replace(/[\\(\\) ]/g, '').trim();
    if(!arg || arg.length === 0) {
        return null;
    }

    return arg.split(',');
}

type DialogueTree = (Function | DialogueFunction)[];

interface NpcParticipant {
    npc: Npc | number;
    key: string;
}

class DialogueFunction {
    constructor(public type: string, public execute: Function) {}
}

export const execute = (execute: Function): DialogueFunction => new DialogueFunction('execute', execute);

export const goBack = (to: string): Function => goBackTo => to;

// @TODO level-up, plain text
export async function dialogue(participants: (Player | NpcParticipant)[], dialogueTree: DialogueTree, parent: boolean = true): Promise<void> {
    const player = participants.find(p => p instanceof Player) as Player;

    if(!player) {
        return Promise.reject('Player instance not provided to dialogue action.');
    }

    let stopLoop = false;

    if(parent) {
        // dis aint gonna work
        player.metadata.goBackIndexes = {};
    }

    for(let i = 0; i < dialogueTree.length; i++) {
        if(stopLoop) {
            return Promise.reject('Action cancelled.');
        }

        let sub: Subscription[] = [];

        await new Promise((resolve, reject) => {
            const dialogueAction = dialogueTree[i];

            if(dialogueAction instanceof DialogueFunction) {
                // Code execution dialogue.

                dialogueAction.execute();
                resolve();
                return;
            }

            const args = parseDialogueFunctionArgs(dialogueAction);
            const dialogueType = args[0];

            if(args.length === 2 && typeof args[1] === 'string') {
                console.log(args[1]);
                player.metadata.goBackIndexes[args[1]] = i;
                console.log(player.metadata.goBackIndexes);
            }

            if(!dialogueType) {
                console.error('No arguments passed to dialogue function.');
                resolve();
                return;
            }

            let widgetId: number;
            let isOptions = false;

            if(dialogueType === 'options' || dialogueType === '()') {
                // Options or custom function dialogue.

                let result = dialogueAction();

                if(dialogueType === '()') {
                    const funcResult = result();

                    if(!Array.isArray(funcResult) || funcResult.length === 0) {
                        reject('Invalid dialogue function response type.');
                        return;
                    }

                    if(typeof funcResult[0] === 'function') {
                        // given function returned a dialogue tree
                        dialogue(participants, funcResult, false).then(() => resolve());
                    } else {
                        // given function returned an option list
                        result = funcResult;
                        isOptions = true;
                    }
                } else {
                    isOptions = true;
                }

                if(isOptions) {
                    const options = (result as any[]).filter((option, index) => index % 2 === 0);
                    const trees = (result as any[]).filter((option, index) => index % 2 !== 0);
                    isOptions = true;
                    widgetId = optionWidgetIds[options.length - 2];

                    for(let i = 0; i < options.length; i++) {
                        player.outgoingPackets.updateWidgetString(widgetId, 1 + i, options[i]);
                    }

                    sub.push(player.dialogueInteractionEvent.subscribe(choice => {
                        sub.forEach(s => s.unsubscribe());
                        const tree: DialogueTree = trees[choice - 1];
                        if(!tree || tree.length === 0) {
                            resolve();
                        } else {
                            dialogue(participants, tree, false).then(() => resolve());
                        }
                    }));
                }
            } else if(dialogueType === 'goBackTo') {
                console.log('goBackTo');
                const goBackTo = dialogueAction();
                console.log('goBackTo ' + goBackTo);
                console.log(player.metadata.goBackIndexes);
                if(!goBackTo || player.metadata.goBackIndexes[goBackTo] === undefined) {
                    console.log('not find gobackto');
                    resolve();
                    return;
                }
                console.log('goBackTo valid ' + goBackTo);

                i = player.metadata.goBackIndexes[goBackTo];
                resolve();
                return;
            } else {
                // Player or Npc dialogue.

                let dialogueDetails: [ Emote, string ];
                let npc: Npc | number;

                if(dialogueType !== 'player') {
                    const participant = participants.find(p => (!(p instanceof Player) && p.key === dialogueType) ? p.npc : null) as NpcParticipant;
                    if(!participant || !participant.npc) {
                        resolve();
                        return;
                    }

                    npc = participant.npc;
                    if(typeof npc !== 'number') {
                        npc = npc.id;
                    }

                    dialogueDetails = dialogueAction(npc);
                } else {
                    dialogueDetails = dialogueAction(player);
                }

                const emote = dialogueDetails[0] as Emote;
                const text = dialogueDetails[1] as string;
                const lines = wrapText(text, 'ACTOR');
                const animation = nonLineEmotes.indexOf(emote) !== -1 ? EmoteAnimation[emote] : EmoteAnimation[`${emote}_${lines.length}LINE`];

                if(dialogueType !== 'player') {
                    widgetId = npcWidgetIds[lines.length - 1];
                    player.outgoingPackets.setWidgetNpcHead(widgetId, 0, npc as number);
                    player.outgoingPackets.updateWidgetString(widgetId, 1, gameCache.npcDefinitions.get(npc as number).name);
                } else {
                    widgetId = playerWidgetIds[lines.length - 1];
                    player.outgoingPackets.setWidgetPlayerHead(widgetId, 0);
                    player.outgoingPackets.updateWidgetString(widgetId, 1, player.username);
                }

                player.outgoingPackets.playWidgetAnimation(widgetId, 0, animation);

                for(let i = 0; i < lines.length; i++) {
                    player.outgoingPackets.updateWidgetString(widgetId, 2 + i, lines[i]);
                }
            }

            if(!isOptions) {
                sub.push(player.dialogueInteractionEvent.subscribe(() => {
                    sub.forEach(s => s.unsubscribe());
                    resolve();
                }));
            }

            player.activeWidget = {
                widgetId: widgetId,
                type: 'CHAT',
                closeOnWalk: true,
                forceClosed: () => reject('WIDGET_CLOSED')
            };
        }).then(() => {
            sub.forEach(s => s.unsubscribe());
        }).catch(() => {
            sub.forEach(s => s.unsubscribe());
            stopLoop = true;
        });
    }
}
