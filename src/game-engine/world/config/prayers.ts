import { EffectType } from "../actor/effect";
import { Prayer } from "../actor/prayer";
import { soundIds } from "./sound-ids";

export const prayers: Prayer[] = [
    {
        Name: "Thick Skin",
        EffectType: EffectType.BoostDefense,
        AnimationId: 645,
        EffectId: 0, //graphic id
        SoundId: soundIds.prayer.thick_skin,
        Modifier: 0.05, //ie 5% = 0.05
        ButtonId: 0
    }

];