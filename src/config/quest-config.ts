import { Player } from '@server/world/actor/player/player';
import { Npc } from '@server/world/actor/npc/npc';
import { npcAction } from '@server/world/action/npc-action';
import { logger } from '@runejs/core';
import { handleTutorial } from '@server/plugins/quests/goblin-diplomacy-tutorial/goblin-diplomacy';


export type QuestKey = number | 'complete';

export type QuestStageHandler = {
    [key in QuestKey]?: (player: Player) => void | Promise<void>;
};

export type QuestDialogueHandler = {
    [key in QuestKey]?: (player: Player, npc: Npc) => void | Promise<void>;
};

export type QuestJournalHandler = {
    [key in QuestKey]?: ((player: Player) => Promise<string>) | ((player: Player) => string) | string;
};

export interface QuestCompletion {
    questCompleteWidget: {
        rewardText?: string[];
        modelId?: number;
        itemId?: number;
        modelRotationX?: number;
        modelRotationY?: number;
        modelZoom?: number;
    };
    giveRewards?: ((player?: Player) => void) | ((player?: Player) => Promise<void>);
}

export class PlayerQuest {

    public readonly questId: string;
    public progress: QuestKey = 0;
    public complete: boolean = false;
    public readonly metadata: { [key: string]: any } = {};

    public constructor(questId: string) {
        this.questId = questId;
    }

}

export function questDialogueActionFactory(questId: string, npcDialogueHandler: QuestDialogueHandler): npcAction {
    return async({ player, npc }) => {
        const quest = player.getQuest(questId);
        if(!quest) {
            return;
        }

        const progress = quest.progress;
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
