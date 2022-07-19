import { dialogue } from '@engine/world/actor/dialogue';
import {
    tutorialHandler,
    npcHint, showTabWidgetHint, spawnGoblinBoi,
    startTutorial,
    unlockAvailableTabs
} from '@plugins/quests/goblin-diplomacy-tutorial/goblin-diplomacy-quest.plugin';
import { schedule } from '@engine/world/task';
import { findNpc } from '@engine/config/config-handler';
import { Cutscene } from '@engine/world/actor/player/cutscenes';
import { soundIds } from '@engine/world/config/sound-ids';
import { QuestStageHandler } from '@engine/config/quest-config';
import { tabIndex } from '@engine/interface';
import { activeWorld } from '@engine/world';

export const goblinDiplomacyStageHandler: QuestStageHandler = {
    0: async player => {
        await startTutorial(player);
        player.setQuestProgress('tyn:goblin_diplomacy', 5);
        await tutorialHandler(player);
    },
    5: async player => {
        npcHint(player, 'rs:runescape_guide');

        await dialogue([ player ], [
            titled => [ `Getting Started`, `\nWelcome to RuneScape!\nSpeak with the Guide to begin your journey.` ]
        ], {
            permanent: true
        });
    },
    10: player => {
        showTabWidgetHint(player, tabIndex['settings'], 1, 15,
            `Game Options`,
            `The Options menu can be used to modify various game settings.\n` +
                `Click the blinking icon to open the Options menu.\n\n` +
                `When you're finished, speak with the Guide to continue.`);
    },
    15: player => {
        npcHint(player, 'rs:runescape_guide');

        unlockAvailableTabs(player, 1);

        dialogue([ player ], [
            titled => [ `Getting Started`, `\nSpeak with the Guide to continue.` ]
        ], {
            permanent: true
        });
    },
    20: player => {
        showTabWidgetHint(player, tabIndex['friends'], 2, 25,
            `Friends List`, `\nKeep track of your friends via the Friends List.`);
    },
    25: player => {
        showTabWidgetHint(player, tabIndex['ignores'], 3, 30,
            `Ignore List`,
            `\nThe Ignore List allows you to block messages from other users.\n` +
                `Check it out by clicking the blinking icon at the bottom right.`);
    },
    30: player => {
        showTabWidgetHint(player, tabIndex['emotes'], 4, 35,
            `Emotes`,
            `Perform emotes for other players via the Emotes tab.\n\n` +
                `Click on the blinking Emotes tab to see the list of emotes you can perform, then speak with the Guide to continue.`);
    },
    35: player => {
        npcHint(player, 'rs:runescape_guide');

        unlockAvailableTabs(player, 4);

        dialogue([ player ], [
            titled => [ `Continue`, `\nSpeak with the Guide to continue.` ]
        ], {
            permanent: true
        });
    },
    40: player => {
        showTabWidgetHint(player, tabIndex['music'], 5, 45,
            `Music`,
            `Check out the music tab to view and play all of your favorite RuneScape tracks!\n` +
                `Once you've unlocked them, of course.`);
    },
    45: player => {
        npcHint(player, 'rs:runescape_guide');
        unlockAvailableTabs(player, 5);

        dialogue([ player ], [
            titled => [ `Continue`, `\nSpeak with the Guide to continue.` ]
        ], {
            permanent: true
        });
    },
    50: player => {
        player.metadata.blockObjectInteractions = false;
        npcHint(player, 'rs:melee_combat_tutor');
        unlockAvailableTabs(player, 5);

        dialogue([ player ], [
            titled => [ `Continue`, `\nSpeak with the Melee Combat Tutor to continue.` ]
        ], {
            permanent: true
        });
    },
    55: player => {
        showTabWidgetHint(player, tabIndex['inventory'], 6, 60,
            `Inventory`,
            `Your inventory contains any items held on your person that aren't equipped. ` +
                `Click the blinking backpack icon to open your inventory.`);
    },
    60: player => {
        npcHint(player, 'rs:melee_combat_tutor');
        unlockAvailableTabs(player, 6);

        dialogue([ player ], [
            titled => [ `Continue`, `\nTalk-to the Melee Combat Tutor to continue.` ]
        ], {
            permanent: true
        });
    },
    65: player => {
        showTabWidgetHint(player, tabIndex['skills'], 7, 70,
            `Skills`,
            `You can see your character's skill levels on the Skills tab, including your current number of hitpoints. ` +
                `If your hitpoints ever reach zero, you'll die - so be careful!`);
    },
    70: player => {
        npcHint(player, 'rs:melee_combat_tutor');
        unlockAvailableTabs(player, 7);

        dialogue([ player ], [
            titled => [ `Continue`, `\nTalk-to the Melee Combat Tutor to continue.` ]
        ], {
            permanent: true
        });
    },
    75: player => {
        showTabWidgetHint(player, tabIndex['equipment'], 8, 80,
            `Equipment`,
            `The equipment tab contains details on everything you have equipped, as well as any stat ` +
                `bonuses received from your equipment.`);
    },
    80: player => {
        npcHint(player, 'rs:melee_combat_tutor');
        unlockAvailableTabs(player, 8);

        dialogue([ player ], [
            titled => [ `Continue`, `\nTalk-to the Melee Combat Tutor to continue.` ]
        ], {
            permanent: true
        });
    },
    85: player => {
        unlockAvailableTabs(player, 8);

        dialogue([ player ], [
            titled => [ `Continue`, `\nEquip the Training sword and shield.` ]
        ], {
            permanent: true
        });
    },
    90: async player => {
        npcHint(player, 'rs:melee_combat_tutor');
        unlockAvailableTabs(player, 8);

        dialogue([ player ], [
            titled => [ `Continue`, `\nTalk-to the Melee Combat Tutor to continue.` ]
        ], {
            permanent: true
        });

        // @TODO vvv this is all placeholder code for the cutscene that will be needed later :)
        await spawnGoblinBoi(player, 'beginning');

        await schedule(10);

        const cameraX = 3219;
        const cameraY = 3240;
        const cameraHeight = 320;
        const lookX = 3219;
        const lookY = 3246;
        const lookHeight = 300;
        const speed = 0;
        const acceleration = 64;

        player.cutscene = new Cutscene(player);
        player.cutscene.snapCameraTo(cameraX, cameraY, cameraHeight, speed, acceleration);
        player.cutscene.lookAt(lookX, lookY, lookHeight, speed, acceleration);

        await schedule(3);

        const goblinDetails = findNpc('rs:goblin');
        let anim = goblinDetails.combatAnimations.attack;
        if(Array.isArray(anim)) {
            anim = anim[0];
        }
        activeWorld.findNpcsByKey('rs:goblin', player.instance.instanceId)[0].playAnimation(anim);
        player.playSound(soundIds.npc.human.maleDefence, 5);
    }
};
