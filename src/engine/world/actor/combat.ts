import type { SkillName } from '@engine/world/actor/skills';
import * as combatStylesImport from '../../../../data/config/combat-styles.json';

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

export type TargetLock = {
    lockId: symbol;
    isValid(): boolean;
};
export function getTargetLock(timeoutMs: number): TargetLock {
    const createdTime = performance.now();
    return {
        lockId: Symbol(),
        isValid: () => {
            const now = performance.now();

            if (now - createdTime < timeoutMs) {
                return true;
            }
            return false;
        },
    };
}
