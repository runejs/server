import { DamageType } from '../../world/actor/update-flags';
import { ActionType, RunePlugin } from '../plugin';
import { loopingAction, walkToAction } from '../../world/actor/player/action/action';
import { schedule } from '../../task/task';
import { npcAction } from '@server/world/actor/player/action/npc-action';
import { Actor } from '@server/world/actor/actor';
import { Player } from '@server/world/actor/player/player';
import { timer } from 'rxjs';

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
