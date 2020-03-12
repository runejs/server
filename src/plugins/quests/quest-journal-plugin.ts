import { buttonAction } from '@server/world/actor/player/action/button-action';
import { ActionType, RunePlugin } from '@server/plugins/plugin';
import { widgets } from '@server/world/config/widget';
import { quests } from '@server/world/config/quests';
import { wrapText } from '@server/util/strings';

export const action: buttonAction = (details) => {
    const { player, buttonId } = details;

    const questData = quests[Object.keys(quests).filter(questKey => quests[questKey].questTabId === buttonId)[0]];
    const playerQuest = player.quests.find(quest => quest.questId === questData.id);
    let playerStage = 'NOT_STARTED';

    if(playerQuest && playerQuest.stage) {
        playerStage = playerQuest.stage;
    }

    let stageText = questData.stages[playerStage];
    let color = 128;

    if(typeof stageText === 'function') {
        stageText = stageText(player);
    } else if(typeof stageText !== 'string' && typeof stageText === 'object') {
        color = stageText.color;
        stageText = stageText.text;
    }

    let lines;
    if(stageText) {
        lines = wrapText(stageText as string, 395);
    } else {
        lines = [ 'Invalid Quest Stage' ];
    }

    player.modifyWidget(widgets.questJournal, { childId: 2, text: '@dre@' + questData.name });

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

    player.activeWidget = {
        widgetId: widgets.questJournal,
        type: 'SCREEN',
        closeOnWalk: true
    };
};

export default new RunePlugin({ type: ActionType.BUTTON, widgetId: widgets.questTab, action });
