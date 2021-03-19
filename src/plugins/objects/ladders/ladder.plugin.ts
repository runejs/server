import { objectInteractionActionHandler } from '@engine/world/action/object-interaction.action';
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
                        action({ ...details, option: `climb-${(d.action === 1 ? 'up' : 'down')}` });
                        return;
                }
            });
        return;
    }

    const up = option === 'climb-up';
    const { position } = player;
    const level = position.level + (up ? 1 : -1);

    if (!validate(level)) return;
    if (!details.objectDefinition.name.startsWith('Stair')) {
        player.playAnimation(up ? 828 : 827);
    }
    player.sendMessage(`You climb ${option.slice(6)} the ${details.objectDefinition.name.toLowerCase()}.`);
    setTimeout(() => {
        details.player.teleport(new Position(position.x, position.y, level));
    }, World.TICK_LENGTH);

};

export default {
    pluginId: 'rs:ladders',
    hooks: [
        {
            type: 'object_interaction',
            objectIds: [ 1738, 1739, 1740, 1746, 1747, 1748, 12964, 12965, 12966 ],
            options: [ 'climb', 'climb-up', 'climb-down' ],
            walkTo: true,
            handler: action
        }
    ]
};
