import { DamageType } from '../../world/actor/update-flags';
import { ActionType, RunePlugin } from '../plugin';
import { loopingAction, walkToAction } from '../../world/actor/player/action/action';
import { schedule } from '../../task/task';
import { npcAction } from '@server/world/actor/player/action/npc-action';
import { Actor } from '@server/world/actor/actor';
import { Player } from '@server/world/actor/player/player';
import { timer } from 'rxjs';
import { Skills } from '@server/world/actor/skills';

class Combat {

    public readonly actor: Actor;
    public readonly victim: Actor;
    public inCombat: boolean = false;

    public constructor(actor: Actor, victim: Actor) {
        this.actor = actor;
        this.victim = victim;
    }

    public async initiateCombat(): Promise<void> {
        await this.getWithinDistance();
        this.inCombat = true;
        await this.combatRoll();
    }

    public async combatRoll(): Promise<void> {
        if(!this.inCombat) {
            return;
        }

        // @TODO actor vs victim speed checks

        await this.actor.tail(this.victim);
        this.actor.face(this.victim);

        this.victim.updateFlags.addDamage(1, DamageType.DAMAGE, 4, 5);
        this.victim.face(this.actor, true);
        
        await timer(1200).toPromise();

        await this.victim.tail(this.actor);
        this.victim.face(this.actor);

        this.actor.updateFlags.addDamage(1, DamageType.DAMAGE, 4, 5);
        this.actor.face(this.victim);

        await timer(1200).toPromise();

        this.combatRoll();
    }

    public calculateCombatLevel(attack: number, strength: number, defence: number, hitpoints: number,
                         prayer: number, ranged: number, magic: number, skills: Skills): number {
        const combatLevel = (skills.defence.level + skills.hitpoints.level + Math.floor(skills.prayer.level / 2)) * 0.25;
        const melee = (skills.attack.level + skills.strength.level) * 0.325;
        const ranger = skills.ranged.level * 0.4875;
        const mage = skills.magic.level * 0.4875;
        return combatLevel + Math.max(melee, Math.max(ranger, mage));
    }

    public meleeMaxHit(strengthBase: number, strengthCurrent: number, strengthBonus: number, prayer: any, fightStyle: any,
                       special: any, effect: any, itemSet: any, hpBase?: number, hpCurrent?: number): number {
        const finalStrength = strengthCurrent + fightStyle.getStrengthBoost() +
            (strengthBase * prayer.getBoost()) + (strengthBase * effect.getBoost())/* +
            (itemSet == ItemSets.Dharok ? (hpBase - hpCurrent) : 0)*/;
        const strengthMultiplier = (strengthBonus * 0.00175) + 0.1;
        const maxHit = Math.floor((finalStrength * strengthMultiplier) + 1.05);
        return Math.floor(Math.floor(Math.floor(maxHit) * itemSet.getMultiplier()) * special.getMultiplier());
    }

    private async getWithinDistance(): Promise<void> {
        if(this.actor instanceof Player && this.actor.position.distanceBetween(this.victim.position) > 1) {
            await walkToAction(this.actor, this.victim.position);
        }
    
        this.actor.follow(this.victim);
    }

}

const attackNpcAction: npcAction = async details => {
    const { player, npc } = details;

    const combatInstance = new Combat(player, npc);
    await combatInstance.initiateCombat();

    /*const loop = loopingAction({ ticks: 5, player, npc });
    const loopSub = loop.event.subscribe(async () => {
        if(player.position.distanceBetween(npc.position) > 1) {
            walkToAction(player, npc.position);
            return;
        }

        npc.updateFlags.addDamage(1, DamageType.DAMAGE, 4, 5);

        await schedule(3);

        player.updateFlags.addDamage(1, DamageType.DAMAGE, 4, 5);
    });*/
};

export default new RunePlugin({
    type: ActionType.NPC_ACTION,
    options: 'attack',
    walkTo: true,
    action: attackNpcAction
});
