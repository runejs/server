export interface QuestData {
    id: number;
    questTabId: number;
    name: string;
    stages: { [key: string]: Function | string };
}

// @TODO quest requirements
export const quests: { [key: string]: QuestData } = {
    cooksAssistant: {
        id: 0,
        questTabId: 27,
        name: `Cook's Assistant`,
        stages: {
            NOT_STARTED: `I can start this quest by speaking to the <col=800000>Cook</col> in the<br>` +
                `<col=800000>Kitchen</col> on the ground floor of <col=800000>Lumbridge Castle</col>.`,
            COLLECTING: (attr) => `collecting stuff`,
            COMPLETE: `completed`
        }
    }
};
