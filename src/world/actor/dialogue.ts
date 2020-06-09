import { Npc } from '@server/world/actor/npc/npc';
import { Player } from '@server/world/actor/player/player';
import { Subscription } from 'rxjs';
import { cache } from '@server/game-server';
import { logger } from '@runejs/logger';
import _ from 'lodash';
import { wrapText } from '@server/util/strings';
import { ActionsCancelledWarning, WidgetsClosedWarning } from '@server/error-handling';

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
const textWidgetIds = [ 210, 211, 212, 213, 214 ];

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

interface NpcParticipant {
    npc: Npc | number;
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
            // Text-only dialogue.

            const text: string = dialogueAction();
            const lines = wrapDialogueText(text, 'TEXT');
            parsedDialogueTree.push({ lines, tag, type: 'TEXT' } as TextDialogueAction);
        } else if(dialogueType === 'subtree') {
            // Dialogue sub-tree.

            const subTree: DialogueTree = dialogueAction();
            parsedDialogueTree.push({ tag, type: 'SUBTREE', subTree, npcParticipants } as SubDialogueTreeAction);
        } else {
            // Player or Npc dialogue.

            let dialogueDetails: [ Emote, string ];
            let npc: Npc | number;

            if(dialogueType !== 'player') {
                const participant = npcParticipants.find(p => p.key === dialogueType) as NpcParticipant;
                if(!participant || !participant.npc) {
                    logger.error('No matching npc found for npc dialogue action.');
                    continue;
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

async function runParsedDialogue(player: Player, dialogueTree: ParsedDialogueTree, tag?: string): Promise<boolean> {
    let stopLoop = false;

    for(let i = 0; i < dialogueTree.length; i++) {
        if(stopLoop) {
            throw new ActionsCancelledWarning();
        }

        const sub: Subscription[] = [];

        await new Promise((resolve, reject) => {
            let dialogueAction = dialogueTree[i];

            if(dialogueAction instanceof DialogueFunction && !tag) {
                // Code execution dialogue.
                dialogueAction.execute();
                resolve();
                return;
            }

            dialogueAction = dialogueAction as DialogueAction;

            if(dialogueAction.type === 'GOTO' && !tag) {
                // Goto dialogue.
                const goToAction = (dialogueAction as GoToAction);
                if(typeof goToAction.to === 'function') {
                    const goto: string = goToAction.to();
                    runParsedDialogue(player, player.metadata.dialogueTree, goto).then(() => resolve());
                } else {
                    runParsedDialogue(player, player.metadata.dialogueTree, goToAction.to).then(() => resolve());
                }
                return;
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

                    sub.push(player.dialogueInteractionEvent.subscribe(choice => {
                        sub.forEach(s => s.unsubscribe());
                        const tree: ParsedDialogueTree = trees[choice - 1];
                        if(!tree || tree.length === 0) {
                            resolve();
                        } else {
                            runParsedDialogue(player, tree, tag).then(() => resolve());
                        }
                    }));
                } else if(tag !== undefined) {
                    for(let i = 0; i < options.length; i++) {
                        const tree = trees[i];
                        const didRun = runParsedDialogue(player, tree, tag);
                        if(didRun) {
                            resolve();
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

                    widgetId = textWidgetIds[lines.length - 1];

                    for(let i = 0; i < lines.length; i++) {
                        player.outgoingPackets.updateWidgetString(widgetId, i, lines[i]);
                    }
                } else if(tag !== undefined) {
                    resolve();
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
                    runParsedDialogue(player, parsedSubTree).then(() => {
                        player.metadata.dialogueIndices = originalIndices;
                        player.metadata.dialogueTree = originalTree;
                        resolve();
                    });
                } else if(tag && dialogueAction.tag !== tag) {
                    const originalIndices = _.cloneDeep(player.metadata.dialogueIndices || {});
                    const originalTree = _.cloneDeep(player.metadata.dialogueTree || []);
                    player.metadata.dialogueIndices = {};
                    const parsedSubTree = parseDialogueTree(player, action.npcParticipants, action.subTree);
                    player.metadata.dialogueTree = parsedSubTree;
                    runParsedDialogue(player, parsedSubTree, tag).then(() => {
                        player.metadata.dialogueIndices = originalIndices;
                        player.metadata.dialogueTree = originalTree;
                        resolve();
                    });
                } else {
                    resolve();
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
                        player.outgoingPackets.updateWidgetString(widgetId, 1, cache.npcDefinitions.get(npcId as number).name);
                    } else {
                        widgetId = playerWidgetIds[lines.length - 1];
                        player.outgoingPackets.setWidgetPlayerHead(widgetId, 0);
                        player.outgoingPackets.updateWidgetString(widgetId, 1, player.username);
                    }

                    player.outgoingPackets.playWidgetAnimation(widgetId, 0, animation);

                    for(let i = 0; i < lines.length; i++) {
                        player.outgoingPackets.updateWidgetString(widgetId, 2 + i, lines[i]);
                    }
                } else if(tag !== undefined) {
                    resolve();
                }
            }

            if(tag === undefined && widgetId) {
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
                    forceClosed: () => reject(new WidgetsClosedWarning())
                };
            }
        }).then(() => {
            sub.forEach(s => s.unsubscribe());
        }).catch(error => {
            sub.forEach(s => s.unsubscribe());
            stopLoop = true;

            if(!(error instanceof ActionsCancelledWarning) && !(error instanceof WidgetsClosedWarning)) {
                throw error;
            }
        });
    }

    return tag === undefined;
}

export async function dialogue(participants: (Player | NpcParticipant)[], dialogueTree: DialogueTree): Promise<void> {
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
    await runParsedDialogue(player, parsedDialogueTree);
}
