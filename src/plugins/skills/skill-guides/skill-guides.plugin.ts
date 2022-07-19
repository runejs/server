import {
    buttonActionHandler,
    ButtonActionHook,
    widgetInteractionActionHandler,
    WidgetInteractionActionHook
} from '@engine/action';
import { Player } from '@engine/world/actor';
import { widgets } from '@engine/config';
import { SkillGuide, SkillSubGuide, loadSkillGuideConfigurations } from './skill-guide-config';


const skillGuidePath = __dirname.replace(/dist/, 'src');
const sidebarTextIds = [131, 108, 109, 112, 122, 125, 128, 143, 146, 149, 159, 162, 165];
const sidebarIds = [129, 98, -1, 110, 113, 123, 126, 134, 144, 147, 150, 160, 163];
let guides: SkillGuide[] = [];

function loadGuide(player: Player, guideId: number, subGuideId: number = 0, refreshSidebar: boolean = true): void {
    const guide: SkillGuide = guides.find(g => g.id === guideId);

    if(refreshSidebar) {
        player.modifyWidget(widgets.skillGuide, { childId: 133, text: (guide.members ? 'Members only skill' : '') });

        for(let i = 0; i < sidebarTextIds.length; i++) {
            const sidebarId = sidebarIds[i];
            let hidden: boolean = true;

            if(i >= guide.sub_guides.length) {
                player.modifyWidget(widgets.skillGuide, { childId: sidebarTextIds[i], text: '' });
                hidden = true;
            } else {
                player.modifyWidget(widgets.skillGuide, { childId: sidebarTextIds[i], text: guide.sub_guides[i].name });
                hidden = false;
            }

            if(sidebarId !== -1) {
                // Apparently you can never have only TWO subguides...
                // Because childId 98 deletes both options 2 AND 3. So, good thing there are no guides with only 2 sections, I guess?...
                // Verified this in an interface editor, and they are indeed grouped in a single layer for some reason...
                player.modifyWidget(widgets.skillGuide, { childId: sidebarIds[i], hidden });
            }
        }
    }

    const subGuide: SkillSubGuide = guide.sub_guides[subGuideId];

    player.modifyWidget(widgets.skillGuide, { childId: 1, text: (guide.name + ' - ' + subGuide.name) });

    const itemIds: number[] = subGuide.lines.map(g => (g.item?.gameId || 0)).concat(new Array(30 - subGuide.lines.length).fill(null));
    player.outgoingPackets.sendUpdateAllWidgetItemsById({ widgetId: widgets.skillGuide, containerId: 132 }, itemIds);

    for(let i = 0; i < 30; i++) {
        if(subGuide.lines.length <= i) {
            player.modifyWidget(widgets.skillGuide, { childId: 5 + i, text: '' });
            player.modifyWidget(widgets.skillGuide, { childId: 45 + i, text: '' });
        } else {
            player.modifyWidget(widgets.skillGuide, { childId: 5 + i, text: subGuide.lines[i].level.toString() });
            player.modifyWidget(widgets.skillGuide, { childId: 45 + i, text: subGuide.lines[i].text });
        }
    }

    player.interfaceState.openWidget(widgets.skillGuide, {
        slot: 'screen',
        multi: false
    });
    player.metadata['activeSkillGuide'] = guideId;
}

export const guideHandler: buttonActionHandler = async (details) => {
    const { player, buttonId } = details;

    if(!guides.length) {
        guides = await loadSkillGuideConfigurations(skillGuidePath);
    }

    loadGuide(player, buttonId);
};

export const subGuideHandler: widgetInteractionActionHandler = async (details) => {
    const { player, childId } = details;

    if(!guides.length) {
        guides = await loadSkillGuideConfigurations(skillGuidePath);
    }

    const activeSkillGuide = player.metadata['activeSkillGuide'];

    if(!activeSkillGuide) {
        return;
    }

    const guide = guides.find(g => g.id === activeSkillGuide);
    const subGuideId = sidebarTextIds.indexOf(childId);

    if(subGuideId >= guide.sub_guides.length) {
        return;
    }

    loadGuide(player, guide.id, subGuideId, true);
};

export default {
    pluginId: 'rs:skill_guides',
    hooks: [
        {
            type: 'button',
            widgetId: widgets.skillsTab,
            handler: guideHandler
        } as ButtonActionHook,
        {
            type: 'widget_interaction',
            widgetIds: widgets.skillGuide,
            optionId: 0,
            handler: subGuideHandler
        } as WidgetInteractionActionHook
    ]
};
