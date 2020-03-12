import { ActionPlugin } from '@server/plugins/plugin';

export interface Quest {
    id: string;
    questTabId: number;
    name: string;
    points: number;
    stages: { [key: string]: Function | string | { color: number, text: string } };
    completion: {
        rewards: string[];
        onComplete: Function;
        modelId?: number;
        itemId?: number;
        modelRotationX?: number;
        modelRotationY?: number;
        modelZoom?: number;
    }
}

export interface QuestPlugin extends ActionPlugin {
    quest: Quest;
}

// @TODO quest requirements
export let quests: { [key: string]: Quest };

export function setQuestPlugins(questPlugins: ActionPlugin[]): void {
    quests = {};

    for(const plugin of questPlugins as QuestPlugin[]) {
        quests[plugin.quest.id] = plugin.quest;
    }
}
