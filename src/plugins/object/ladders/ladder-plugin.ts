import { objectAction, ObjectActionPlugin } from '@server/world/mob/player/action/object-action';
import { dialogueAction } from '@server/world/mob/player/action/dialogue-action';
import { World } from '@server/world/world';
import { Position } from '@server/world/position';

const planes = {min: 0, max: 3};
const validate: (level: number) => boolean = (level) => {
    return planes.min <= level && level <= planes.max;
}; //TODO: prevent no-clipping.

export const action: objectAction = (details) => {
    const {player, option} = details;

    if (option === 'climb') {
        dialogueAction(player)
            .then(d => d.options(
                `Climb up or down the ${details.objectDefinition.name.toLowerCase()}?`,
                [
                    `Climb up the ${details.objectDefinition.name.toLowerCase()}.`,
                    `Climb down the ${details.objectDefinition.name.toLowerCase()}.`
                ]))
            .then(d => {
                d.close();
                switch (d.action) {
                    case 1:
                    case 2:
                        const direction = d.action === 1 ? 'up' : 'down';
                        action({...details, option: `climb-${direction}`});
                        return;
                }
            }).catch(error => console.error(error));
        return;
    }

    const up = option === 'climb-up';
    const {position} = player;
    const level = position.level + (up ? 1 : -1);

    if (!validate(level)) return;
    if (!details.objectDefinition.name.startsWith('Stair')) {
        player.playAnimation(up ? 828 : 827);
    }
    player.packetSender.chatboxMessage(`You climb ${option.slice(6)} the ${details.objectDefinition.name.toLowerCase()}.`);
    setTimeout(() => {
        details.player.teleport(new Position(position.x, position.y, level));
    }, World.TICK_LENGTH);

};

export default {
    objectIds: [1738, 1739, 1740, 1746, 1747, 1748, 12964, 12965, 12966],
    options: ['climb', 'climb-up', 'climb-down'],
    walkTo: true,
    action
} as ObjectActionPlugin;
