import { buttonAction } from '@server/world/actor/player/action/button-action';
import { logger } from '@runejs/logger/dist/logger';
import { JSON_SCHEMA, safeLoad } from 'js-yaml';
import { readFileSync } from 'fs';
import { ActionType, RunePlugin } from '@server/plugins/plugin';
import { Player } from '@server/world/actor/player/player';
import { widgetAction } from '@server/world/actor/player/action/widget-action';
import { widgets } from '@server/world/config/widget';

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

    if(refreshSidebar) {
        player.outgoingPackets.updateWidgetString(widgets.skillGuide, 133, guide.members ? 'Members only skill' : '');

        for(let i = 0; i < sidebarTextIds.length; i++) {
            const sidebarId = sidebarIds[i];
            let hide: boolean = true;

            if(i >= guide.subGuides.length) {
                player.outgoingPackets.updateWidgetString(widgets.skillGuide, sidebarTextIds[i], '');
                hide = true;
            } else {
                player.outgoingPackets.updateWidgetString(widgets.skillGuide, sidebarTextIds[i], guide.subGuides[i].name);
                hide = false;
            }

            if(sidebarId !== -1) {
                // Apparently you can never have only TWO subguides...
                // Because childId 98 deletes both options 2 AND 3. So, good thing there are no guides with only 2 sections, I guess?...
                // Verified this in an interface editor, and they are indeed grouped in a single layer for some reason...
                player.outgoingPackets.toggleWidgetVisibility(widgets.skillGuide, sidebarIds[i], hide);
            }
        }
    }

    const subGuide: SkillSubGuide = guide.subGuides[subGuideId];

    player.outgoingPackets.updateWidgetString(widgets.skillGuide, 1, guide.name + ' - ' + subGuide.name);

    const itemIds: number[] = subGuide.lines.map(g => g.itemId).concat(new Array(30 - subGuide.lines.length).fill(null));
    player.outgoingPackets.sendUpdateAllWidgetItemsById({ widgetId: widgets.skillGuide, containerId: 132 }, itemIds);

    for(let i = 0; i < 30; i++) {
        if(subGuide.lines.length <= i) {
            player.outgoingPackets.updateWidgetString(widgets.skillGuide, 5 + i, '');
            player.outgoingPackets.updateWidgetString(widgets.skillGuide, 45 + i, '');
        } else {
            player.outgoingPackets.updateWidgetString(widgets.skillGuide, 5 + i, subGuide.lines[i].level.toString());
            player.outgoingPackets.updateWidgetString(widgets.skillGuide, 45 + i, subGuide.lines[i].text);
        }
    }

    player.activeWidget = {
        widgetId: widgets.skillGuide,
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
    { type: ActionType.BUTTON, widgetId: widgets.skillsTab, buttonIds, action: openGuideAction },
    { type: ActionType.WIDGET_ACTION, widgetIds: widgets.skillGuide, childIds: sidebarTextIds, optionId: 0, action: openSubGuideAction }
]);
