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

export type SkillName = 'attack' | 'defence' | 'strength' | 'hitpoints' | 'ranged' | 'prayer' | 'magic' | 'cooking' |
    'woodcutting' | 'fletching' | 'fishing' | 'firemaking' | 'crafting' | 'smithing' | 'mining' | 'herblore' |
    'agility' | 'thieving' | 'slayer' | 'farming' | 'runecrafting' | 'construction';

export interface SkillDetail {
    readonly name: string;
    readonly advancementWidgetId?: number;
}

export const skillDetails: SkillDetail[] = [
    {name: 'Attack', advancementWidgetId: 158},
    {name: 'Defence', advancementWidgetId: 161},
    {name: 'Strength', advancementWidgetId: 175},
    {name: 'Hitpoints', advancementWidgetId: 167},
    {name: 'Ranged', advancementWidgetId: 171},
    {name: 'Prayer', advancementWidgetId: 170},
    {name: 'Magic', advancementWidgetId: 168},
    {name: 'Cooking', advancementWidgetId: 159},
    {name: 'Woodcutting', advancementWidgetId: 177},
    {name: 'Fletching', advancementWidgetId: 165},
    {name: 'Fishing', advancementWidgetId: 164},
    {name: 'Firemaking', advancementWidgetId: 163},
    {name: 'Crafting', advancementWidgetId: 160},
    {name: 'Smithing', advancementWidgetId: 174},
    {name: 'Mining', advancementWidgetId: 169},
    {name: 'Herblore', advancementWidgetId: 166},
    {name: 'Agility', advancementWidgetId: 157},
    {name: 'Thieving', advancementWidgetId: 176},
    {name: 'Slayer', advancementWidgetId: 173},
    {name: 'Farming', advancementWidgetId: 162},
    {name: 'Runecrafting', advancementWidgetId: 172},
    null,
    {name: 'Construction'}
];

export interface SkillValue {
    exp: number;
    level: number;
    modifiedLevel?: number;
}

export class SkillShortcut {

    public constructor(private skills: Skills, private skillName: SkillName) {
    }

    public addExp(exp: number): void {
        this.skills.addExp(this.skillName, exp);
    }

    public get level(): number {
        return this.skills.getLevel(this.skillName);
    }

    public get exp(): number {
        return this.skills.get(this.skillName).exp;
    }

    public get levelForExp(): number {
        return this.skills.getLevelForExp(this.exp);
    }

}

type SkillShortcutMap = {
    [skillName in SkillName]: SkillShortcut;
};

class SkillShortcuts implements SkillShortcutMap {
    agility: SkillShortcut;
    attack: SkillShortcut;
    construction: SkillShortcut;
    cooking: SkillShortcut;
    crafting: SkillShortcut;
    defence: SkillShortcut;
    farming: SkillShortcut;
    firemaking: SkillShortcut;
    fishing: SkillShortcut;
    fletching: SkillShortcut;
    herblore: SkillShortcut;
    hitpoints: SkillShortcut;
    magic: SkillShortcut;
    mining: SkillShortcut;
    prayer: SkillShortcut;
    ranged: SkillShortcut;
    runecrafting: SkillShortcut;
    slayer: SkillShortcut;
    smithing: SkillShortcut;
    strength: SkillShortcut;
    thieving: SkillShortcut;
    woodcutting: SkillShortcut;
}

export class Skills extends SkillShortcuts {

    private _values: SkillValue[];

    public constructor(private actor: Actor, values?: SkillValue[]) {
        super();

        Object.keys(Skill)
            .map(skillName => skillName.toLowerCase())
            .forEach(skillName =>
                this[skillName] = new SkillShortcut(this, skillName as SkillName)
            );

        if (values) {
            this._values = values;
        } else {
            this._values = this.defaultValues();
        }
    }

    public getLevel(skill: number | SkillName, ignoreLevelModifications: boolean = false): number {
        const s = this.get(skill);
        return (s.modifiedLevel !== undefined && !ignoreLevelModifications ? s.modifiedLevel : s.level);
    }

    public hasLevel(skill: number | SkillName, level: number, ignoreLevelModifications: boolean = false): boolean {
        return this.getLevel(skill, ignoreLevelModifications) >= level;
    }

    public getLevelForExp(exp: number): number {
        let points = 0;
        let output = 0;

        for (let i = 1; i <= 99; i++) {
            points += Math.floor(i + 300 * Math.pow(2, i / 7));
            output = Math.floor(points / 4);
            if (output >= exp) {
                return i;
            }
        }

        return 99;
    }

    public addExp(skill: number | SkillName, exp: number): void {
        const currentExp = this.get(skill).exp;
        const currentLevel = this.getLevelForExp(currentExp);
        let finalExp = currentExp + (exp * serverConfig.expRate);
        if (finalExp > 200000000) {
            finalExp = 200000000;
        }

        const finalLevel = this.getLevelForExp(finalExp);

        this.setExp(skill, finalExp);

        if (this.actor instanceof Player) {
            this.actor.outgoingPackets.updateSkill(this.getSkillId(skill), finalLevel, finalExp);
        }

        if (currentLevel !== finalLevel) {
            this.setLevel(skill, finalLevel);

            if (this.actor instanceof Player) {
                const achievementDetails = skillDetails[this.getSkillId(skill)];
                if (!achievementDetails) {
                    return;
                }

                this.actor.sendMessage(`Congratulations, you just advanced a ` +
                    `${achievementDetails.name.toLowerCase()} level.`);
                this.showLevelUpDialogue(skill, finalLevel);
            }
        }
    }

    public showLevelUpDialogue(skill: number | SkillName, level: number): void {
        if (!(this.actor instanceof Player)) {
            return;
        }

        const player = this.actor as Player;
        const achievementDetails = skillDetails[this.getSkillId(skill)];
        const widgetId = achievementDetails.advancementWidgetId;

        if (!widgetId) {
            return;
        }

        const skillName = achievementDetails.name.toLowerCase();

        player.queueWidget({
            widgetId,
            type: 'CHAT',
            closeOnWalk: true,
            beforeOpened: () => {
                player.modifyWidget(widgetId, {
                    childId: 0,
                    text: `<col=000080>Congratulations, you just advanced ${startsWithVowel(skillName) ? 'an' : 'a'} ` +
                        `${skillName} level.</col>`
                });
                player.modifyWidget(widgetId, {
                    childId: 1,
                    text: `Your ${skillName} level is now ${level}.`
                });
            },
            afterOpened: () => {
                player.playGraphics({id: gfxIds.levelUpFireworks, delay: 0, height: 125});
                // @TODO sounds
            }
        });
    }

    public getSkillId(skill: number | SkillName): number {
        if (typeof skill === 'number') {
            return skill;
        } else {
            const skillName = skill.toString().toUpperCase();
            return Skill[skillName].valueOf();
        }
    }

    public get(skill: number | SkillName): SkillValue {
        if (typeof skill === 'number') {
            return this._values[skill];
        } else {
            const skillName = skill.toString().toUpperCase();
            return this._values[Skill[skillName].valueOf()];
        }
    }

    private defaultValues(): SkillValue[] {
        const values: SkillValue[] = [];
        skillDetails.forEach(s => values.push({exp: 0, level: 1}));
        values[Skill.HITPOINTS] = {exp: 1154, level: 10};
        return values;
    }

    private setExp(skill: number | SkillName, exp: number): void {
        const skillId = this.getSkillId(skill);
        this._values[skillId].exp = exp;
    }

    private setLevel(skill: number | SkillName, level: number): void {
        const skillId = this.getSkillId(skill);
        this._values[skillId].level = level;
    }

    public get values(): SkillValue[] {
        return this._values;
    }

    public set values(value: SkillValue[]) {
        this._values = value;
    }
}
