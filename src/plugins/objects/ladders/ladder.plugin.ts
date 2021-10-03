import { objectInteractionActionHandler } from '@engine/action/object-interaction.action';
import { dialogueAction } from '@engine/world/actor/player/dialogue-action';
import { World } from '@engine/world';
import { Position } from '@engine/world/position';


const planes = { min: 0, max: 3 };
const validate: (level: number) => boolean = (level) => {
    return planes.min <= level && level <= planes.max;
}; //TODO: prevent no-clipping.

export const action: objectInteractionActionHandler = (details) => {
    const { player, option } = details;
    if (option === 'climb') {
        dialogueAction(player)
            .then(async d => d.options(
                `Climb up or down the ${details.objectConfig.name.toLowerCase()}?`,
                [
                    `Climb up the ${details.objectConfig.name.toLowerCase()}.`,
                    `Climb down the ${details.objectConfig.name.toLowerCase()}.`
                ]))
            .then(d => {
                d.close();
                switch (d._action.data) {
                    case 1:
                    case 2:
                        action({ ...details, option: `climb-${(d._action.data === 1 ? 'up' : 'down')}` });
                        return;
                }
            });
        return;
    }
    const up = option === 'climb-up';
    const { position } = player;
    const newPosition = new Position(position.x, position.y, position.level);
    newPosition.level = position.level + (up ? 1 : -1);
    if(position.level === 0) {
        if(newPosition.level === 1 && position.y >= 6400) {
            newPosition.level = 0;
            newPosition.y -= 6414;
            newPosition.x++;
        } else if(newPosition.level === -1) {
            newPosition.level = 0;
            newPosition.y += 6414;
            newPosition.x--;
        }
    }
    if (!validate(newPosition.level)) return;
    if (!details.objectConfig.name.startsWith('Stair')) {
        player.playAnimation(up ? 828 : 827);
    }
    player.sendMessage(`You climb ${option.slice(6)} the ${details.objectConfig.name.toLowerCase()}.`);
    setTimeout(() => details.player.teleport(newPosition), World.TICK_LENGTH);

};

export default {
    pluginId: 'rs:ladders',
    hooks: [
        {
            type: 'object_interaction',
            objectIds: [ 1738, 1739, 1740, 1746, 1747, 1748, 2147, 2148, 12964, 12965, 12966 ],
            options: [ 'climb', 'climb-up', 'climb-down' ],
            walkTo: true,
            handler: action
        }
    ]
};
