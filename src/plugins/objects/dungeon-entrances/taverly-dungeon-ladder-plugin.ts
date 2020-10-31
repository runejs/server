import { objectAction } from '@server/world/actor/player/action/object-action';
import { objectIds } from '@server/world/config/object-ids';
import { World } from '@server/world/world';
import { animationIds } from '@server/world/config/animation-ids';

export const enterDungeon: objectAction = (details) => {
    const loc = details.player.position.clone();
    loc.y += 6400;
    details.player.playAnimation(animationIds.climbLadder);
    setTimeout(() => {
        details.player.teleport(loc);
    }, World.TICK_LENGTH);
};


export const exitDungeon: objectAction = (details) => {
    const loc = details.player.position.clone();
    loc.y -= 6400;
    details.player.playAnimation(animationIds.climbLadder);
    setTimeout(() => {
        details.player.teleport(loc);
    }, World.TICK_LENGTH);
};


export default [
    {
        type: 'object_action',
        objectIds: objectIds.ladders.taverlyDungeonOverworld,
        options: ['climb-down'],
        walkTo: true,
        action: enterDungeon
    },
    {
        type: 'object_action',
        objectIds: objectIds.ladders.taverlyDungeonUnderground,
        options: ['climb-up'],
        walkTo: true,
        action: exitDungeon
    }
];
