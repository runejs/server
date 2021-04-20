import { Position } from '@engine/world/position';
import { Player } from '@engine/world/actor/player/player';
import { WorldInstance } from '@engine/world/instances';


export class WorldItem {
    itemId: number;
    amount: number;
    position: Position;
    owner?: Player;
    expires?: number;
    respawns?: number;
    removed?: boolean;
    instance: WorldInstance = null;
}
