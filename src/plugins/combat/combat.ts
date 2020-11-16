import { DamageType } from '../../world/actor/update-flags';
import { walkToAction } from '../../world/action';
import { npcAction } from '@server/world/action/npc-action';
import { Actor } from '@server/world/actor/actor';
import { Player } from '@server/world/actor/player/player';
import { timer } from 'rxjs';
import { Skills } from '@server/world/actor/skills';
import { World } from '@server/world';
import { filter, take } from 'rxjs/operators';
import { animationIds } from '@server/world/config/animation-ids';
import { Npc } from '@server/world/actor/npc/npc';
import { world } from '@server/game-server';
import { itemIds } from '@server/world/config/item-ids';
import { soundIds } from '@server/world/config/sound-ids';
import { findNpc } from '@server/config';


const combatStyles = {
    unarmed: [
        {
            type: 'crush',
            exp: 'attack',
            anim: animationIds.combat.punch
        },
        {
            type: 'crush',
            exp: 'strength',
            anim: animationIds.combat.kick
        },
        {
            type: 'crush',
            exp: 'defence',
            anim: animationIds.combat.punch
        }
    ],
    axe: [
        {
            type: 'slash',
            exp: 'attack',
            anim: animationIds.combat.slash
        },
        {
            type: 'slash',
            exp: 'strength',
            anim: animationIds.combat.slash
        },
        {
            type: 'crush',
            exp: 'strength',
            anim: animationIds.combat.slash
        },
        {
            type: 'slash',
            exp: 'defence',
            anim: animationIds.combat.slash
        }
    ],
    dagger: [
        {
            type: 'stab',
            exp: 'attack',
            anim: animationIds.combat.stab
        },
        {
            type: 'stab',
            exp: 'strength',
            anim: animationIds.combat.stab
        },
        {
            type: 'slash',
            exp: 'strength',
            anim: animationIds.combat.slash
        },
        {
            type: 'stab',
            exp: 'defence',
            anim: animationIds.combat.stab
        }
    ]
};

class Combat {

    public readonly assailant: Actor;
    public readonly victim: Actor;
    public combatActive: boolean = false;
    public contactInitiated: boolean = false;

    public constructor(actor: Actor, victim: Actor) {
        this.assailant = actor;
        this.victim = victim;
    }

    /*
     * This is all a major work in progress
     * Scrap code, psuedo code, junk code, we have it all
     * Half of this is junk :D
     */

    public cancelCombat(): void {
        this.contactInitiated = false;
        this.combatActive = false;
        this.assailant.actionsCancelled.next();
        this.victim.actionsCancelled.next();
    }

    public async initiateCombat(): Promise<void> {
        this.combatActive = true;
        await this.processAttacker(true);

        this.assailant.actionsCancelled.pipe(
            filter(type => type !== 'pathing-movement'),
            take(1)
        ).toPromise().then(() => {
            this.cancelCombat();
        });

        this.victim.actionsCancelled.pipe(
            filter(type => type !== 'pathing-movement'),
            take(1)
        ).toPromise().then(() => {
            this.cancelCombat();
        });
    }

    public async processAttacker(firstAttack: boolean = false): Promise<void> {
        if(!this.combatActive) {
            return;
        }

        await this.assailant.tail(this.victim);

        if(!firstAttack) {
            await timer(4 * World.TICK_LENGTH).toPromise();
        }

        if(!this.combatActive) {
            return;
        }

        this.damage(this.assailant, this.victim);

        if(!this.contactInitiated) {
            this.contactInitiated = true;
            this.processVictim(true);
        }

        this.processAttacker();
    }

    public async processVictim(firstAttack: boolean = false): Promise<void> {
        if(!this.combatActive) {
            return;
        }

        await this.victim.tail(this.assailant);

        if(!firstAttack) {
            await timer(6 * World.TICK_LENGTH).toPromise();
        } else {
            await timer(World.TICK_LENGTH).toPromise();
        }

        if(!this.combatActive) {
            return;
        }

        this.damage(this.victim, this.assailant);
        this.processVictim();
    }

    public damage(attacker: Actor, defender: Actor): void {
        const skills = attacker.skills;
        const strengthBonus = (attacker instanceof Player) ? attacker.bonuses?.skill?.strength || 0 : 0;
        const maxHit = this.meleeMaxHit(skills.strength.levelForExp, skills.strength.level, strengthBonus, 1);
        const actualHit = Math.floor(Math.random() * (maxHit + 1));

        let defenderRemainingHealth: number = defender.skills.hitpoints.level - actualHit;
        const defenderMaxHealth: number = defender.skills.hitpoints.levelForExp;
        if(defenderRemainingHealth < 0) {
            defenderRemainingHealth = 0;
        }

        let attackAnim: number | number[] = animationIds.combat.punch;

        if(attacker instanceof Player) {
            let combatStyle = [ 'unarmed', 0 ];

            if(attacker.savedMetadata.combatStyle) {
                combatStyle = attacker.savedMetadata.combatStyle;
            }

            attackAnim = combatStyles[combatStyle[0]][combatStyle[1]]?.anim || animationIds.combat.punch;
        } else if(attacker instanceof Npc) {
            const npcData = findNpc(attacker.id);
            attackAnim = npcData?.animations?.attack || animationIds.combat.punch;
        }

        if(Array.isArray(attackAnim)) {
            // Actor has multiple attack animations possible, pick a random one from the list to use
            const idx = Math.floor(Math.random() * attackAnim.length);
            attackAnim = attackAnim[idx];
        }

        // Animate attacking the opponent and play the sound of them defending
        attacker.playAnimation(attackAnim);
        world.playLocationSound(defender.position, defender instanceof Player ? soundIds.npc.human.playerDefence :
            soundIds.npc.human.maleDefence, 5);

        // Set the opponent's new remaining hitpoints and their damage flag
        defender.skills.setHitpoints(defenderRemainingHealth);
        defender.updateFlags.addDamage(actualHit, actualHit === 0 ? DamageType.NO_DAMAGE : DamageType.DAMAGE,
            defenderRemainingHealth, defenderMaxHealth);

        // Play the sound of the defender being hit or blocking
        world.playLocationSound(defender.position, defender instanceof Player ? soundIds.npc.human.noArmorHitPlayer :
            soundIds.npc.human.noArmorHit, 5);

        // Kill the defender if their hitpoints are zero, otherwise play an animation of them blocking the hit
        if(defenderRemainingHealth === 0) {
            this.processDeath(defender);
        } else {
            let blockAnim: number = animationIds.combat.armBlock;
            if(defender instanceof Npc) {
                const npcData = findNpc(defender.id);
                blockAnim = npcData?.animations?.defend || animationIds.combat.armBlock;
            }
            defender.playAnimation(blockAnim);
        }
    }

    public async processDeath(victim: Actor): Promise<void> {
        const deathPosition = victim.position;

        let deathAnim: number = animationIds.death;

        if(victim instanceof Npc) {
            deathAnim = findNpc(victim.id)?.animations?.death || animationIds.death
        }

        this.cancelCombat();
        victim.playAnimation(deathAnim);
        world.playLocationSound(deathPosition, soundIds.npc.human.maleDeath, 5);

        await timer(2 * World.TICK_LENGTH).toPromise();

        if(victim instanceof Npc) {
            victim.kill(true);
        }/* else if(victim instanceof Player) {
            // @TODO
        }*/

        world.spawnWorldItem(itemIds.bones, deathPosition, this.assailant instanceof Player ? this.assailant : undefined, 300);
    }

    // https://forum.tip.it/topic/199687-runescape-formulas-revealed
    public calculateCombatLevel(skills: Skills): number {
        const combatLevel = (skills.defence.level + skills.hitpoints.level + Math.floor(skills.prayer.level / 2)) * 0.25;
        const melee = (skills.attack.level + skills.strength.level) * 0.325;
        const ranger = skills.ranged.level * 0.4875;
        const mage = skills.magic.level * 0.4875;
        return combatLevel + Math.max(melee, Math.max(ranger, mage));
    }

    // https://forum.tip.it/topic/199687-runescape-formulas-revealed
    public meleeMaxHit(strengthBase: number, strengthCurrent: number, strengthBonus: number, specialMultiplier: number): number {
        const finalStrength = strengthCurrent/* + fightStyleStrengthBoost +
            (strengthBase * prayerBoost) + (strengthBase * effectBoost) +
            (itemSet == Dharok ? (hpBase - hpCurrent) : 0)*/;
        const strengthMultiplier = (strengthBonus * 0.00175) + 0.1;
        const maxHit = Math.floor((finalStrength * strengthMultiplier) + 1.05);
        return Math.floor(Math.floor(Math.floor(maxHit)/* * itemSet.getMultiplier()*/) * specialMultiplier);
    }

    private async getWithinDistance(): Promise<void> {
        if(this.assailant instanceof Player && this.assailant.position.distanceBetween(this.victim.position) > 1) {
            await walkToAction(this.assailant, this.victim.position);
        }
    
        this.assailant.follow(this.victim);
    }

}

const attackNpcAction: npcAction = async details => {
    const { player, npc } = details;

    const combatInstance = new Combat(player, npc);
    await combatInstance.initiateCombat();
};

export default {
    type: 'npc_action',
    options: 'attack',
    walkTo: true,
    action: attackNpcAction
};
