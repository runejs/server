import { Actor } from '@server/world/actor/actor';

export class CombatAction {

    public constructor(private _actor: Actor, private _opponent: Actor) {
    }

    get actor(): Actor {
        return this._actor;
    }

    get opponent(): Actor {
        return this._opponent;
    }
}
