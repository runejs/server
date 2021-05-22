import { Actor } from '../actor';
import { regionChangeActionFactory } from '@engine/world/action/region-change.action';
import { Subject } from 'rxjs';
import { logger } from '@runejs/core';
import { Behavior, BehaviorType } from './behavior';
import { Timestamp } from 'rxjs/dist/types/internal/types';
import { timestamp } from 'rxjs/dist/types/operators';
import { Player } from '../player/player';
import { Npc } from '../npc/npc';

export class MeleeCombatBehavior extends Behavior {

    Type = BehaviorType.Combat;
    Name = 'basic-melee-combat';
    //seconds
    private _CoolDown: number = 4;
    private _lastAttack = new Date();

    //this should be called when combat starts
    public async init(me: Actor, them: Actor): Promise<void> {
        this.Me = me;
        this.Them = them;
        await super.init(me, them);
    }
    
    public async tick() {
        if (this.Me == null) return;
        
        return new Promise<void>(resolve => {
            if (this.Me.inCombat && this.Me.hitPoints <= 0) {

                this.Me.inCombat = false;
                this.Me.isDead = true;
                (this.Me as Npc).kill(false);
                if (this.Them.isNpc) (this.Them as Player).playerEvents.emit('kill', this.Them);

            }
            //only use boolean checks in behaviors never calculated values if you can help it (performance)
            if (this.Me.inCombat) {
                if (this.Distance > 5) {
                    this.Me.inCombat = false;
                    console.log('You or your target has fled from combat!');
                    resolve();
                }
                
                //If we are not in range move there
                if (this.Distance > this.Me.meleeDistance) this.Me.moveTo(this.Them);
                //Are you in range to attack?
                if (this.Distance <= this.Me.meleeDistance && this.coolDownElapsed) {
                    this.doAttack();
                    this.resetCoolDown(this._CoolDown);
                }

                if (!this.Me.isDead) super.tick();
                resolve();
            }
            
            
        });
    }
    public async doAttack():Promise<void> {
        return new Promise<void>(resolve => {
            //do attack stuff
            this.Me.playAnimation(this.Me.getAttackAnimation());

            const _damage = this.Me.skills.strength.level;
            console.log(`${(this.Me as Npc).name} attacks ${(this.Them as Player).username} for ${_damage} damage! (after the CD)`);
            (this.Me as Npc).npcEvents.emit('damage', _damage);
            this.Them.damage(_damage);
        });
    }
    public get coolDownElapsed(): boolean {
        if (new Date() > this._lastAttack) return true;
        return false;
    }
    public resetCoolDown(seconds:number):void {
        this._lastAttack.setSeconds(this._lastAttack.getSeconds() + seconds);
    }
    

}