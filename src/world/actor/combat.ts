import * as combatStylesImport from '../../../data/config/combat-styles.json';
import { SkillName } from '@server/world/actor/skills';

export interface CombatStyles {
    [key: string]: CombatStyle[];
}

export interface CombatStyle {
    type: 'slash' | 'stab' | 'crush';
    exp: SkillName | SkillName[];
    anim: string | string[];
    button_id: number;
}

export const combatStyles: CombatStyles = combatStylesImport as CombatStyles;
