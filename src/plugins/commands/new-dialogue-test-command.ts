import { ActionType, RunePlugin } from '@server/plugins/plugin';
import { commandAction } from '@server/world/actor/player/action/input-command-action';
import { gameCache, world } from '@server/game-server';
import { Player } from '@server/world/actor/player/player';
import { Npc } from '@server/world/actor/npc/npc';
import { Subscription } from 'rxjs';

function parseDialogueFunctionArgs(func): string {
    const str = func.toString();

    if(!str) {
        return null;
    }

    const argEndIndex = str.indexOf('=>');

    if(argEndIndex === -1) {
        return null;
    }

    let arg = str.substring(0, argEndIndex).trim();
    if(!arg || arg.length === 0) {
        return null;
    }

    return arg;
}

export enum Emote {
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

type DialogueTree = (Function | DialogueFunction)[];

interface NpcParticipant {
    npc: Npc | number;
    key: string;
}

const playerWidgetIds = [ 64, 65, 66, 67 ];
const npcWidgetIds = [ 241, 242, 243, 244 ];
const optionWidgetIds = [ 228, 230, 232, 234 ];

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

        if(text.charAt(i) === ' ') {
            lastSpace = i;
            widthAfterSpace = 0;
        }

        if(width >= maxWidth) {
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

export async function dialogue(participants: (Player | NpcParticipant)[], dialogueTree: DialogueTree): Promise<void> {
    const player = participants.find(p => p instanceof Player) as Player;

    if(!player) {
        return Promise.reject('Player instance not provided to dialogue action.');
    }

    let stopLoop = false;

    for(const dialogueAction of dialogueTree) {
        if(stopLoop) {
            return Promise.reject('Action cancelled.');
        }

        let sub: Subscription[] = [];

        await new Promise((resolve, reject) => {
            if(dialogueAction instanceof DialogueFunction) {
                dialogueAction.execute();
                resolve();
                return;
            }

            const args = parseDialogueFunctionArgs(dialogueAction);
            if(!args) {
                console.error('No arguments passed to dialogue function.');
                resolve();
                return;
            }

            let widgetId: number;
            let isOptions = false;

            if(args === '()') {
                const trees = dialogueAction();
                const options = Object.keys(trees);
                isOptions = true;
                widgetId = optionWidgetIds[options.length - 2];

                for(let i = 0; i < options.length; i++) {
                    player.outgoingPackets.updateWidgetString(widgetId, 1 + i, options[i]);
                }

                sub.push(player.dialogueInteractionEvent.subscribe(choice => {
                    sub.forEach(s => s.unsubscribe());
                    const tree = trees[options[choice - 1]];
                    dialogue(participants, tree).then(() => resolve());
                }));
            } else if(args === 'player') {
                const dialogueDetails = dialogueAction(player);
                const emote = dialogueDetails[0] as Emote;
                const text = dialogueDetails[1] as string;
                const lines = wrapText(text, 'ACTOR');
                widgetId = playerWidgetIds[lines.length - 1];

                player.outgoingPackets.setWidgetPlayerHead(widgetId, 0);
                player.outgoingPackets.playWidgetAnimation(widgetId, 0, emote);
                player.outgoingPackets.updateWidgetString(widgetId, 1, player.username);

                for(let i = 0; i < lines.length; i++) {
                    player.outgoingPackets.updateWidgetString(widgetId, 2 + i, lines[i]);
                }
            } else {
                const participant = participants.find(p => (!(p instanceof Player) && p.key === args) ? p.npc : null) as NpcParticipant;
                if(!participant || !participant.npc) {
                    resolve();
                    return;
                }

                let npc = participant.npc;
                if(typeof npc !== 'number') {
                    npc = npc.id;
                }

                const dialogueDetails = dialogueAction(npc);
                const emote = dialogueDetails[0] as Emote;
                const text = dialogueDetails[1] as string;
                const lines = wrapText(text, 'ACTOR');
                widgetId = npcWidgetIds[lines.length - 1];

                player.outgoingPackets.setWidgetNpcHead(widgetId, 0, npc);
                player.outgoingPackets.playWidgetAnimation(widgetId, 0, emote);
                player.outgoingPackets.updateWidgetString(widgetId, 1, gameCache.npcDefinitions.get(npc).name);

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

class DialogueFunction {
    constructor(public type: string, public execute: Function) {}
}

export const execute = (execute: Function): DialogueFunction => new DialogueFunction('execute', execute);

const action: commandAction = (details) => {
    const { player } = details;
    const npc = world.npcList[0];

    dialogue([ player, { npc, key: 'hans' } ], [
        hans => [ Emote.GENERIC_1LINE, 'Hey how are you?' ],
        () => ({
            'Doing great!': [
                player => [ Emote.HAPPY_1LINE, 'Doings great, how about yourself?' ],
                hans => [ Emote.HAPPY_1LINE, `Can't complain.` ]
            ],
            'Eh, not bad.': [
                player => [ Emote.DROWZY_1LINE, 'Eh, not bad.' ],
                hans => [ Emote.GENERIC_1LINE, 'I feel ya.' ]
            ],
            'Not so good.': [
                player => [ Emote.SAD_1LINE, 'Not so good, honestly.' ],
                hans => [ Emote.WORRIED_1LINE, 'What has you down?' ],
                player => [ Emote.SAD_1LINE, `Well, first it started this morning when my cat woke me up an hour early. After that, the little bastard just kept meowing and meowing at me...` ],
                execute(() => {
                    player.setQuestStage(0, 'NOT_STARTED');
                    player.sendMessage('Here ya go!');
                }),
                hans => [ Emote.SAD_1LINE, `Shit that sucks fam, I'm sorry.`  ]
            ]
        }),
        player => [ Emote.GENERIC_1LINE, `See ya around.` ]
    ]).then(() => {
        // do something with dialogue result.
    }).catch(() => {});
};

export default new RunePlugin({ type: ActionType.COMMAND, commands: 'd', action });
