import { buttonAction } from '@server/world/mob/player/action/button-action';
import { logger } from '@runejs/logger/dist/logger';
import { JSON_SCHEMA, safeLoad } from 'js-yaml';
import { readFileSync } from 'fs';
import { ActionType, RunePlugin } from '@server/plugins/plugin';

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

const sidebarTextIds = [8846,8823,8824,8827,8837,8840,8843,8859,8862,8865,15303,15306,15309];
const sidebarIds = [8844,8813,-1,8825,8828,8838,8841,8850,8860,8863,15294,15304,15307];
const buttonIds = guides.map(g => g.id).concat(sidebarTextIds);

export const action: buttonAction = (details) => {
    let { player, buttonId } = details;
    let guide: SkillGuide = guides.find(g => g.id === buttonId);
    let subGuideIndex = 0;
    let refreshSidebar = true;

    if(!guide) {
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
    }

    if(refreshSidebar) {
        // player.packetSender.updateWidgetString(sidebarTextIds[0], guide.subGuides[0].name);

        for(let i = 1; i < sidebarTextIds.length; i++) {
            const sidebarId = sidebarIds[i];
            let hide: boolean = true;

            if(i >= guide.subGuides.length) {
                // player.packetSender.updateWidgetString(sidebarTextIds[i], '');
                hide = true;
            } else {
                // player.packetSender.updateWidgetString(sidebarTextIds[i], guide.subGuides[i].name);
                hide = false;
            }

            if(sidebarId !== -1) {
                // Apparently you can never have only TWO subguides...
                // Because 8813 deletes both options 2 AND 3. So, good thing there are no guides with only 2 sections, I guess?...
                // Verified this in an interface editor, and they are indeed grouped in a single layer for some reason...
                player.packetSender.toggleWidgetVisibility(sidebarIds[i] as number, hide);
            }
        }
    }

    const subGuide: SkillSubGuide = guide.subGuides[subGuideIndex];

    const itemIds: number[] = subGuide.lines.map(g => g.itemId).concat(new Array(30 - subGuide.lines.length).fill(null));
    player.packetSender.sendUpdateAllWidgetItemsById({ widgetId: 8847, containerId: 0 }, itemIds);

    // player.packetSender.updateWidgetString(8716, guide.name + ' Guide');
    // player.packetSender.updateWidgetString(8849, subGuide.name);

    for(let i = 0; i < 30; i++) {
        if(subGuide.lines.length <= i) {
            // player.packetSender.updateWidgetString(8720 + i, '');
            // player.packetSender.updateWidgetString(8760 + i, '');
        } else {
            // player.packetSender.updateWidgetString(8720 + i, subGuide.lines[i].level.toString());
            // player.packetSender.updateWidgetString(8760 + i, subGuide.lines[i].text);
        }
    }

    player.activeWidget = {
        widgetId: 8714,
        type: 'SCREEN',
        closeOnWalk: false
    };
    player.metadata['activeSkillGuide'] = buttonId;
};

export default new RunePlugin({ type: ActionType.BUTTON, buttonIds, action });
