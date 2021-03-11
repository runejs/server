import { objectInteractionActionHandler } from '@engine/world/action/object-interaction.action';
import { objectIds } from '@engine/world/config/object-ids';
import { World } from '@engine/world';
import { animationIds } from '@engine/world/config/animation-ids';

export const enterDungeon: objectInteractionActionHandler = (details) => {
    const loc = details.player.position.clone();
    loc.y += 6400;
    details.player.playAnimation(animationIds.climbLadder);
    setTimeout(() => {
        details.player.teleport(loc);
    }, World.TICK_LENGTH);
};


export const exitDungeon: objectInteractionActionHandler = (details) => {
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
