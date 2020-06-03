import { Actor } from '@server/world/actor/actor';
import { Player } from '@server/world/actor/player/player';
import { startsWithVowel } from '@server/util/strings';
import { serverConfig } from '@server/game-server';
import { gfxIds } from '@server/world/config/gfx-ids';

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
    RUNECRAFTING,
    CONSTRUCTION = 22
}

export interface SkillDetail {
    readonly name: string;
    readonly advancementWidgetId?: number;
}

export const skillDetails: SkillDetail[] = [
    { name: 'Attack', advancementWidgetId: 158 },
    { name: 'Defence', advancementWidgetId: 161 },
    { name: 'Strength', advancementWidgetId: 175 },
    { name: 'Hitpoints', advancementWidgetId: 167 },
    { name: 'Ranged', advancementWidgetId: 171 },
    { name: 'Prayer', advancementWidgetId: 170 },
    { name: 'Magic', advancementWidgetId: 168 },
    { name: 'Cooking', advancementWidgetId: 159 },
    { name: 'Woodcutting', advancementWidgetId: 177 },
    { name: 'Fletching', advancementWidgetId: 165 },
    { name: 'Fishing', advancementWidgetId: 164 },
    { name: 'Firemaking', advancementWidgetId: 163 },
    { name: 'Crafting', advancementWidgetId: 160 },
    { name: 'Smithing', advancementWidgetId: 174 },
    { name: 'Mining', advancementWidgetId: 169 },
    { name: 'Herblore', advancementWidgetId: 166 },
    { name: 'Agility', advancementWidgetId: 157 },
    { name: 'Thieving', advancementWidgetId: 176 },
    { name: 'Slayer', advancementWidgetId: 173 },
    { name: 'Farming', advancementWidgetId: 162 },
    { name: 'Runecrafting', advancementWidgetId: 172 },
    null,
    { name: 'Construction' }
];

export interface SkillValue {
    exp: number;
    level: number;
}

export class Skills {

    private _values: SkillValue[];

    public constructor(private actor: Actor, values?: SkillValue[]) {
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

    /*
     * @TODO make an additional field for boostedLevel that this reads from
     *   Also add a new method to get the unboostedLevel incase it's ever needed
     *   Then think about some way to reliably and easily fade those boosts out over time
     */
    public getSkillLevel(skillId: number, level: number): number {
        return this.values[skillId].level;
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
        let finalExp = currentExp + (exp * serverConfig.expRate);
        if(finalExp > 200000000) {
            finalExp = 200000000;
        }

        const finalLevel = this.getLevelForExp(finalExp);

        this.setExp(skillId, finalExp);

        if(this.actor instanceof Player) {
            this.actor.outgoingPackets.updateSkill(skillId, finalLevel, finalExp);
        }

        if(currentLevel !== finalLevel) {
            this.setLevel(skillId, finalLevel);

            if(this.actor instanceof Player) {
                const achievementDetails = skillDetails[skillId];
                if(!achievementDetails) {
                    return;
                }

                this.actor.sendMessage(`Congratulations, you just advanced a ${achievementDetails.name.toLowerCase()} level.`);
                this.showLevelUpDialogue(skillId, finalLevel);
            }
        }
    }

    public showLevelUpDialogue(skillId: number, level: number): void {
        if(!(this.actor instanceof Player)) {
            return;
        }

        const player = this.actor as Player;
        const achievementDetails = skillDetails[skillId];
        const widgetId = achievementDetails.advancementWidgetId;

        if(!widgetId) {
            return;
        }

        const skillName = achievementDetails.name.toLowerCase();

        player.queueWidget({
            widgetId,
            type: 'CHAT',
            closeOnWalk: true,
            beforeOpened: () => {
                player.modifyWidget(widgetId, { childId: 0,
                    text: `<col=000080>Congratulations, you just advanced ${startsWithVowel(skillName) ? 'an' : 'a'} ${skillName} level.</col>` });
                player.modifyWidget(widgetId, { childId: 1,
                    text: `Your ${skillName} level is now ${level}.` });
            },
            afterOpened: () => {
                player.playGraphics({ id: gfxIds.levelUpFireworks, delay: 0, height: 125 });
                // @TODO sounds
            }
        });
    }

    public setExp(skillId: number, exp: number): void {
        this._values[skillId].exp = exp;
    }

    public setLevel(skillId: number, level: number): void {
        this._values[skillId].level = level;
    }

    public get values(): SkillValue[] {
        return this._values;
    }

    public set values(value: SkillValue[]) {
        this._values = value;
    }
}
