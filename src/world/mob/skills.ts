import { Mob } from '@server/world/mob/mob';
import { Player } from '@server/world/mob/player/player';
import { dialogueAction } from '@server/world/mob/player/action/dialogue-action';

export enum Skill {
    ATTACK,
    DEFENCE,
    STRENGTH,
    HITPOINTS,
    RANGED,
    PRAYER,
    MAGIC,
    COOKING,
    WOODCUTTING,
    FLETCHING,
    FISHING,
    FIREMAKING,
    CRAFTING,
    SMITHING,
    MINING,
    HERBLORE,
    AGILITY,
    THIEVING,
    SLAYER,
    FARMING,
    RUNECRAFTING
}

export interface SkillDetail {
    readonly name: string;
    readonly advancementWidgetId?: number;
}

export const skillDetails: SkillDetail[] = [
    { name: 'Attack' },
    { name: 'Defence' },
    { name: 'Strength' },
    { name: 'Hitpoints' },
    { name: 'Ranged' },
    { name: 'Prayer' },
    { name: 'Magic' },
    { name: 'Cooking' },
    { name: 'Woodcutting', advancementWidgetId: 4272 },
    { name: 'Fletching' },
    { name: 'Fishing' },
    { name: 'Firemaking', advancementWidgetId: 4282 },
    { name: 'Crafting' },
    { name: 'Smithing' },
    { name: 'Mining' },
    { name: 'Herblore' },
    { name: 'Agility' },
    { name: 'Thieving' },
    { name: 'Slayer' },
    { name: 'Farming' },
    { name: 'Runecrafting' }
];

export interface SkillValue {
    exp: number;
    level: number;
}

export class Skills {

    private _values: SkillValue[];

    public constructor(private mob: Mob, values?: SkillValue[]) {
        if(values) {
            this._values = values;
        } else {
            this._values = this.defaultValues();
        }
    }

    private defaultValues(): SkillValue[] {
        const values: SkillValue[] = [];
        skillDetails.forEach(s => values.push({ exp: 0, level: 1 }));
        values[Skill.HITPOINTS] = { exp: 1154, level: 10 };
        return values;
    }

    public hasSkillLevel(skillId: number, level: number): boolean {
        return this.values[skillId].level >= level;
    }

    public getLevelForExp(exp: number): number {
        let points = 0;
        let output = 0;

        for(let i = 1; i <= 99; i++) {
            points += Math.floor(i + 300 * Math.pow(2, i / 7));
            output = Math.floor(points / 4);
            if(output >= exp) {
                return i;
            }
        }

        return 99;
    }

    public addExp(skillId: number, exp: number): void {
        const currentExp = this._values[skillId].exp;
        const currentLevel = this.getLevelForExp(currentExp);
        let finalExp = currentExp + exp;
        if(finalExp > 200000000) {
            finalExp = 200000000;
        }

        const finalLevel = this.getLevelForExp(finalExp);

        this.setExp(skillId, finalExp);

        if(this.mob instanceof Player) {
            this.mob.packetSender.sendSkill(skillId, finalLevel, finalExp);
        }

        if(currentLevel !== finalLevel) {
            this.setLevel(skillId, finalLevel);
            this.mob.playGraphics({ id: 199, delay: 0, height: 125 });

            if(this.mob instanceof Player) {
                const achievementDetails = skillDetails[skillId];
                this.mob.packetSender.chatboxMessage(`Congratulations, you just advanced a ${achievementDetails.name.toLowerCase()} level.`);

                if(achievementDetails.advancementWidgetId) {
                    dialogueAction(this.mob, { type: 'LEVEL_UP', skillId, lines: [
                        `@dbl@Congratulations, you just advanced a ${achievementDetails.name.toLowerCase()} level.`,
                            `Your ${achievementDetails.name.toLowerCase()} level is now ${finalLevel}.` ] }).then(d => d.close());
                    // @TODO sounds
                }
            }
        }
    }

    public setExp(skillId: number, exp: number): void {
        this._values[skillId].exp = exp;
    }

    public setLevel(skillId, level: number): void {
        this._values[skillId].level = level;
    }

    public get values(): SkillValue[] {
        return this._values;
    }

    public set values(value: SkillValue[]) {
        this._values = value;
    }
}
