import { animationIds } from '@server/world/config/animation-ids';

export const combatStyles = {
    unarmed: [
        {
            type: 'crush',
            exp: 'attack',
            anim: animationIds.combat.punch,
            buttonId: 2
        },
        {
            type: 'crush',
            exp: 'strength',
            anim: animationIds.combat.kick,
            buttonId: 3
        },
        {
            type: 'crush',
            exp: 'defence',
            anim: animationIds.combat.punch,
            buttonId: 4
        }
    ],
    axe: [
        {
            type: 'slash',
            exp: 'attack',
            anim: animationIds.combat.slash,
            buttonId: 2
        },
        {
            type: 'slash',
            exp: 'strength',
            anim: animationIds.combat.slash,
            buttonId: 5
        },
        {
            type: 'crush',
            exp: 'strength',
            anim: animationIds.combat.slash,
            buttonId: 4
        },
        {
            type: 'slash',
            exp: 'defence',
            anim: animationIds.combat.slash,
            buttonId: 3
        }
    ],
    dagger: [
        {
            type: 'stab',
            exp: 'attack',
            anim: animationIds.combat.stab,
            buttonId: 2
        },
        {
            type: 'stab',
            exp: 'strength',
            anim: animationIds.combat.stab,
            buttonId: 3
        },
        {
            type: 'slash',
            exp: 'strength',
            anim: animationIds.combat.slash,
            buttonId: 4
        },
        {
            type: 'stab',
            exp: 'defence',
            anim: animationIds.combat.stab,
            buttonId: 5
        }
    ]
};
