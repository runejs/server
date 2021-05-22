import { Actor } from '../actor';
import { regionChangeActionFactory } from '@engine/world/action/region-change.action';
import { Subject } from 'rxjs';
import { Npc } from '../npc/npc';
import { Player } from '../player/player';

export abstract class Behavior {
    //because not all interaction between npcs will be combat oriented me/them is on the base class
    public Me: Actor;
    public Them: Actor;
    public Distance: number;
    public Name: string; 
    public Type: BehaviorType;
    //Be sure to call the tick super so you wont have to duplicate all the functionality
    public async tick() {
        if (this.Me.isDead) return;
        //If we have more than one combat target be sure to select the next one
        if (this.Them == null && this.Me != null && this.Me.combatTargets.length > 0) this.Them == this.Me.combatTargets[0];
        //update calculated variables
        if (this.Them != null) this.Distance = this.Me.position.distanceBetween(this.Them.position);

        return new Promise<void>(resolve => { resolve(); });
    }
    public async init(me: Actor = null, them: Actor = null) {
        if (me != null && them != null) me.combatTargets.push(them);
        return new Promise<void>(resolve => {
            resolve();
        });
    }
}


export enum BehaviorType {
    //movement
    Roaming = 'roaming', //world.tickComplete
    Chase = 'chase', //position.distanceBetween
    //combat
    Combat = 'combat',
    Flee = 'flee',

}