import { Actor } from '../actor';
import { Subject } from 'rxjs';
import { logger } from '@runejs/core';
import { Behavior, BehaviorType } from './behavior';
import { Npc } from '../npc/npc';
import { Player } from '../player/player';
import { DamageType } from '../update-flags';
import { Attack, AttackDamageType } from '../player/attack';

export class AutoAttackBehavior extends Behavior {
    
    Type = BehaviorType.Combat;
    Name = 'auto-attack-combat';

    private _combatPulse;
    private _CoolDown: number = 3;
    private _lastAttack = new Date();
    private _player: Player;
    private _attackType: AttackType;
    //this should be called when combat starts
    public async init(me: Actor, them: Actor): Promise<void> {
        this.Me = me;
        this.Them = them;

        this._player = (me as Player);
        console.log(this._player.damageType);
        console.log('all set to auto attack!');
        (this.Them as Npc).npcEvents.on('death', (npc) => this._player.onNpcKill);
        await super.init(me, them);
    }

    public async tick() {
        if (this.Me == null) return;

        return new Promise<void>(resolve => {
            //only use boolean checks in behaviors never calculated values if you can help it (performance)
            if (this.Me.inCombat) {
                if (this.Them.isDead) {
                    //ToDo: this is the last one on the stack not neccessarily your current target.
                    this.Me.combatTargets.pop();
                    resolve();
                    return;
                }
                if (this.Distance > 25) {
                    this.Me.inCombat = false;
                    console.log('target too far away - ending combat');
                    resolve();
                }


                if (this.getAttackType() == AttackType.Melee && this.Distance <= this.Me.meleeDistance && this.coolDownElapsed) {
                    //If we are not in range move there
                    if (this.Distance > this.Me.meleeDistance) this.Me.moveTo(this.Them);
                    if (this.coolDownElapsed) this.doAttack();
                }
                if (this.getAttackType() == AttackType.Ranged) {
                    
                    if (this.coolDownElapsed) {
                        console.log("doing ranged attack");
                        this.doRangedattack();
                    }
                }

                this.resetCoolDown(this._CoolDown);

                if (this.Them.hitPoints <= 0) {
                    (this.Them as Npc).npcEvents.emit('death', this.Me, this.Them);
                }

                if (!this.Me.isDead) super.tick();

                resolve();
            }
        });
    }

    public async doAttack(): Promise<void> {
        return new Promise<void>(resolve => {
            //do attack stuff
            const attack = this.Me.getAttackRoll(this.Them);
            console.log(`you attack ${(this.Them as Npc).name} for ${attack.damage} damage!`);
            this.Them.damage(attack.damage);

        });
    }
    public async doRangedattack() {
        return new Promise<void>(resolve => {
            const attackerX = this._player.position.x;
            const attackerY = this._player.position.y
            const victimX = this.Them.position.x
            const victimY = this.Them.position.y;
            const offsetX = ((victimY - attackerY));
            const offsetY = ((victimX - attackerX));

            this._player.playAnimation(426);
            this._player.outgoingPackets.sendProjectile(this._player.position, offsetX, offsetY, 250, 40, 36, 100, this.Them.worldIndex + 1, 1);

            this.Them.damage(this.Me.getAttackRoll(this.Them).damage);
        });
    }
    public get coolDownElapsed(): boolean {
        console.log(new Date() > this._lastAttack, (new Date().getSeconds() - this._lastAttack.getSeconds()));
        if (new Date().getSeconds() > this._lastAttack.getSeconds()) return true;
        return false;
    }
    public resetCoolDown(seconds: number): void {
        this._lastAttack.setSeconds(this._lastAttack.getSeconds() + seconds);
    }
    public getAttackType() {
        var damage = AttackDamageType[AttackDamageType[this._player.damageType]];
        if (damage == AttackDamageType.Crush || damage == AttackDamageType.Slash || damage == AttackDamageType.Stab) return AttackType.Melee;
        if (damage == AttackDamageType.Range || damage == AttackDamageType.Magic) return AttackType.Ranged;
    }

}

enum AttackType {
    Melee,
    Ranged
    
}