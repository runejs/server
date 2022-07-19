import { Actor } from '../actor';
import { Behavior, BehaviorType } from './behavior';
import { Npc } from '../npc';
import { Player } from '../player/player';

export class AutoAttackBehavior extends Behavior {
    
    Type = BehaviorType.Combat;
    Name = 'auto-attack-combat';

    private _combatPulse;
    private _CoolDown: number = 3;
    private _lastAttack = new Date();
    private _player: Player;

    //this should be called when combat starts
    public async init(me: Actor, them: Actor): Promise<void> {
        this.Me = me;
        this.Them = them;
        this._player = (me as Player);
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
    public async doAttack(): Promise<void> {
        return new Promise<void>(resolve => {
            //do attack stuff
            const attack = this.Me.getAttackRoll(this.Them);
            console.log(`you attack ${(this.Them as Npc).name} for ${attack.damage} damage! (after the CD)`);
            this.Them.damage(attack.damage);
            if (this.Them.hitPoints <= 0) {
                (this.Them as Npc).npcEvents.emit('death', this.Me, this.Them);
            }
                
        });
    }
    public get coolDownElapsed(): boolean {
        if (new Date() > this._lastAttack) return true;
        return false;
    }
    public resetCoolDown(seconds: number): void {
        this._lastAttack.setSeconds(this._lastAttack.getSeconds() + seconds);
    }


}
