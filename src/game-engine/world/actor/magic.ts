export interface Magic {
    Name: string;
    ButtonID: number;
    CoolDown: number;
    BaseDamage: number;
    DamageCalculation(): number;
    EffectID: number;

}
export abstract class Magic {
    

}

