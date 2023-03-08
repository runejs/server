import { loadConfigurationFiles } from '@runejs/common/fs';
import { itemMap, ItemDetails } from '@engine/config';


/**
 * Skill Guide Configuration
 */
export interface SkillGuide {
    id: number;
    name: string;
    members: boolean;
    sub_guides: SkillSubGuide[];
}

/**
 * Skill Sub Guide Configuration
 */
export interface SkillSubGuide {
    name: string;
    lines: {
        item: ItemDetails | undefined;
        text: string;
        level: number;
    }[];
}

/**
 * Loads the skill guides from the new json format.
 * @param path
 * @return SkillGuideConfiguration[]
 */
export async function loadSkillGuideConfigurations(path: string): Promise<SkillGuide[]> {
    const skillGuides: SkillGuide[] = [];

    const files = await loadConfigurationFiles(path);
    files.forEach((skillGuide) => {
        if(!skillGuide?.sub_guides) {
            return;
        }

        const subGuides: SkillSubGuide[] = [];
        skillGuide.sub_guides.forEach((subGuide) => {
            const subGuideLines: SkillSubGuide['lines'] = [];
            subGuide.lines.forEach((line) => {
                subGuideLines.push({
                    item: itemMap[line.item],
                    text: line.text,
                    level: line.level
                });
            });
            subGuides.push({
                name: subGuide.name,
                lines: subGuideLines
            });
        });
        skillGuides.push({
            id: skillGuide.id,
            name: skillGuide.name,
            members: skillGuide.members,
            sub_guides: subGuides,
        });
    });

    return skillGuides;
}
