export interface Magic {
    Name: string;
    ButtonID: number;
    CoolDown: number;
    BaseDamage: number;
    EffectID: number;
    DamageCalculation(): number;
    

}
export abstract class Magic {
    

}

