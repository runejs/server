import { ObjectInteractionAction, ObjectInteractionActionHook } from '@engine/world/action/object-interaction.action';
import { TaskExecutor } from '@engine/world/action';
import { dialogue, Emote, execute } from '@engine/world/actor/dialogue';
import { findItem } from '@engine/config';
import { unlockEmote } from '@plugins/buttons/player-emotes.plugin';
import { objectIds } from '@engine/world/config/object-ids';
import { Player } from '@engine/world/actor/player/player';
import { strongholdOfSecurityRewardData } from '@engine/world/config/stronghold-of-security-reward-data';

const canActivate = (task: TaskExecutor<ObjectInteractionAction>, taskIteration: number): boolean => {
    const { actor, actionData: { position, object } } = task;

    return true;
}

interface StrongholdOfSecurityRewardData {
    objectId: number;
    initialMessage: string;
    emoteUnlocked: string;
    amountOfGoldRewarded: number;
}

export const getFloorCompletionFromObjectId = (player: Player, objectId: number): boolean => {
    switch (objectId) {
        case objectIds.strongholdOfSecurity.gates.gateOfWarLeft:
        case objectIds.strongholdOfSecurity.gates.gateOfWarRight:
        case objectIds.strongholdOfSecurity.rewardObjects.giftOfPeace:
            return player.savedMetadata[`strongholdOfSecurityState`].floorCompletion.vaultOfWar;

        case objectIds.strongholdOfSecurity.gates.ricketyDoorLeft:
        case objectIds.strongholdOfSecurity.gates.ricketyDoorRight:
        case objectIds.strongholdOfSecurity.rewardObjects.grainOfPlenty:
            return player.savedMetadata[`strongholdOfSecurityState`].floorCompletion.catacombOfFamine;

        case objectIds.strongholdOfSecurity.gates.oozingBarrierLeft:
        case objectIds.strongholdOfSecurity.gates.oozingBarrierRight:
        case objectIds.strongholdOfSecurity.rewardObjects.boxOfHealth:
            return player.savedMetadata[`strongholdOfSecurityState`].floorCompletion.pitOfPestilence;

        case objectIds.strongholdOfSecurity.gates.thePortalOfDeathLeft:
        case objectIds.strongholdOfSecurity.gates.thePortalOfDeathRight:
        case objectIds.strongholdOfSecurity.rewardObjects.cradleOfLife:
            return player.savedMetadata[`strongholdOfSecurityState`].floorCompletion.sepulchreOfDeath;
    }
}

export const getNpcKeyFromObjectId = (objectId: number): string => {
    switch (objectId) {
        case objectIds.strongholdOfSecurity.gates.gateOfWarLeft:
        case objectIds.strongholdOfSecurity.gates.gateOfWarRight:
            return `rs:Gate_of_War`;

        case objectIds.strongholdOfSecurity.gates.ricketyDoorLeft:
        case objectIds.strongholdOfSecurity.gates.ricketyDoorRight:
            return `rs:Ricketty_door`;

        case objectIds.strongholdOfSecurity.gates.oozingBarrierLeft:
        case objectIds.strongholdOfSecurity.gates.oozingBarrierRight:
            return `rs:Oozing_barrier`;

        case objectIds.strongholdOfSecurity.gates.thePortalOfDeathLeft:
        case objectIds.strongholdOfSecurity.gates.thePortalOfDeathRight:
            return `rs:Portal_of_Death`;
    }
}


const setFloorCompletionFromObjectId = (player: Player, objectId: number, completion: boolean): void => {
    switch (objectId) {
        case objectIds.strongholdOfSecurity.rewardObjects.giftOfPeace:
            player.savedMetadata[`strongholdOfSecurityState`].floorCompletion.vaultOfWar = completion;
            break;

        case objectIds.strongholdOfSecurity.rewardObjects.grainOfPlenty:
            player.savedMetadata[`strongholdOfSecurityState`].floorCompletion.catacombOfFamine = completion;
            break;

        case objectIds.strongholdOfSecurity.rewardObjects.boxOfHealth:
            player.savedMetadata[`strongholdOfSecurityState`].floorCompletion.pitOfPestilence = completion;
            break;

        case objectIds.strongholdOfSecurity.rewardObjects.cradleOfLife:
            player.savedMetadata[`strongholdOfSecurityState`].floorCompletion.sepulchreOfDeath = completion;
            break;
    }
}

const getRewardDataFromObjectId = (objectId: number): StrongholdOfSecurityRewardData => {
    for (const key in strongholdOfSecurityRewardData) {
        const rewardData = strongholdOfSecurityRewardData[key];
        if(rewardData.objectId === objectId) {
            return rewardData;
        }
    }
}

const activate = async (task: TaskExecutor<ObjectInteractionAction>, taskIteration: number): Promise<boolean> => {
    const { player, actionData: { position, object } } = task.getDetails();

    player.face(position);

    const floorComplete = getFloorCompletionFromObjectId(player, object.objectId);

    if (floorComplete && object.objectId !== objectIds.strongholdOfSecurity.rewardObjects.cradleOfLife) {
        await dialogue([player], [
            text => ('You have already claimed your reward from this level.')
        ]);
        return true;
    }



    const completedSepulchre = player.savedMetadata[`strongholdOfSecurityState`].floorCompletion.sepulchreOfDeath;

    if (object.objectId === objectIds.strongholdOfSecurity.rewardObjects.cradleOfLife) {
        const fancyBoots = findItem(`rs:Fancy_boots`);
        const fightingBoots = findItem(`rs:Fighting_boots`);

        const lostBoots = player.savedMetadata[`strongholdOfSecurityState`].floorCompletion.sepulchreOfDeath &&
            !(player.hasItemOnPerson(fancyBoots.gameId) || player.hasItemOnPerson(fightingBoots.gameId))

        if (completedSepulchre) {
            if (lostBoots) {
                await dialogue([player], [
                    text => (`As your hand touches the cradle, you hear a voice in your head of a million dead adventurers...`),
                    (text, lost) => (`You appear to have lost your boots!`),
                    (text, welcome) => (`....welcome adventurer... you have a choice....`),
                    text => (`You can choose between these two pairs of boots.`),
                    text => (`They will both protect your feet exactly the same, however they look very different. You can always come back and get another pair if you lose them, or even swap them for the other style!`),

                    options => [
                        `I'll take the colourful ones!`, [
                            execute(() => {
                                player.giveItem(findItem(`rs:Fancy_boots`).gameId);
                            })
                        ],

                        `I'll take the fighting ones!`, [
                            execute(() => {
                                player.giveItem(findItem(`rs:Fighting_boots`).gameId);
                            })
                        ]
                    ],
                    (text, tag_congrats) => (`Congratulations! You have successfully navigated the Stronghold of Security and learned to secure your account. You have unlocked the 'Stamp Foot' emote. Remember to keep your account secure in the future!`)
                ]);
            } else {
                await dialogue([player], [
                    text => (`As your hand touches the cradle, you hear a voice in your head of a million dead adventurers...`),
                    options => [
                        `Yes, I'd like the other pair instead please!`, [
                            player => [Emote.HAPPY, `Yes, I'd like the other pair instead please!`],
                            execute(() => {
                                if (player.inventory.hasSpace()) {
                                    if (player.hasItemOnPerson(fancyBoots.gameId)) {
                                        player.removeFirstItem(fancyBoots.gameId);
                                        player.giveItem(fightingBoots.gameId);
                                    } else {
                                        player.removeFirstItem(fightingBoots.gameId);
                                        player.giveItem(fancyBoots.gameId);
                                    }
                                } else {
                                    dialogue([player], [
                                        player => [Emote.SAD, `Hmm, perhaps I should have some space in my pack before I do that.`]
                                    ])
                                }
                            }),
                        ],
                        `No thanks, I'll keep these!`, [
                            player => [Emote.SAD, `No thanks, I'll keep these!`]
                        ]
                    ]
                ]);
            }


        } else {
            await dialogue([player], [
                text => (`As your hand touches the cradle, you hear a voice in your head of a million dead adventurers...`),
                (text, welcome) => (`....welcome adventurer... you have a choice....`),
                text => (`You can choose between these two pairs of boots.`),
                text => (`They will both protect your feet exactly the same, however they look very different. You can always come back and get another pair if you lose them, or even swap them for the other style!`),

                options => [
                    `I'll take the colourful ones!`, [
                        execute(() => {
                            player.giveItem(findItem(`rs:Fancy_boots`).gameId);
                            unlockEmote(player, `STAMP`);
                            player.savedMetadata[`strongholdOfSecurityState`].floorCompletion.sepulchreOfDeath = true;
                        })
                    ],

                    `I'll take the fighting ones!`, [
                        execute(() => {
                            player.giveItem(findItem(`rs:Fighting_boots`).gameId);
                            unlockEmote(player, `STAMP`);
                            player.savedMetadata[`strongholdOfSecurityState`].floorCompletion.sepulchreOfDeath = true;
                        })
                    ]
                ],
                (text, tag_congrats) => (`Congratulations! You have successfully navigated the Stronghold of Security and learned to secure your account. You have unlocked the 'Stamp Foot' emote. Remember to keep your account secure in the future!`)
            ]);
        }
    } else {
        const dialogueData = getRewardDataFromObjectId(object.objectId);
        if(!dialogueData) {
            await player.sendMessage(`Unable to get reward information for this object. Something is wrong.`);
            return false;
        }
        await dialogue([player], [
            text => (dialogueData.initialMessage),
            text => (`...congratulations adventurer, you have been deemed worthy of this reward. You have also unlocked the ` + dialogueData.emoteUnlocked + ` emote!`),
            execute(() => {
                player.giveItem({ itemId: findItem(`rs:coins`).gameId, amount: dialogueData.amountOfGoldRewarded });
                unlockEmote(player, dialogueData.emoteUnlocked.toUpperCase());
                setFloorCompletionFromObjectId(player, object.objectId, true);
            }),
        ]);
    }

    return true;
}

const onComplete = (task: TaskExecutor<ObjectInteractionAction>): void => {

};

export default {
    pluginId: 'rs:stronghold_of_security_rewards',
    hooks: [
        {
            type: 'object_interaction',
            options: ['open', 'search'],
            objectIds: [objectIds.strongholdOfSecurity.rewardObjects.giftOfPeace,
                objectIds.strongholdOfSecurity.rewardObjects.grainOfPlenty,
                objectIds.strongholdOfSecurity.rewardObjects.boxOfHealth,
                objectIds.strongholdOfSecurity.rewardObjects.cradleOfLife],
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
