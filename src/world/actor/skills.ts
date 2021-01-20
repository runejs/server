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
    modifiedLevel?: number;
}

export class SkillShortcut {

    public constructor(private skills: Skills, private skillName: SkillName) {
    }

    public addExp(exp: number): void {
        this.skills.addExp(this.skillName, exp);
    }

    public set level(value: number) {
        this.skills.setLevel(this.skillName, value);
    }

    public get level(): number {
        return this.skills.getLevel(this.skillName);
    }

    public set exp(value: number) {
        this.skills.setExp(this.skillName, value);
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

    private static EXPERIENCE_LOOKUP_TABLE: number[] = [
        0,83,174,276,388,512,650,801,969,1154,1358,1584,1833,2107,2411,2746,3115,3523,
        3973,4470,5018,5624,6291,7028,7842,8740,9730,10824,12031,13363,14833,16456,18247,
        20224,22406,24815,27473,30408,33648,37224,41171,45529,50339,55649,61512,67983,75127,
        83014,91721,101333,111945,123660,136594,150872,166636,184040,203254,224466,247886,
        273742,302288,333804,368599,407015,449428,496254,547953,605032,668051,737627,814445,
        899257,992895,1096278,1210421,1336443,1475581,1629200,1798808,1986068,2192818,2421087,
        2673114,2951373,3258594,3597792,3972294,4385776,4842295,5346332,5902831,6517253,7195629,
        7944614,8771558,9684577,10692629,11805606,13034431
    ];

    private static MAXIMUM_EXPERIENCE: number = 200_000_000;
    private static MINIMUM_LEVEL: number = 0;
    private static MAXIMUM_LEVEL: number = 99;

    private _values: SkillValue[];

    public constructor(private actor: Actor, values?: SkillValue[]) {
        super();

        Object.keys(Skill)
            .map(skillName => skillName.toLowerCase())
            .forEach(skillName =>
                this[skillName] = new SkillShortcut(this, skillName as SkillName)
            );

        if(values) {
            this._values = values;
        } else {
            this._values = this.defaultValues();
        }
    }

    private static confine(value: number, min: number, max: number): number {
        return Math.max(min, Math.min(value, max));
    }

    public setHitpoints(hitpoints: number): void {
        this.setLevel(Skill.HITPOINTS, hitpoints);
    }

    public getTotalLevel(): number {
        return this._values.map(skillValue => skillValue.level)
            .reduce((accumulator, currentValue) => accumulator + currentValue);
    }

    public getCombatLevel(): number {
        const combatLevel = (this.defence.level + this.hitpoints.level + Math.floor(this.prayer.level / 2)) * 0.25;
        const melee = (this.attack.level + this.strength.level) * 0.325;
        const ranger = this.ranged.level * 0.4875;
        const mage = this.magic.level * 0.4875;
        return combatLevel + Math.max(melee, Math.max(ranger, mage));
    }

    public getLevel(skill: number | SkillName, ignoreLevelModifications: boolean = false): number {
        const s = this.get(skill);
        return (s.modifiedLevel !== undefined && !ignoreLevelModifications ? s.modifiedLevel : s.level);
    }

    public hasLevel(skill: number | SkillName, level: number, ignoreLevelModifications: boolean = false): boolean {
        return this.getLevel(skill, ignoreLevelModifications) >= level;
    }

    public getLevelForExp(exp: number, index: number | undefined = undefined): number {
        const start = Skills.confine((index || Skills.EXPERIENCE_LOOKUP_TABLE.length - 1), Skills.MINIMUM_LEVEL, Skills.MAXIMUM_LEVEL);
        for (let level = start; level >= 1; level--) {
            const requirement = Skills.EXPERIENCE_LOOKUP_TABLE[level];
            if (exp > requirement) {
                return level + 1;
            }
        }
        return 1;
    }

    public getExpForLevel(level: number): number {
        const index = Skills.confine(level - 1, Skills.MINIMUM_LEVEL, Skills.MAXIMUM_LEVEL);
        return Skills.EXPERIENCE_LOOKUP_TABLE[index];
    }

    public addExp(skill: number | SkillName, exp: number): void {
        const currentExp = this.get(skill).exp;
        const currentLevel = this.getLevelForExp(currentExp);
        let finalExp = currentExp + (exp * serverConfig.expRate);
        if (finalExp > Skills.MAXIMUM_EXPERIENCE) {
            finalExp = Skills.MAXIMUM_EXPERIENCE;
        }

        const finalLevel = this.getLevelForExp(finalExp);

        this.setExp(skill, finalExp);

        if(this.actor instanceof Player) {
            this.actor.outgoingPackets.updateSkill(this.getSkillId(skill), finalLevel, finalExp);
        }

        if(currentLevel !== finalLevel) {
            this.setLevel(skill, finalLevel);

            if(this.actor instanceof Player) {
                const achievementDetails = skillDetails[this.getSkillId(skill)];
                if(!achievementDetails) {
                    return;
                }

                this.actor.sendMessage(`Congratulations, you just advanced a ` +
                    `${ achievementDetails.name.toLowerCase() } level.`);
                this.showLevelUpDialogue(skill, finalLevel);
            }
        }
    }

    public showLevelUpDialogue(skill: number | SkillName, level: number): void {
        if(!(this.actor instanceof Player)) {
            return;
        }

        const player = this.actor as Player;
        const achievementDetails = skillDetails[this.getSkillId(skill)];
        const widgetId = achievementDetails.advancementWidgetId;

        if(!widgetId) {
            return;
        }

        const skillName = achievementDetails.name.toLowerCase();

        player.modifyWidget(widgetId, {
            childId: 0,
            text: `<col=000080>Congratulations, you just advanced ${ startsWithVowel(skillName) ? 'an' : 'a' } ` +
                `${ skillName } level.</col>`
        });
        player.modifyWidget(widgetId, {
            childId: 1,
            text: `Your ${ skillName } level is now ${ level }.`
        });

        player.interfaceState.openWidget(widgetId, {
            slot: 'chatbox',
            multi: true
        });

        player.playGraphics({ id: gfxIds.levelUpFireworks, delay: 0, height: 125 });
        // @TODO sounds
    }

    public getSkillId(skill: number | SkillName): number {
        if(typeof skill === 'number') {
            return skill;
        } else {
            const skillName = skill.toString().toUpperCase();
            return Skill[skillName].valueOf();
        }
    }

    public get(skill: number | SkillName): SkillValue {
        if(typeof skill === 'number') {
            return this._values[skill];
        } else {
            const skillName = skill.toString().toUpperCase();
            return this._values[Skill[skillName].valueOf()];
        }
    }

    public setExp(skill: number | SkillName, exp: number): void {
        const skillId = this.getSkillId(skill);
        this._values[skillId].exp = exp;
    }

    public setLevel(skill: number | SkillName, level: number): void {
        const skillId = this.getSkillId(skill);
        this._values[skillId].level = level;
    }

    private defaultValues(): SkillValue[] {
        const values: SkillValue[] = [];
        skillDetails.forEach(() => values.push({ exp: 0, level: 1 }));
        values[Skill.HITPOINTS] = { exp: 1154, level: 10 };
        return values;
    }

    public get values(): SkillValue[] {
        return this._values;
    }

    public set values(value: SkillValue[]) {
        this._values = value;
    }
}
