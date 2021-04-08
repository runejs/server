import { buttonActionHandler } from '@engine/world/action/button.action';
import { wrapText } from '@engine/util/strings';
import { filestore, questMap } from '@engine/game-server';
import { widgets } from '@engine/config';
import { Quest } from '@engine/world/actor/player/quest';
import { QuestKey } from '@engine/config/quest-config';
import { ParentWidget, TextWidget } from '@runejs/filestore';


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

    // TODO check osrs for the right default color
    const color = '#000000';
    let text: string;

    if(typeof journalHandler === 'function') {
        text = await Promise.resolve(journalHandler(player));
    } else if(typeof journalHandler === 'string') {
        text = journalHandler;
    }

    // Fetch the quest diary widget
    const widget = (filestore.widgetStore.decodeWidget(275) as ParentWidget).children[3] as TextWidget;
    if (!widget) {
        throw new Error('Error fetching the quest widget!');
    }

    let lines;
    if(text) {
        lines = wrapText(text as string, widget.width, widget.fontId);
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
