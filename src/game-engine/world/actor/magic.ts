export interface Magic {
    Name: string;
    ButtonID: number;
    CoolDown: number;
    BaseDamage: number;

    DamageCalculation(): number;

}
export abstract class Magic {
    

}

