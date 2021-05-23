import { NpcInteractionAction, npcInteractionActionHandler } from '@engine/world/action/npc-interaction.action';
import { Actor } from '@engine/world/actor/actor';
import { Player } from '@engine/world/actor/player/player';
import { lastValueFrom, timer } from 'rxjs';
import { World } from '@engine/world';
import { filter, take } from 'rxjs/operators';
import { animationIds } from '@engine/world/config/animation-ids';
import { Npc } from '@engine/world/actor/npc/npc';
import { world } from '@engine/game-server';
import { itemIds } from '@engine/world/config/item-ids';
import { soundIds } from '@engine/world/config/sound-ids';
import { findNpc } from '@engine/config';
import { TaskExecutor } from '../../game-engine/world/action/hooks';
import { wait } from '../../game-engine/world/task';


class Combat {

    public readonly assailant: Actor;
    public readonly victim: Actor;
    public combatActive: boolean = false;
    public contactInitiated: boolean = false;


    public constructor(actor: Actor, victim: Actor) {
        this.assailant = actor;
        this.victim = victim;
    }

    public cancelCombat(): void {
        this.contactInitiated = false;
        this.combatActive = false;
        this.assailant.actionsCancelled.next(null);
        this.victim.actionsCancelled.next(null);
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
        if (!this.combatActive) {
            return;
        }

        await this.assailant.tail(this.victim);

        if (!firstAttack) {
            await lastValueFrom(timer(4 * World.TICK_LENGTH).pipe(take(1)));
        }

        if (!this.combatActive) {
            return;
        }

        this.damage(this.assailant, this.victim);

        if (!this.contactInitiated) {
            this.contactInitiated = true;

            if (this.victim instanceof Npc) {
                const player = this.assailant as Player;
                player.sendMessage(`Victim max health is ${this.victim.skills.hitpoints.level}.`)
            }

            this.processVictim(true);
        }

        this.processAttacker();
    }

    public async processVictim(firstAttack: boolean = false): Promise<void> {
        if (!this.combatActive) {
            return;
        }

        await this.victim.tail(this.assailant);

        if (!firstAttack) {
            await timer(6 * World.TICK_LENGTH).toPromise();
        } else {
            await timer(World.TICK_LENGTH).toPromise();
        }

        if (!this.combatActive) {
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
        const attackAnim: number = attacker.getAttackAnimation();

        // Animate attacking the opponent and play the sound of them defending
        attacker.playAnimation(attackAnim);
        world.playLocationSound(defender.position, defender instanceof Player ? soundIds.npc.human.playerDefence :
            soundIds.npc.human.maleDefence, 5);

        const defenderState: 'alive' | 'dead' = defender.damage(actualHit);

        if (defenderState === 'dead') {
            // @TODO death sounds
            this.processDeath(defender, attacker);
        } else {
            // Play the sound of the defender being hit or blocking
            world.playLocationSound(defender.position, defender instanceof Player ? soundIds.npc.human.noArmorHitPlayer :
                soundIds.npc.human.noArmorHit, 5);
            defender.playAnimation(defender.getBlockAnimation());
        }
    }

    public async processDeath(victim: Actor, assailant?: Actor): Promise<void> {
        const deathPosition = victim.position;

        let deathAnim: number = animationIds.death;

        if (victim instanceof Npc) {
            deathAnim = findNpc(victim.id)?.combatAnimations?.death || animationIds.death
        }

        this.cancelCombat();
        victim.playAnimation(deathAnim);
        world.playLocationSound(deathPosition, soundIds.npc.human.maleDeath, 5);

        await timer(2 * World.TICK_LENGTH).toPromise();

        let instance = world.globalInstance;
        if (victim instanceof Npc) {
            victim.kill(true);

            if (assailant && assailant instanceof Player) {
                instance = assailant.instance;
            }
        } else if (victim instanceof Player) {
            // @TODO
            instance = victim.instance;
        }

        instance.spawnWorldItem(itemIds.bones, deathPosition,
            { owner: this.assailant instanceof Player ? this.assailant : undefined, expires: 300 });
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

}

//const attackNpcAction: npcInteractionActionHandler = details => {
//    const { player, npc } = details;

//    //const combatInstance = new Combat(player, npc);
//    //await combatInstance.initiateCombat();
//};

//export const activate = async (task: TaskExecutor<NpcInteractionAction>, elapsedTicks: number = 0) => {
//    const { player, npc, position, option } = task.actionData;

//    let completed: boolean = false;

//    console.log("starto");
//    completed = true;
//    wait(100);
//    if (completed) {
//        task.stop();
//    }
//};


//export default {
//    pluginId: 'rs:combat',
//    hooks: [
//        {
//            type: 'npc_interaction',
//            options: 'attack',
//            walkTo: true,
//            task: {
//                activate,
//                interval: 1
//            }
//        }
//    ]
//};