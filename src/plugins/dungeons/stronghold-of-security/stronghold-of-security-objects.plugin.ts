import { ObjectInteractionAction, ObjectInteractionActionHook } from '@engine/world/action/object-interaction.action';
import { TaskExecutor } from '@engine/world/action';
import { schedule } from '@engine/world/task';
import { dialogue, execute } from '@engine/world/actor/dialogue';
import { Position } from '@engine/world/position';
import { objectIds } from '@engine/world/config/object-ids';
import { animationIds } from '@engine/world/config/animation-ids';
import { staticPositions } from '@engine/world/config/static-positions';

const canActivate = (task: TaskExecutor<ObjectInteractionAction>, taskIteration: number): boolean => {
    const { actor, actionData: { position, object } } = task;

    return true;
}

const activateDescendingLadders = async (task: TaskExecutor<ObjectInteractionAction>, taskIteration: number): Promise<boolean> => {
    const { player, actionData: { position, object } } = task.getDetails();
    player.face(position);

    let descend = false;
    await dialogue([player], [
        options => [
            `Yes, I know that it may be dangerous down there!`, [
                execute(() => {
                    descend = true;
                })
            ],
            `No thanks, I don't want to die!`, [
                execute(() => {
                    player.sendMessage(`Hey2!`)
                })
            ]
        ],
    ],
    );

    if (descend) {
        player.playAnimation(animationIds.climbLadder);
        await schedule(1);

        let teleportPosition;
        switch (object.objectId) {
            case objectIds.strongholdOfSecurity.descendingLadders.vaultOfWarLadder:
                teleportPosition = staticPositions.catacombOfFamineEntrance;
                break;

            case objectIds.strongholdOfSecurity.descendingLadders.catacombLadder:
                teleportPosition = staticPositions.pitOfPestilenceEntrance;
                break;

            case objectIds.strongholdOfSecurity.descendingLadders.drippingVine:
                teleportPosition = staticPositions.sepulchreOfDeathEntrance;
                break;
        }
        player.sendMessage(`You climb down the ladder to the next level.`)
        player.teleport(teleportPosition);
    }
    return true;
}

const activateEscapeRopesAndAscendingLadders = async (task: TaskExecutor<ObjectInteractionAction>, taskIteration: number): Promise<boolean> => {
    const { player, actionData: { position, object } } = task.getDetails();
    player.face(position);
    let teleportPosition;
    switch (object.objectId) {
        case objectIds.strongholdOfSecurity.ascendingLadders.vaultOfWarLadder:
            teleportPosition = staticPositions.strongholdOfSecurityEntrance;
            break;

        case objectIds.strongholdOfSecurity.ascendingLadders.catacombLadder:
        case objectIds.strongholdOfSecurity.escapeRopes.spikeyChain:
            teleportPosition = staticPositions.vaultOfWarEntrance;
            break;

        case objectIds.strongholdOfSecurity.ascendingLadders.drippingVine:
        case objectIds.strongholdOfSecurity.escapeRopes.catacombRope:
            teleportPosition = staticPositions.catacombOfFamineEntrance;
            break;
        case objectIds.strongholdOfSecurity.ascendingLadders.boneyLadder:
        case objectIds.strongholdOfSecurity.escapeRopes.gooCoveredVine:
            teleportPosition = staticPositions.pitOfPestilenceEntrance;
            break;

        case objectIds.strongholdOfSecurity.escapeRopes.boneChain:
            teleportPosition = staticPositions.strongholdOfSecurityEntrance;
            break;
    }

    const objectType = getObjectType(object.objectId);

    if (objectType === ObjectType.ESCAPE_ROPE) {
        await player.sendMessage(`You shin up the rope, squeeze through a passage then climb a ladder.`)
    } else {
        await player.sendMessage(`You climb up the ladder to the level above.`)
    }

    player.playAnimation(animationIds.climbLadder);
    await schedule(1);
    player.teleport(teleportPosition);

    if (objectType === ObjectType.ESCAPE_ROPE) {
        await player.sendMessage(`You climb up the ladder which seems to twist and wind in all directions.`)
    }
    return true;
}

const activatePortal = async (task: TaskExecutor<ObjectInteractionAction>, taskIteration: number): Promise<boolean> => {
    const { player, actionData: { position, object } } = task.getDetails();
    player.face(position);
    let teleportPosition;
    switch (object.objectId) {
        case objectIds.strongholdOfSecurity.portals.levelOnePortal:
            if (player.savedMetadata[`strongholdOfSecurityState`].floorCompletion.vaultOfWar) {
                teleportPosition = new Position(1914, 5222);
            }
            break;

        case objectIds.strongholdOfSecurity.portals.levelTwoPortal:
            if (player.savedMetadata[`strongholdOfSecurityState`].floorCompletion.catacombOfFamine) {
                teleportPosition = new Position(2021, 5223);
            }
            break;

        case objectIds.strongholdOfSecurity.portals.levelThreePortal:
            if (player.savedMetadata[`strongholdOfSecurityState`].floorCompletion.pitOfPestilence) {
                teleportPosition = new Position(2146, 5287);
            }
            break;

        case objectIds.strongholdOfSecurity.portals.levelFourPortal:
            if (player.savedMetadata[`strongholdOfSecurityState`].floorCompletion.sepulchreOfDeath) {
                teleportPosition = new Position(2341, 5219);
            }
            break;
    }

    if (!teleportPosition) {
        await player.sendMessage(`You are not of sufficient experience to take the shortcut through this level.`);
        return false;
    }

    switch (task.actionData.option.toLowerCase()) {
        case `climb-up`:

            break;


    }
    player.sendMessage(`You enter the portal to be whisked through to the treasure room.`)
    player.teleport(teleportPosition);
    return true;
}


const activateDeadExplorer = async (task: TaskExecutor<ObjectInteractionAction>, taskIteration: number): Promise<boolean> => {
    const { player, actionData: { position, object } } = task.getDetails();
    player.face(position);
    player.playAnimation(animationIds.searchObject);
    if (player.hasItemInInventory(9004)) {
        player.sendMessage(`You don't find anything.`)
    } else {
        if (!player.inventory.hasSpace()) {
            await dialogue([player], [
                text => (`I'd better make room in my inventory first!`)
            ]);
        } else {
            player.giveItem(9004);
            await dialogue([player], [
                text => (`You rummage around in the dead explorer's bag.....`),
                text => (`You find a book of hand written notes.`)
            ]);
        }
    }
    return true;
}

const onComplete = (task: TaskExecutor<ObjectInteractionAction>): void => {
    // task.actor.face(task.actor.position);
};

const getObjectType = (objectId: number): ObjectType => {
    for (const ascendingLaddersKey in objectIds.strongholdOfSecurity.ascendingLadders) {
        const ladders = objectIds.strongholdOfSecurity.ascendingLadders;
        if (ladders[ascendingLaddersKey] === objectId) {
            return ObjectType.LADDER;
        }
    }

    for (const escapeRopesKey in objectIds.strongholdOfSecurity.escapeRopes) {
        const escapeRopes = objectIds.strongholdOfSecurity.escapeRopes;
        if (escapeRopes[escapeRopesKey] === objectId) {
            return ObjectType.ESCAPE_ROPE;
        }
    }
    return undefined;
}

enum ObjectType {
    ESCAPE_ROPE,
    LADDER
}

export default {
    pluginId: 'rs:stronghold_of_security_objects',
    hooks: [
        {
            type: 'object_interaction',
            options: ['climb-down'],
            objectIds: [objectIds.strongholdOfSecurity.descendingLadders.vaultOfWarLadder,
                objectIds.strongholdOfSecurity.descendingLadders.catacombLadder,
                objectIds.strongholdOfSecurity.descendingLadders.drippingVine],
            strength: 'normal',
            multi: false,
            walkTo: true,
            task: {
                canActivate,
                activate: activateDescendingLadders,
                onComplete
            }
        } as ObjectInteractionActionHook,
        {
            type: 'object_interaction',
            options: ['climb-up'],
            objectIds: [objectIds.strongholdOfSecurity.escapeRopes.boneChain,
                objectIds.strongholdOfSecurity.escapeRopes.gooCoveredVine,
                objectIds.strongholdOfSecurity.escapeRopes.catacombRope,
                objectIds.strongholdOfSecurity.escapeRopes.spikeyChain],
            strength: 'normal',
            multi: false,
            walkTo: true,
            task: {
                canActivate,
                activate: activateEscapeRopesAndAscendingLadders,
                onComplete
            }
        } as ObjectInteractionActionHook,
        {
            type: 'object_interaction',
            options: ['climb-up'],
            objectIds: [objectIds.strongholdOfSecurity.ascendingLadders.boneyLadder,
                objectIds.strongholdOfSecurity.ascendingLadders.drippingVine,
                objectIds.strongholdOfSecurity.ascendingLadders.catacombLadder,
                objectIds.strongholdOfSecurity.ascendingLadders.vaultOfWarLadder],
            strength: 'normal',
            multi: false,
            walkTo: true,
            task: {
                canActivate,
                activate: activateEscapeRopesAndAscendingLadders,
                onComplete
            }
        } as ObjectInteractionActionHook,
        {
            type: 'object_interaction',
            options: ['search'],
            objectIds: [objectIds.strongholdOfSecurity.miscellaneous.deadExplorer],
            strength: 'normal',
            multi: false,
            walkTo: true,
            task: {
                canActivate,
                activate: activateDeadExplorer,
                onComplete
            }
        } as ObjectInteractionActionHook,
        {
            type: 'object_interaction',
            options: ['use'],
            objectIds: [objectIds.strongholdOfSecurity.portals.levelOnePortal,
                objectIds.strongholdOfSecurity.portals.levelTwoPortal,
                objectIds.strongholdOfSecurity.portals.levelThreePortal,
                objectIds.strongholdOfSecurity.portals.levelFourPortal
            ],
            strength: 'normal',
            multi: false,
            walkTo: true,
            task: {
                canActivate,
                activate: activatePortal,
                onComplete
            }
        } as ObjectInteractionActionHook
    ]
};
