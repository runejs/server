import { objectIds } from '@engine/world/config/object-ids';

export const strongholdOfSecurityRewardData = {
    vaultOfWar: {
        objectId: objectIds.strongholdOfSecurity.rewardObjects.giftOfPeace,
        initialMessage: `The box hinges creak and appear to be forming audible words....`,
        emoteUnlocked: `Flap`,
        amountOfGoldRewarded: 2000
    },
    catacombOfFamine: {
        objectId: objectIds.strongholdOfSecurity.rewardObjects.grainOfPlenty,
        initialMessage: `The wheat shifts in the sack, sighing audible words....`,
        emoteUnlocked: `Slap Head`,
        amountOfGoldRewarded: 3000
    },
    pitOfPestilence: {
        objectId: objectIds.strongholdOfSecurity.rewardObjects.boxOfHealth,
        initialMessage: `The box hinges creak and appear to be forming audible words....`,
        emoteUnlocked: `Idea`,
        amountOfGoldRewarded: 5000
    }
}
