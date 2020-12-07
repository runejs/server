import { Player } from '@server/world/actor/player/player';
import { Npc } from '@server/world/actor/npc/npc';
import { npcAction } from '@server/world/action/npc-action';
import { logger } from '@runejs/core';
import { handleTutorial } from '@server/plugins/quests/goblin-diplomacy-tutorial';
import { Action } from '@server/world/action';

export type QuestStageHandler = { [key: number]: (player: Player) => void };

export type QuestDialogueHandler = { [key: number]: (player: Player, npc: Npc) => void };

export type QuestJournalHandler = { [key: number]: ((player: Player) => string) | string };

export class Quest implements Action {

    public readonly id: string;
    public readonly questTabId: number;
    public readonly name: string;
    public readonly points: number;
    public readonly type = 'quest';
    public readonly journalHandler: QuestJournalHandler;

    public constructor(options: {
        id: string,
        questTabId: number,
        name: string,
        points: number,
        journalHandler: QuestJournalHandler
    }) {
        this.id = options.id;
        this.questTabId = options.questTabId;
        this.name = options.name;
        this.points = options.points;
        this.journalHandler = options.journalHandler;
    }

}

export class PlayerQuest {

    public readonly questId: string;
    public progress: number = 0;
    public complete: boolean = false;

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
