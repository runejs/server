import { Player } from '@server/world/actor/player/player';
import { Skill } from '@server/world/actor/skills';

export interface QuestData {
    id: number;
    questTabId: number;
    name: string;
    points: number;
    stages: { [key: string]: Function | string };
    completion: { rewards: string[], onComplete: Function, modelId?: number, itemId?: number, modelRotationX?: number, modelRotationY?: number, modelZoom?: number }
}

// @TODO quest requirements & quest points
export const quests: { [key: string]: QuestData } = {
    cooksAssistant: {
        id: 0,
        questTabId: 27,
        name: `Cook's Assistant`,
        points: 1,
        stages: {
            NOT_STARTED: `I can start this quest by speaking to the <col=800000>Cook</col> in the<br>` +
                `<col=800000>Kitchen</col> on the ground floor of <col=800000>Lumbridge Castle</col>.`,
            COLLECTING: (attr) => `collecting stuff`,
            COMPLETE: `completed`
        },
        completion: {
            rewards: [ '300 Cooking XP' ],
            onComplete: (player: Player): void => {
                player.skills.addExp(Skill.COOKING, 300);
            },
            itemId: 1891,
            modelZoom: 240,
            modelRotationX: 180,
            modelRotationY: 180
        }
    }
};
