
export abstract class Effect {
    public Name: string;
    public EffectType: EffectType;
    public EffectId: number;
    public Modifier: number =0;

}

export enum EffectType {
    BoostDefense,
    BoostOffense,
    LowerDefense,
    LowerOffense,
    Curse,
    Poison,
    Fire,
    EnvironmentDamage
}
