import { objectInteractionActionHandler } from '@engine/world/action/object-interaction.action';
import { dialogueAction } from '@engine/world/actor/player/dialogue-action';
import { World } from '@engine/world';
import { Position } from '@engine/world/position';

const planes = { min: 0, max: 3 };
const validate: (level: number) => boolean = (level) => {
    return planes.min <= level && level <= planes.max;
}; //TODO: prevent no-clipping.

export const action: objectInteractionActionHandler = (details) => {
    const { player, option, object } = details;

    const up = option === 'climb-up';
    const { position } = player;
    const level = position.level + (up ? 1 : -1);

    const direction = object.orientation;
    let newX = position.x;
    let newY = position.y;
    const tilesToMove = 4;

    switch (direction) {
        case 0:
            if (up) {
                newY += tilesToMove;
            } else {
                newY -= tilesToMove;
            }
            break;
        case 1:
            if (up) {
                newX += tilesToMove;
            } else {
                newX -= tilesToMove;
            }
            break;
        case 2:
            if (up) {
                newY -= tilesToMove;
            } else {
                newY += tilesToMove;
            }
            break;
        case 3:
            if (up) {
                newX -= tilesToMove;
            } else {
                newX += tilesToMove;
            }
            break;
    }

    if (!validate(level)) return;
    setTimeout(() => {
        details.player.teleport(new Position(newX, newY, level));
    }, World.TICK_LENGTH);
};

export default {
    pluginId: 'rs:staircases',
    hooks: [
        {
            type: 'object_interaction',
            objectIds: [ 1722, 1723 ],
            options: [ 'climb-up', 'climb-down' ],
            walkTo: true,
            handler: action
        }
    ]
};
