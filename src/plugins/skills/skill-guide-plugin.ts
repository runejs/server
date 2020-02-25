import { buttonAction } from '@server/world/mob/player/action/button-action';
import { logger } from '@runejs/logger/dist/logger';
import { JSON_SCHEMA, safeLoad } from 'js-yaml';
import { readFileSync } from 'fs';
import { ActionType, RunePlugin } from '@server/plugins/plugin';
import { Player } from '@server/world/mob/player/player';
import { widgetAction } from '@server/world/mob/player/action/widget-action';

// @TODO fix me!

interface SkillSubGuide {
    name: string;
    lines: {
        itemId: number;
        text: string;
        level: number;
    }[];
}

interface SkillGuide {
    id: number;
    name: string;
    members: boolean;
    subGuides: SkillSubGuide[];
}

function parseSkillGuides(): SkillGuide[] {
    try {
        logger.info('Parsing skill guides...');

        const skillGuides = safeLoad(readFileSync('data/config/skill-guides.yaml', 'utf8'), { schema: JSON_SCHEMA }) as SkillGuide[];

        if(!skillGuides || skillGuides.length === 0) {
            throw 'Unable to read skill guides.';
        }

        logger.info(`${skillGuides.length} skill guides found.`);

        return skillGuides;
    } catch(error) {
        logger.error('Error parsing skill guides: ' + error);
        return null;
    }
}

const guides = parseSkillGuides();

const sidebarTextIds = [131,108,109,112,122,125,128,143,146,149,159,162,165];
const sidebarIds = [129,98,-1,110,113,123,126,134,144,147,150,160,163];
const buttonIds = guides.map(g => g.id);

function loadGuide(player: Player, guideId: number, subGuideId: number = 0, refreshSidebar: boolean = true): void {
    let guide: SkillGuide = guides.find(g => g.id === guideId);

    /*if(!refreshSidebar) {
        const activeSkillGuide = player.metadata['activeSkillGuide'];
        if(!activeSkillGuide) {
            return;
        }

        guide = guides.find(g => g.id === activeSkillGuide);
        subGuideIndex = sidebarTextIds.indexOf(buttonId);

        if(subGuideIndex >= guide.subGuides.length) {
            return;
        }

        buttonId = activeSkillGuide;
        refreshSidebar = false;
    }*/

    if(refreshSidebar) {
        player.packetSender.updateWidgetString(308, 133, guide.members ? 'Members only skill' : '');

        for(let i = 0; i < sidebarTextIds.length; i++) {
            const sidebarId = sidebarIds[i];
            let hide: boolean = true;

            if(i >= guide.subGuides.length) {
                player.packetSender.updateWidgetString(308, sidebarTextIds[i], '');
                hide = true;
            } else {
                player.packetSender.updateWidgetString(308, sidebarTextIds[i], guide.subGuides[i].name);
                hide = false;
            }

            if(sidebarId !== -1) {
                // Apparently you can never have only TWO subguides...
                // Because childId 98 deletes both options 2 AND 3. So, good thing there are no guides with only 2 sections, I guess?...
                // Verified this in an interface editor, and they are indeed grouped in a single layer for some reason...
                player.packetSender.toggleWidgetVisibility(308, sidebarIds[i], hide);
            }
        }
    }

    const subGuide: SkillSubGuide = guide.subGuides[subGuideId];

    player.packetSender.updateWidgetString(308, 1, guide.name + ' - ' + subGuide.name);

    const itemIds: number[] = subGuide.lines.map(g => g.itemId).concat(new Array(30 - subGuide.lines.length).fill(null));
    player.packetSender.sendUpdateAllWidgetItemsById({ widgetId: 308, containerId: 132 }, itemIds);

    for(let i = 0; i < 30; i++) {
        if(subGuide.lines.length <= i) {
            player.packetSender.updateWidgetString(308, 5 + i, '');
            player.packetSender.updateWidgetString(308, 45 + i, '');
        } else {
            player.packetSender.updateWidgetString(308, 5 + i, subGuide.lines[i].level.toString());
            player.packetSender.updateWidgetString(308, 45 + i, subGuide.lines[i].text);
        }
    }

    player.activeWidget = {
        widgetId: 308,
        type: 'SCREEN',
        closeOnWalk: false
    };
    player.metadata['activeSkillGuide'] = guideId;
}

export const openGuideAction: buttonAction = (details) => {
    const { player, buttonId } = details;
    loadGuide(player, buttonId);
};

export const openSubGuideAction: widgetAction = (details) => {
    const { player, childId } = details;

    const activeSkillGuide = player.metadata['activeSkillGuide'];

    if(!activeSkillGuide) {
        return;
    }

    const guide = guides.find(g => g.id === activeSkillGuide);
    const subGuideId = sidebarTextIds.indexOf(childId);

    if(subGuideId >= guide.subGuides.length) {
        return;
    }

    loadGuide(player, guide.id, subGuideId, false);
};

export default new RunePlugin([
    { type: ActionType.BUTTON, widgetId: 320, buttonIds, action: openGuideAction },
    { type: ActionType.WIDGET_ACTION, widgetIds: 308, childIds: sidebarTextIds, optionId: 0, action: openSubGuideAction }
]);
