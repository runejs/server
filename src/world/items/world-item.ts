import { Position } from '@server/world/position';
import { Player } from '@server/world/actor/player/player';
import { WorldInstance } from '@server/world/instances';

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
