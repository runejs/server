import { objectAction } from '@server/world/actor/player/action/object-action';
import { ActionType, RunePlugin } from '@server/plugins/plugin';
import { objectIds } from '@server/world/config/object-ids';

export const enterDungeon: objectAction = (details) => {
    const loc = details.player.position.clone();
    loc.x += 6400;
    details.player.teleport(loc);
};


export const exitDungeon: objectAction = (details) => {
    const loc = details.player.position.clone();
    loc.x -= 6400;
    details.player.teleport(loc);
};


export default new RunePlugin([
    {
        type: ActionType.OBJECT_ACTION,
        objectIds: objectIds.ladders.taverlyDungeonOverworld,
        options: ['climb-down'],
        walkTo: true,
        action: enterDungeon
    },
    {
        type: ActionType.OBJECT_ACTION,
        objectIds: objectIds.ladders.taverlyDungeonUnderground,
        options: ['climb-up'],
        walkTo: true,
        action: exitDungeon
    }
]);
