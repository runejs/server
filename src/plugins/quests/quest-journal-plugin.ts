import { buttonAction } from '@server/world/action/button-action';
import { wrapText } from '@server/util/strings';
import { pluginActions } from '@server/game-server';
import { widgets } from '@server/config';
import { Quest } from '@server/world/actor/player/quest';


export const action: buttonAction = async ({ player, buttonId }) => {
    const [ quest ] = pluginActions.quest.filter((quest: Quest) => quest.questTabId === buttonId) as Quest[];
    if(!quest) {
        return;
    }

    const [ playerQuest ] = player.quests.filter(
        (playerQuest) => playerQuest.questId === quest.id
    );

    let playerStage = 0;
    if (playerQuest && playerQuest.progress !== undefined) {
        playerStage = playerQuest.progress;
    }

    let journalHandler = quest.journalHandler[playerStage];
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

export default { type: 'button', widgetId: widgets.questTab, action };
