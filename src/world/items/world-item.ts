import { Position } from '@server/world/position';
import { Player } from '@server/world/actor/player/player';

export class WorldItem {
    itemId: number;
    amount: number;
    position: Position;
    owner?: Player;
    expires?: number;
    removed?: boolean;
    instanceId: string = null;
}
