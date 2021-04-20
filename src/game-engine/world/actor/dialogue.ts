import { Npc } from '@engine/world/actor/npc/npc';
import { Player } from '@engine/world/actor/player/player';
import { filestore } from '@engine/game-server';
import { logger } from '@runejs/core';
import _ from 'lodash';
import { wrapText } from '@engine/util/strings';
import { findNpc } from '@engine/config';


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
const optionWidgetIds = [ 228, 230, 232, 234, 235 ];
const continuableTextWidgetIds = [ 210, 211, 212, 213, 214 ];
const textWidgetIds = [ 215, 216, 217, 218, 219 ];
const titledTextWidgetId = 372;

function wrapDialogueText(text: string, type: 'ACTOR' | 'TEXT'): string[] {
    return wrapText(text, type === 'ACTOR' ? 340 : 430);
}

function parseDialogueFunctionArgs(func: Function): string[] {
    const str = func.toString();

    if(!str) {
        return null;
    }

    const argEndIndex = str.indexOf('=>');

    if(argEndIndex === -1) {
        return null;
    }

    const arg = str.substring(0, argEndIndex).replace(/[\\(\\) ]/g, '').trim();
    if(!arg || arg.length === 0) {
        return null;
    }

    return arg.split(',');
}

export type DialogueTree = (Function | DialogueFunction | GoToAction)[];

export interface AdditionalOptions {
    closeOnWalk?: boolean;
    permanent?: boolean;
}

interface NpcParticipant {
    npc: Npc | number | string;
    key: string;
}

class DialogueFunction {
    constructor(public type: string, public execute: Function) {}
}

export const execute = (execute: Function): DialogueFunction => new DialogueFunction('execute', execute);
export const goto = (to: string | Function): GoToAction => new GoToAction(to);

type ParsedDialogueTree = (DialogueAction | DialogueFunction | string)[];

interface DialogueAction {
    tag: string;
    type: string;
}

class GoToAction implements DialogueAction {
    public tag: string;
    public type = 'GOTO';

    constructor(public to: string | Function) {
    }
}

interface ActorDialogueAction extends DialogueAction {
    animation: number;
    lines: string[];
}

interface NpcDialogueAction extends ActorDialogueAction {
    npcId: number;
}

interface PlayerDialogueAction extends ActorDialogueAction {
    player: Player;
}

interface TextDialogueAction extends DialogueAction {
    lines: string[];
    canContinue: boolean;
}

interface TitledTextDialogueAction extends DialogueAction {
    title: string;
    lines: string[];
}

interface OptionsDialogueAction extends DialogueAction {
    options: { [key: string]: ParsedDialogueTree };
}

interface SubDialogueTreeAction extends DialogueAction {
    subTree: DialogueTree;
    npcParticipants?: NpcParticipant[];
}

function parseDialogueTree(player: Player, npcParticipants: NpcParticipant[], dialogueTree: DialogueTree): ParsedDialogueTree {
    const parsedDialogueTree: ParsedDialogueTree = [];

    for(let i = 0; i < dialogueTree.length; i++) {
        const dialogueAction = dialogueTree[i];

        if(dialogueAction instanceof DialogueFunction) {
            // Code execution dialogue.
            parsedDialogueTree.push(dialogueAction as DialogueFunction);
            continue;
        }

        if(dialogueAction instanceof GoToAction) {
            parsedDialogueTree.push(dialogueAction);
            continue;
        }

        let args = parseDialogueFunctionArgs(dialogueAction);
        if(args === null) {
            args = ['()'];
        }
        const dialogueType = args[0];
        let tag: string = null;

        if(args.length === 2 && typeof args[1] === 'string') {
            player.metadata.dialogueIndices[args[1]] = i;
            tag = args[1];
        }

        if(!dialogueType) {
            logger.error('No arguments passed to dialogue function.');
            continue;
        }

        let isOptions = false;

        if(dialogueType === 'options' || dialogueType === '()') {
            // Options or custom function dialogue.

            let result = dialogueAction();

            if(dialogueType === '()') {
                const funcResult = result();

                if(!Array.isArray(funcResult) || funcResult.length === 0) {
                    logger.error('Invalid dialogue function response type.');
                    continue;
                }

                if(typeof funcResult[0] === 'function') {
                    // given function returned a dialogue tree
                    parsedDialogueTree.push(...parseDialogueTree(player, npcParticipants, funcResult));
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
                const optionsDialogueAction: OptionsDialogueAction = {
                    options: {},
                    tag, type: 'OPTIONS'
                };

                for(let j = 0; j < options.length; j++) {
                    const option = options[j];
                    const tree = parseDialogueTree(player, npcParticipants, trees[j]);
                    optionsDialogueAction.options[option] = tree;
                }

                parsedDialogueTree.push(optionsDialogueAction);
            }
        } else if(dialogueType === 'text') {
            // Text-only dialogue (with the option to click continue).

            const text: string = dialogueAction();
            const lines = wrapDialogueText(text, 'TEXT');
            parsedDialogueTree.push({ lines, tag, type: 'TEXT', canContinue: true } as TextDialogueAction);
        } else if(dialogueType === 'overlay') {
            // Text-only dialogue (no option to continue).

            const text: string = dialogueAction();
            const lines = wrapDialogueText(text, 'TEXT');
            parsedDialogueTree.push({ lines, tag, type: 'TEXT', canContinue: false } as TextDialogueAction);
        } else if(dialogueType === 'titled') {
            // Text-only dialogue (no option to continue).

            const [ title, text ] = dialogueAction();
            const lines = wrapDialogueText(text, 'TEXT');

            while(lines.length < 4) {
                lines.push('');
            }

            parsedDialogueTree.push({ lines, title, tag, type: 'TITLED' } as TitledTextDialogueAction);
        } else if(dialogueType === 'subtree') {
            // Dialogue sub-tree.

            const subTree: DialogueTree = dialogueAction();
            parsedDialogueTree.push({ tag, type: 'SUBTREE', subTree, npcParticipants } as SubDialogueTreeAction);
        } else {
            // Player or Npc dialogue.

            let dialogueDetails: [ Emote, string ];
            let npc: Npc | number | string;

            if(dialogueType !== 'player') {
                const participant = npcParticipants.find(p => p.key === dialogueType) as NpcParticipant;
                if(!participant || !participant.npc) {
                    logger.error('No matching npc found for npc dialogue action.');
                    continue;
                }

                npc = participant.npc;
                if(typeof npc !== 'number') {
                    if(typeof npc === 'string') {
                        npc = findNpc(npc)?.gameId || 0;
                    } else {
                        npc = npc.id;
                    }
                }

                dialogueDetails = dialogueAction(npc);
            } else {
                dialogueDetails = dialogueAction(player);
            }

            const emote = dialogueDetails[0] as Emote;
            const text = dialogueDetails[1] as string;
            const lines = wrapDialogueText(text, 'ACTOR');
            const animation = nonLineEmotes.indexOf(emote) !== -1 ? EmoteAnimation[emote] : EmoteAnimation[`${emote}_${lines.length}LINE`];

            if(dialogueType !== 'player') {
                const npcDialogueAction: NpcDialogueAction = {
                    npcId: npc as number, animation, lines, tag, type: 'NPC'
                };

                parsedDialogueTree.push(npcDialogueAction);
            } else {
                const playerDialogueAction: PlayerDialogueAction = {
                    player, animation, lines, tag, type: 'PLAYER'
                };

                parsedDialogueTree.push(playerDialogueAction);
            }
        }
    }

    return parsedDialogueTree;
}

async function runDialogueAction(player: Player, dialogueAction: string | DialogueFunction | DialogueAction,
    tag?: string | undefined | false, additionalOptions?: AdditionalOptions): Promise<string | undefined | false> {
    if(dialogueAction instanceof DialogueFunction && !tag) {
        // Code execution dialogue.
        dialogueAction.execute();
        return tag;
    }

    dialogueAction = dialogueAction as DialogueAction;

    if(dialogueAction.type === 'GOTO' && !tag) {
        // Goto dialogue.
        const goToAction = (dialogueAction as GoToAction);
        if(typeof goToAction.to === 'function') {
            const goto: string = goToAction.to();
            await runParsedDialogue(player, player.metadata.dialogueTree, goto, additionalOptions);
        } else {
            await runParsedDialogue(player, player.metadata.dialogueTree, goToAction.to, additionalOptions);
        }
        return tag;
    }

    let widgetId: number;
    let isOptions = false;

    if(dialogueAction.type === 'OPTIONS') {
        // Option dialogue.
        const optionsAction = dialogueAction as OptionsDialogueAction;
        isOptions = true;
        const options = Object.keys(optionsAction.options);
        const trees = options.map(option => optionsAction.options[option]);

        if(tag === undefined || dialogueAction.tag === tag) {
            tag = undefined;

            widgetId = optionWidgetIds[options.length - 2];

            for(let i = 0; i < options.length; i++) {
                player.outgoingPackets.updateWidgetString(widgetId, 1 + i, options[i]);
            }
        } else if(tag !== undefined) {
            for(let i = 0; i < options.length; i++) {
                const tree = trees[i];
                const didRun = await runParsedDialogue(player, tree, tag, additionalOptions);
                if(didRun) {
                    return;
                }
            }
        }
    } else if(dialogueAction.type === 'TEXT') {
        // Text-only dialogue.

        if(tag === undefined || dialogueAction.tag === tag) {
            tag = undefined;

            const textDialogueAction = dialogueAction as TextDialogueAction;
            const lines = textDialogueAction.lines;

            if(lines.length > 5) {
                throw new Error(`Too many lines for text dialogue! Dialogue has ${lines.length} lines but ` +
                    `the maximum is 5: ${JSON.stringify(lines)}`);
            }

            widgetId = (textDialogueAction.canContinue ? continuableTextWidgetIds : textWidgetIds)[lines.length - 1];

            for(let i = 0; i < lines.length; i++) {
                player.outgoingPackets.updateWidgetString(widgetId, i, lines[i]);
            }
        }
    } else if(dialogueAction.type === 'TITLED') {
        // Text-only dialogue.

        if(tag === undefined || dialogueAction.tag === tag) {
            tag = undefined;

            const titledDialogueAction = dialogueAction as TitledTextDialogueAction;
            const { title, lines } = titledDialogueAction;

            if(lines.length > 4) {
                throw new Error(`Too many lines for titled dialogue! Dialogue has ${lines.length} lines but ` +
                    `the maximum is 4: ${JSON.stringify(lines)}`);
            }

            widgetId = titledTextWidgetId;

            player.outgoingPackets.updateWidgetString(widgetId, 0, title);

            for(let i = 0; i < lines.length; i++) {
                player.outgoingPackets.updateWidgetString(widgetId, i + 1, lines[i]);
            }
        }
    } else if(dialogueAction.type === 'SUBTREE') {
        // Dialogue sub-tree.

        const action = (dialogueAction as SubDialogueTreeAction);

        if(dialogueAction.tag === tag) {
            const originalIndices = _.cloneDeep(player.metadata.dialogueIndices || {});
            const originalTree = _.cloneDeep(player.metadata.dialogueTree || []);
            player.metadata.dialogueIndices = {};
            const parsedSubTree = parseDialogueTree(player, action.npcParticipants, action.subTree);
            player.metadata.dialogueTree = parsedSubTree;

            await runParsedDialogue(player, parsedSubTree, undefined, additionalOptions);

            player.metadata.dialogueIndices = originalIndices;
            player.metadata.dialogueTree = originalTree;
        } else if(tag && dialogueAction.tag !== tag) {
            const originalIndices = _.cloneDeep(player.metadata.dialogueIndices || {});
            const originalTree = _.cloneDeep(player.metadata.dialogueTree || []);
            player.metadata.dialogueIndices = {};
            const parsedSubTree = parseDialogueTree(player, action.npcParticipants, action.subTree);
            player.metadata.dialogueTree = parsedSubTree;

            await runParsedDialogue(player, parsedSubTree, tag, additionalOptions);

            player.metadata.dialogueIndices = originalIndices;
            player.metadata.dialogueTree = originalTree;
        }
    } else {
        // Player or Npc dialogue.

        if(tag === undefined || dialogueAction.tag === tag) {
            tag = undefined;

            let npcId: number;

            if(dialogueAction.type === 'NPC') {
                npcId = (dialogueAction as NpcDialogueAction).npcId;
            }

            const actorDialogueAction = dialogueAction as ActorDialogueAction;
            const lines = actorDialogueAction.lines;

            if(lines.length > 4) {
                throw new Error(`Too many lines for actor dialogue! Dialogue has ${lines.length} lines but ` +
                    `the maximum is 4: ${JSON.stringify(lines)}`);
            }

            const animation = actorDialogueAction.animation;

            if(dialogueAction.type === 'NPC') {
                widgetId = npcWidgetIds[lines.length - 1];
                player.outgoingPackets.setWidgetNpcHead(widgetId, 0, npcId as number);
                player.outgoingPackets.updateWidgetString(widgetId, 1,
                    filestore.configStore.npcStore.getNpc(npcId as number).name);
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
    }

    if(tag === undefined && widgetId) {
        const permanent = additionalOptions?.permanent || false;

        if(permanent) {
            player.interfaceState.openChatOverlayWidget(widgetId);
        } else {
            player.interfaceState.openWidget(widgetId, {
                slot: 'chatbox',
                multi: false
            });

            const widgetClosedEvent = await player.interfaceState.widgetClosed('chatbox');

            if(widgetClosedEvent.data !== undefined) {
                if(isOptions && typeof widgetClosedEvent.data === 'number') {
                    const optionsAction = dialogueAction as OptionsDialogueAction;
                    const options = Object.keys(optionsAction.options);
                    const trees = options.map(option => optionsAction.options[option]);
                    const tree: ParsedDialogueTree = trees[widgetClosedEvent.data - 1];
                    if(tree && tree.length !== 0) {
                        await runParsedDialogue(player, tree, tag, additionalOptions);
                    }
                }
            } else {
                return false;
            }
        }
    }

    return tag;
}

async function runParsedDialogue(player: Player, dialogueTree: ParsedDialogueTree, tag?: string | undefined | false,
                                 additionalOptions?: AdditionalOptions): Promise<boolean> {
    for(let i = 0; i < dialogueTree.length; i++) {
        tag = await runDialogueAction(player, dialogueTree[i], tag, additionalOptions);
        if(tag === false) {
            break;
        }
    }

    return tag === undefined;
}

export async function dialogue(participants: (Player | NpcParticipant)[], dialogueTree: DialogueTree,
    additionalOptions?: AdditionalOptions): Promise<boolean> {
    const player = participants.find(p => p instanceof Player) as Player;

    if(!player) {
        throw new Error('Player instance not provided to dialogue action.');
    }

    let npcParticipants = participants.filter(p => !(p instanceof Player)) as NpcParticipant[];
    if(!npcParticipants) {
        npcParticipants = [];
    }

    player.metadata.dialogueIndices = {};
    const parsedDialogueTree = parseDialogueTree(player, npcParticipants, dialogueTree);
    player.metadata.dialogueTree = parsedDialogueTree;

    try {
        await runParsedDialogue(player, parsedDialogueTree, undefined, additionalOptions);
        player.interfaceState.closeAllSlots();
        return true;
    } catch(error) {
        player.interfaceState.closeAllSlots();
        logger.warn(error);
        return false;
    }
}

const itemSelectionDialogueAmounts = [
    1, 5, 'X', 'All'
];
const itemSelectionDialogues = {
    // 303-306 - what would you like to make?
    303: {
        items: [ 2, 3 ],
        text: [ 7, 11 ],
        options: [ [ 7, 6, 5, 4 ], [ 11, 10, 9, 8 ] ]
    },
    304: {
        items: [ 2, 3, 4 ],
        text: [ 8, 12, 16 ],
        options: [ [ 8, 7, 6, 5 ], [ 12, 11, 10, 9 ], [ 16, 15, 14, 13 ] ]
    },
    305: {
        items: [ 2, 3, 4, 5 ],
        text: [ 9, 13, 17, 21 ],
        options: [ [ 9, 8, 7, 6 ], [ 13, 12, 11, 10 ], [ 17, 16, 15, 14 ], [ 21, 20, 19, 18 ] ]
    },
    306: {
        items: [ 2, 3, 4, 5, 6 ],
        text: [ 10, 14, 18, 22, 26 ],
        options: [ [ 10, 9, 8, 7 ], [ 14, 13, 12, 11 ], [ 18, 17, 16, 15 ], [ 22, 21, 20, 19 ], [ 26, 25, 24, 23 ] ]
    },
    307: { // 307 - how many would you like to cook?
        items: [ 2 ],
        text: [ 6 ],
        options: [ [ 6, 5, 4, 3 ] ]
    },
    309: { // 309 - how many would you like to make?
        items: [ 2 ],
        text: [ 6 ],
        options: [ [ 6, 5, 4, 3 ] ]
    }
};

export interface SelectableItem {
    itemId: number;
    itemName: string;
    offset?: number;
    zoom?: number;
}

export interface ItemSelection {
    itemId: number;
    amount: number;
}

export async function itemSelectionDialogue(player: Player, type: 'COOKING' | 'MAKING', items: SelectableItem[]): Promise<ItemSelection> {
    let widgetId = 307;

    if(type === 'MAKING') {
        if(items.length === 1) {
            widgetId = 309;
        } else {
            if(items.length > 5) {
                throw new Error(`Too many items provided to the item selection action!`);
            }

            widgetId = (301 + items.length);
        }
    }

    const childIds = itemSelectionDialogues[widgetId].items;
    childIds.forEach((childId, index) => {
        const itemInfo = items[index];

        if(itemInfo.offset === undefined) {
            itemInfo.offset = -12;
        }

        if(itemInfo.zoom === undefined) {
            itemInfo.zoom = 180;
        }

        player.outgoingPackets.setItemOnWidget(widgetId, childId, itemInfo.itemId, itemInfo.zoom);
        player.outgoingPackets.moveWidgetChild(widgetId, childId, 0, itemInfo.offset);
        player.outgoingPackets.updateWidgetString(widgetId, itemSelectionDialogues[widgetId].text[index], '\\n\\n\\n\\n' + itemInfo.itemName);
    });

    return new Promise((resolve, reject) => {
        player.interfaceState.openWidget(widgetId, {
            slot: 'chatbox',
            multi: true
        });

        let actionsSub = player.actionsCancelled.subscribe(() => {
            actionsSub.unsubscribe();
            reject('Pending Actions Cancelled');
        });

        const interactionSub = player.dialogueInteractionEvent.subscribe(childId => {
            if(!player.interfaceState.widgetOpen('chatbox', widgetId)) {
                interactionSub.unsubscribe();
                actionsSub.unsubscribe();
                reject('Active Widget Mismatch');
                return;
            }

            const options = itemSelectionDialogues[widgetId].options;

            const choiceIndex = options.findIndex(arr => arr.indexOf(childId) !== -1);

            if(choiceIndex === -1) {
                interactionSub.unsubscribe();
                actionsSub.unsubscribe();
                reject('Choice Index Not Found');
                return;
            }

            const optionIndex = options[choiceIndex].indexOf(childId);

            if(optionIndex === -1) {
                interactionSub.unsubscribe();
                actionsSub.unsubscribe();
                reject('Option Index Not Found');
                return;
            }

            const itemId = items[choiceIndex].itemId;
            let amount = itemSelectionDialogueAmounts[optionIndex];

            if(amount === 'X') {
                actionsSub.unsubscribe();

                player.outgoingPackets.showNumberInputDialogue();

                actionsSub = player.actionsCancelled.subscribe(() => {
                    actionsSub.unsubscribe();
                    reject('Pending Actions Cancelled');
                });

                const inputSub = player.numericInputEvent.subscribe(input => {
                    inputSub.unsubscribe();
                    actionsSub.unsubscribe();
                    interactionSub.unsubscribe();

                    if(input < 1 || input > 2147483647) {
                        player.interfaceState.closeWidget('chatbox');
                        reject('Invalid User Amount Input');
                    } else {
                        player.interfaceState.closeWidget('chatbox');
                        resolve({ itemId, amount: input } as ItemSelection);
                    }
                });
            } else {
                if(amount === 'All') {
                    amount = player.inventory.findAll(itemId).length;
                }

                actionsSub.unsubscribe();
                interactionSub.unsubscribe();
                player.interfaceState.closeWidget('chatbox');
                resolve({ itemId, amount } as ItemSelection);
            }
        });
    });
}
