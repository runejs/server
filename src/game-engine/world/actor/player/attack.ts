//This will be used to pass information required to calulate attack and defense like weapon damage etc

export class Attack {
    damageType: AttackDamageType;
    attackRoll: number =0;
    defenseRoll: number = 0;
    hitChance: number =0;
    damage: number =0;
    maximumHit: number;
}

export enum AttackDamageType {
    Stab,
    Slash,
    Crush,
    Magic,
    Range,
    None
}