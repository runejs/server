import { Player } from '@server/world/actor/player/player';
import { Npc } from '@server/world/actor/npc/npc';
import { npcAction } from '@server/world/action/npc-action';
import { logger } from '@runejs/core';
import { handleTutorial } from '@server/plugins/quests/goblin-diplomacy-tutorial';
import { Action } from '@server/world/action';

type QuestJournalKey = number | 'complete';

export type QuestStageHandler = { [key: number]: (player: Player) => void };

export type QuestDialogueHandler = { [key: number]: (player: Player, npc: Npc) => void };

export type QuestJournalHandler = {
    [key in QuestJournalKey]: ((player: Player) => Promise<string>) | ((player: Player) => string) | string;
};

export interface QuestCompletion {
    rewards?: string[];
    onComplete?: ((player?: Player) => void) | ((player?: Player) => Promise<void>);
    modelId?: number;
    itemId?: number;
    modelRotationX?: number;
    modelRotationY?: number;
    modelZoom?: number;
}

export class Quest implements Action {

    public readonly id: string;
    public readonly questTabId: number;
    public readonly name: string;
    public readonly points: number;
    public readonly type = 'quest';
    public readonly journalHandler: QuestJournalHandler;
    public readonly completion;

    public constructor(options: {
        id: string;
        questTabId: number;
        name: string;
        points: number;
        journalHandler: QuestJournalHandler;
        completion: QuestCompletion;
    }) {
        this.id = options.id;
        this.questTabId = options.questTabId;
        this.name = options.name;
        this.points = options.points;
        this.journalHandler = options.journalHandler;
        this.completion = options.completion;
    }

}

export class PlayerQuest {

    public readonly questId: string;
    public progress: number = 0;
    public complete: boolean = false;
    public readonly metadata: { [key: string]: any } = {};

    public constructor(questId: string) {
        this.questId = questId;
    }

}

export function questDialogueActionFactory(npcDialogueHandler: QuestDialogueHandler): npcAction {
    return async({ player, npc }) => {
        const progress = player.savedMetadata.tutorialProgress;
        const dialogueHandler = npcDialogueHandler[progress];
        if(dialogueHandler) {
            try {
                await dialogueHandler(player, npc);
            } catch(e) {
                logger.error(e);
            }

            await handleTutorial(player);
        }
    };
}
