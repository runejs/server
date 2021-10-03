import { buttonActionHandler } from '@engine/world/action/button.action';
import { wrapText } from '@engine/util/strings';
import { widgets } from '@engine/config/config-handler';
import { Quest } from '@engine/world/actor/player/quest';
import { QuestKey } from '@engine/config/quest-config';
import { questMap } from '@engine/plugins';


export const handler: buttonActionHandler = async ({ player, buttonId }) => {
    const quest = Object.values<Quest>(questMap)
        .find(quest => quest.questTabId === buttonId);
    if(!quest) {
        return;
    }

    const [ playerQuest ] = player.quests.filter(
        (playerQuest) => playerQuest.questId === quest.id
    );

    let playerStage: QuestKey = 0;
    if(playerQuest && playerQuest.progress !== undefined) {
        playerStage = playerQuest.progress;
    }

    const journalHandler = quest.journalHandler[playerStage];
    if(journalHandler === undefined) {
        const questJournalStages = Object.keys(quest.journalHandler);
        let journalEntry;
        for(const stage of questJournalStages) {
            const stageNum = parseInt(stage, 10);
            if(isNaN(stageNum)) {
                continue;
            }

            if(stageNum <= playerStage) {
                journalEntry = stage;
            } else {
                break;
            }
        }
    }

    const color = 128;
    let text: string;

    if(typeof journalHandler === 'function') {
        text = await Promise.resolve(journalHandler(player));
    } else if(typeof journalHandler === 'string') {
        text = journalHandler;
    }

    let lines;
    if(text) {
        lines = wrapText(text as string, 395);
    } else {
        lines = [ 'Invalid Quest Stage' ];
    }

    player.modifyWidget(widgets.questJournal, { childId: 2, text: '@dre@' + quest.name });

    for(let i = 0; i <= 100; i++) {
        if(i === 0) {
            player.modifyWidget(widgets.questJournal, { childId: 3, text: `<col=${color}>${lines[0]}</col>` });
            continue;
        }

        if(lines.length > i) {
            player.modifyWidget(widgets.questJournal, { childId: (i + 4), text: `<col=${color}>${lines[i]}</col>` });
        } else {
            player.modifyWidget(widgets.questJournal, { childId: (i + 4), text: '' });
        }
    }

    player.interfaceState.openWidget(widgets.questJournal, {
        slot: 'screen',
        multi: false
    });
};

export default {
    pluginId: 'rs:quest_journal',
    hooks: [
        { type: 'button', widgetId: widgets.questTab, handler }
    ]
};
