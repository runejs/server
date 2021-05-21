import { ObjectInteractionAction, ObjectInteractionActionHook } from '@engine/world/action/object-interaction.action';
import { TaskExecutor } from '@engine/world/action';
import { directionNameFromIndex, WNES } from '@engine/world/direction';
import { schedule } from '@engine/world/task';
import { dialogue, DialogueTree, Emote, execute } from '@engine/world/actor/dialogue';
import { Position } from '@engine/world/position';
import { getRandomStrongholdOfSecurityQuizQuestion, strongholdOfSecurityQuizData } from '@engine/config';
import { Player } from '@engine/world/actor/player/player';
import { objectIds } from '@engine/world/config/object-ids';
import {
    getFloorCompletionFromObjectId,
    getNpcKeyFromObjectId
} from '@plugins/dungeons/stronghold-of-security/stronghold-of-security-rewards.plugin';
import { animationIds } from '@engine/world/config/animation-ids';
import { StrongholdOfSecurityQuizQuestion } from '@engine/config/stronghold-of-security-quiz-config';

const canActivate = (task: TaskExecutor<ObjectInteractionAction>, taskIteration: number): boolean => {
    const { actor, actionData: { position, object } } = task;
    if (actor instanceof Player) {
        if (!actor.savedMetadata[`strongholdOfSecurityState`]) {
            actor.savedMetadata[`strongholdOfSecurityState`] = {
                dueForSecurityQuestion: false,
                floorCompletion: {
                    vaultOfWar: false,
                    catacombOfFamine: false,
                    pitOfPestilence: false,
                    sepulchreOfDeath: false
                }
            };
        }
    }
    return !(actor.position.distanceBetween(position) > 1);
}

const activate = async (task: TaskExecutor<ObjectInteractionAction>, taskIteration: number): Promise<boolean> => {
    const { player, actionData: { position, object } } = task.getDetails();
    const objectOrientation = WNES[object.orientation];

    if (player.position.distanceBetween(position) > 1) {
        return false;
    }

    if (player.position.distanceBetween(position) === 1) {
        await player.waitForPathing(position, true);
    }

    const doorOrientation = directionNameFromIndex(object.orientation);
    const teleportPosition = position.clone();
    switch (doorOrientation) {
        case 'NORTH':
            if (player.position.y === position.y) {
                teleportPosition.y++;
            }
            break;

        case 'EAST':
            if (player.position.x === position.x) {
                teleportPosition.x++;
            }
            break;

        case 'SOUTH':
            if (player.position.y === position.y) {
                teleportPosition.y--;
            }
            break;

        case 'WEST':
            if (player.position.x === position.x) {
                teleportPosition.x--;
            }
            break;
    }
    player.face(teleportPosition);

    const npcKey = getNpcKeyFromObjectId(object.objectId);
    const floorCompleted = getFloorCompletionFromObjectId(player, object.objectId);

    if (player.savedMetadata[`strongholdOfSecurityState`].dueForSecurityQuestion && !floorCompleted) {
        player.sessionMetadata[`correctAnswer`] = await promptPlayerWithSecurityQuestion(player, 0, object.objectId);
    } else {
        if (isWelcomeDoor(position) && player.position.y === position.y + 1) {
            await dialogue([player, { npc: npcKey, key: 'gate' }], [
                gate => [Emote.GENERIC, `Greetings adventurer. This place is kept safe by the spirits within the doors. As you pass through you will be asked questions about security. Hopefully you will learn much from us.`],
                gate => [Emote.GENERIC, `Please pass through and begin your adventure, beware of the various monsters that dwell within.`],
            ]);
        }
        player.sessionMetadata[`correctAnswer`] = true;
    }


    if (player.sessionMetadata[`correctAnswer`]) {
        player.sessionMetadata[`correctAnswer`] = false;
        player.savedMetadata[`strongholdOfSecurityState`].dueForSecurityQuestion = !player.savedMetadata[`strongholdOfSecurityState`].dueForSecurityQuestion;
        player.playAnimation(animationIds.touchStrongholdOfSecurityDoor);
        player.playSound(2858);
        await schedule(1);

        player.teleport(teleportPosition);
        player.playAnimation(animationIds.lookAroundAfterStrongholdTeleportation);
        await schedule(5);
    } else {
        return false;
    }


    return true;
}

async function promptPlayerWithSecurityQuestion(player: Player, questionAttempt: number, objectId: number): Promise<boolean> {
    while (questionAttempt !== 3) {
        if (questionAttempt === 3) {
            return true;
        }

        const npcKey = getNpcKeyFromObjectId(objectId);

        await dialogue([player, {
            npc: npcKey,
            key: 'gate'
        }], generateStrongholdQuizDialogue(player, getRandomStrongholdOfSecurityQuizQuestion()));

        if (player.sessionMetadata[`correctAnswer`]) {
            return true;
        } else {
            if(!player.sessionMetadata[`strongholdDialogueComplete`]) {
                return false;
            }
            questionAttempt++;
        }
    }
    return true;
}

const isWelcomeDoor = (objectPosition: Position): boolean => {
    const leftWelcomeDoor = new Position(1858, 5238);
    const rightWelcomeDoor = new Position(1859, 5238);

    return (objectPosition.equals(leftWelcomeDoor) || objectPosition.equals(rightWelcomeDoor));
};

function generateStrongholdQuizDialogue(player: Player, strongholdQuestion: StrongholdOfSecurityQuizQuestion): DialogueTree {
    const questionText = strongholdOfSecurityQuizData.prefix + strongholdQuestion.questionText;
    player.sessionMetadata[`strongholdDialogueComplete`] = false;
    //TODO: Learn how to create option DialogueTrees, and make this more efficient.
    switch (strongholdQuestion.options.length) {
        case 2:
            return [
                gate => [Emote.GENERIC, questionText],
                options => [
                    strongholdQuestion.options[0].optionText, [
                        gate => [Emote.GENERIC, strongholdQuestion.options[0].doorResponse],
                        execute(() => player.sessionMetadata[`correctAnswer`] = strongholdQuestion.options[0].passable)
                    ],
                    strongholdQuestion.options[1].optionText, [
                        gate => [Emote.GENERIC, strongholdQuestion.options[1].doorResponse],
                        execute(() => player.sessionMetadata[`correctAnswer`] = strongholdQuestion.options[1].passable)
                    ]
                ],
                execute(() => {
                    player.sessionMetadata[`strongholdDialogueComplete`] = true;
                })
            ];

        case 3:
            return [
                gate => [Emote.GENERIC, questionText],
                options => [
                    strongholdQuestion.options[0].optionText, [
                        gate => [Emote.GENERIC, strongholdQuestion.options[0].doorResponse],
                        execute(() => player.sessionMetadata[`correctAnswer`] = strongholdQuestion.options[0].passable)
                    ],
                    strongholdQuestion.options[1].optionText, [
                        gate => [Emote.GENERIC, strongholdQuestion.options[1].doorResponse],
                        execute(() => player.sessionMetadata[`correctAnswer`] = strongholdQuestion.options[1].passable)
                    ],
                    strongholdQuestion.options[2].optionText, [
                        gate => [Emote.GENERIC, strongholdQuestion.options[2].doorResponse],
                        execute(() => player.sessionMetadata[`correctAnswer`] = strongholdQuestion.options[2].passable)
                    ]
                ],
                execute(() => {
                    player.sessionMetadata[`strongholdDialogueComplete`] = true;
                })
            ];

        default:
            return [
                gate => [Emote.GENERIC, `Something went wrong, beep boop!`],
                execute(() => player.sessionMetadata[`correctAnswer`] = false)
            ];
    }
}

const onComplete = (task: TaskExecutor<ObjectInteractionAction>): void => {
};

export default {
    pluginId: 'rs:stronghold_of_security_doors',
    hooks: [
        {
            type: 'object_interaction',
            options: ['open'],
            objectIds: [
                objectIds.strongholdOfSecurity.gates.gateOfWarLeft,
                objectIds.strongholdOfSecurity.gates.gateOfWarRight,
                objectIds.strongholdOfSecurity.gates.ricketyDoorLeft,
                objectIds.strongholdOfSecurity.gates.ricketyDoorRight,
                objectIds.strongholdOfSecurity.gates.oozingBarrierLeft,
                objectIds.strongholdOfSecurity.gates.oozingBarrierRight,
                objectIds.strongholdOfSecurity.gates.thePortalOfDeathLeft,
                objectIds.strongholdOfSecurity.gates.thePortalOfDeathRight],
            strength: 'normal',
            multi: false,
            walkTo: true,
            task: {
                canActivate,
                activate,
                onComplete
            }
        } as ObjectInteractionActionHook
    ]
};
