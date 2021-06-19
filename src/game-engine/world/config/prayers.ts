import { EffectType } from '../actor/effect';
import { Prayer } from '../actor/prayer';
import { soundIds } from './sound-ids';

export const prayers: Prayer[] = [
    {
        Name: 'Thick Skin',
        EffectType: EffectType.Defense,
        AnimationId: 645,
        EffectId: 0, //graphic id
        SoundId: soundIds.prayer.thick_skin,
        Modifier: 0.05, //ie 5% = 0.05
        ButtonId: 0
    },
    {
        Name: 'Burst of Strength',
        EffectType: EffectType.Strength,
        AnimationId: 645,
        EffectId: 0, //graphic id
        SoundId: soundIds.prayer.burst_of_strength,
        Modifier: 0.05, //ie 5% = 0.05
        ButtonId: 1,
    },
    {
        Name: 'Clarity of Thought',
        EffectType: EffectType.Attack,
        AnimationId: 645,
        EffectId: 0, //graphic id
        SoundId: soundIds.prayer.clarity_of_thought,
        Modifier: 0.05, //ie 5% = 0.05
        ButtonId: 2
    },
    {
        Name: 'Sharp Eye',
        EffectType: EffectType.Ranged,
        AnimationId: 645,
        EffectId: 0, //graphic id
        SoundId: soundIds.prayer.sharp_eye,
        Modifier: 0.05, //ie 5% = 0.05
        ButtonId: 36
    },
    {
        Name: 'Mystic Will',
        EffectType: EffectType.Magic,
        AnimationId: 645,
        EffectId: 0, //graphic id
        SoundId: soundIds.prayer.mystic_will,
        Modifier: 0.05, //ie 5% = 0.05
        ButtonId: 38
    },
    {
        Name: 'Rock Skin',
        EffectType: EffectType.Defense,
        AnimationId: 645,
        EffectId: 0, //graphic id
        SoundId: soundIds.prayer.rock_skin,
        Modifier: 0.1, //ie 5% = 0.05
        ButtonId: 3
    },
    {
        Name: 'Superhuman Strength',
        EffectType: EffectType.Strength,
        AnimationId: 645,
        EffectId: 0, //graphic id
        SoundId: soundIds.prayer.superhuman_strength,
        Modifier: 0.1, //ie 5% = 0.05
        ButtonId: 4
    },
    {
        Name: 'Improved Reflexes',
        EffectType: EffectType.Attack,
        AnimationId: 645,
        EffectId: 0, //graphic id
        SoundId: soundIds.prayer.improved_reflexes,
        Modifier: 0.1, //ie 5% = 0.05
        ButtonId: 5
    },
    { //This is not going to work - recover stats? what does that even mean?
        Name: 'Rapid Restore',
        EffectType: EffectType.RecoverStats,
        AnimationId: 645,
        EffectId: 0, //graphic id
        SoundId: soundIds.prayer.rapid_restore,
        Modifier: 0.1, //ie 5% = 0.05
        ButtonId: 6
    },
    {
        Name: 'Rapid Heal',
        EffectType: EffectType.HPRestoreRate,
        AnimationId: 645,
        EffectId: 0, //graphic id
        SoundId: soundIds.prayer.rapid_restore,
        Modifier: 1, //ie 5% = 0.05
        ButtonId: 7
    }
];