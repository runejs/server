import { DamageType } from '../../world/actor/update-flags';
import { ActionType, RunePlugin } from '../plugin';
import { walkToAction } from '../../world/actor/player/action/action';
import { npcAction } from '@server/world/actor/player/action/npc-action';
import { Actor } from '@server/world/actor/actor';
import { Player } from '@server/world/actor/player/player';
import { timer } from 'rxjs';
import { Skills } from '@server/world/actor/skills';
import { World } from '@server/world/world';
import { filter, take } from 'rxjs/operators';
import { animationIds } from '@server/world/config/animation-ids';
import { Npc } from '@server/world/actor/npc/npc';
import { world } from '@server/game-server';
import { itemIds } from '@server/world/config/item-ids';
import { soundIds } from '@server/world/config/sound-ids';

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

        attacker.playAnimation(animationIds.combat.punch);
        world.playLocationSound(defender.position, defender instanceof Player ? soundIds.npc.human.playerDefence :
            soundIds.npc.human.maleDefence, 5);
        defender.skills.setHitpoints(defenderRemainingHealth);
        defender.updateFlags.addDamage(actualHit, actualHit === 0 ? DamageType.NO_DAMAGE : DamageType.DAMAGE,
            defenderRemainingHealth, defenderMaxHealth);
        world.playLocationSound(defender.position, defender instanceof Player ? soundIds.npc.human.noArmorHitPlayer :
            soundIds.npc.human.noArmorHit, 5);

        if(defenderRemainingHealth === 0) {
            this.processDeath(defender);
        } else {
            defender.playAnimation(animationIds.combat.armBlock);
        }
    }

    public async processDeath(victim: Actor): Promise<void> {
        const deathPosition = victim.position;

        this.cancelCombat();
        victim.playAnimation(animationIds.death);
        world.playLocationSound(deathPosition, soundIds.npc.human.maleDeath, 5);

        await timer(2 * World.TICK_LENGTH).toPromise();

        if(victim instanceof Npc) {
            victim.kill(true);
        } else if(victim instanceof Player) {

        }

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

export default new RunePlugin({
    type: ActionType.NPC_ACTION,
    options: 'attack',
    walkTo: true,
    action: attackNpcAction
});
