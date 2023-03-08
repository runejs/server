import { defaultPlayerTabWidgets, Player } from '@engine/world/actor/player/player';
import { questDialogueActionFactory, QuestJournalHandler } from '@engine/config/quest-config';
import { serverConfig } from '@server/game/game-server';
import uuidv4 from 'uuid/v4';
import { logger } from '@runejs/common';
import { Position } from '@engine/world/position';
import { WorldInstance } from '@engine/world/instances';
import { findNpc, widgets } from '@engine/config/config-handler';
import { updateCombatStyleWidget } from '@plugins/combat/combat-styles.plugin';
import { Subject } from 'rxjs';
import { dialogue } from '@engine/world/actor/dialogue';
import { take } from 'rxjs/operators';
import { equipmentChangeActionHandler } from '@engine/action';
import { buttonActionHandler } from '@engine/action';
import { tabIndex } from '@engine/interface';
import { runescapeGuideDialogueHandler } from './runescape-guide-dialogue';
import { harlanDialogueHandler } from './melee-tutor-dialogue';
import { goblinDiplomacyStageHandler } from './stage-handler';
import { Quest } from '@engine/world/actor/player/quest';
import { playerInitActionHandler } from '@engine/action';
import { activeWorld } from '@engine/world';


export const tutorialTabWidgetOrder = [
    [ tabIndex['settings'], widgets.settingsTab ],
    [ tabIndex['friends'], widgets.friendsList ],
    [ tabIndex['ignores'], widgets.ignoreList ],
    [ tabIndex['emotes'], widgets.emotesTab ],
    [ tabIndex['music'], widgets.musicPlayerTab ],
    [ tabIndex['inventory'], widgets.inventory.widgetId ],
    [ tabIndex['skills'], widgets.skillsTab ],
    [ tabIndex['equipment'], widgets.equipment.widgetId ],
    [ tabIndex['combat'], -1 ],
    // @TODO prayer, magic,
];

export function showTabWidgetHint(player: Player, tabIndex: number, availableTabs: number, finalProgress: number, helpTitle: string, helpText: string): void {
    const tabClickEvent = {
        tabIndex,
        event: new Subject<boolean>()
    };
    player.metadata.tabClickEvent = tabClickEvent;

    dialogue([ player ], [
        titled => [ helpTitle, helpText ]
    ], {
        permanent: true
    });

    unlockAvailableTabs(player, availableTabs);
    player.outgoingPackets.blinkTabIcon(tabIndex);

    tabClickEvent.event.pipe(take(1)).subscribe(async () => {
        player.setQuestProgress('tyn:goblin_diplomacy', finalProgress);
        tabClickEvent.event.complete();
        delete player.metadata.tabClickEvent;
        await tutorialHandler(player);
    });
}

export function unlockAvailableTabs(player: Player, availableTabs?: number): void {
    let doCombatStyleTab = false;

    if(availableTabs === undefined) {
        availableTabs = tutorialTabWidgetOrder.length;
    }
    for(let i = 0; i < availableTabs; i++) {
        if(tutorialTabWidgetOrder[i][1] === -1) {
            doCombatStyleTab = true;
        }
        player.setSidebarWidget(tutorialTabWidgetOrder[i][0], tutorialTabWidgetOrder[i][1]);
    }

    if(doCombatStyleTab) {
        updateCombatStyleWidget(player);
    }
}

export function npcHint(player: Player, npcKey: string | number): void {
    if(typeof npcKey === 'string') {
        const npc = findNpc(npcKey) || null;
        if(!npc) {
            logger.warn(`Can not provide NPC hint; NPC ${npcKey} is not yet registered on the server.`);
            return;
        }

        npcKey = npc.gameId;
    }

    const npc = activeWorld.findNpcsById(npcKey as number, player.instance.instanceId)[0] || null;

    if(npc) {
        player.outgoingPackets.showNpcHintIcon(npc);
    }
}

export const startTutorial = async (player: Player): Promise<void> => {
    player.setQuestProgress('tyn:goblin_diplomacy', 0);

    defaultPlayerTabWidgets().forEach((widgetId: number, tabIndex: number) => {
        if(widgetId !== -1) {
            player.outgoingPackets.sendTabWidget(tabIndex, widgetId === widgets.logoutTab ? widgetId : null);
        }
    });

    player.inventory.add('rs:pot');
    player.inventory.add('rs:logs');
    player.inventory.add('rs:bones');
    player.inventory.add('rs:coins');
    player.inventory.add('rs:coins');
    player.inventory.add('rs:coins');
    player.outgoingPackets.sendUpdateAllWidgetItems(widgets.inventory, player.inventory);

    await dialogue([ player ], [
        titled => [ `Getting Started`, `\nCreate your character!` ]
    ], {
        permanent: true
    });

    player.interfaceState.openWidget(widgets.characterDesign, {
        slot: 'screen'
    });

    await player.interfaceState.widgetClosed('screen');
};

export async function spawnGoblinBoi(player: Player, spawnPoint: 'beginning' | 'end'): Promise<void> {
    const nearbyGoblins = activeWorld.findNpcsByKey('rs:goblin', player.instance.instanceId);
    if(nearbyGoblins && nearbyGoblins.length > 0) {
        // Goblin is already spawned, do nothing
        return;
    }

    // Spawn the goblin where it needs to be :)
    if(spawnPoint === 'beginning') {
        //const goblin = await world.spawnNpc('rs:goblin', new Position(3219, 3246), 'SOUTH',
        //    0, player.instance.instanceId);
        const goblin = await activeWorld.spawnNpc('rs:goblin', new Position(3221, 3257), 'SOUTH',
            0, player.instance.instanceId);

        goblin.pathfinding.walkTo(new Position(3219, 3246), {
            pathingSearchRadius: 16,
            ignoreDestination: false
        });
    } else {
        await activeWorld.spawnNpc('rs:goblin', new Position(3219, 3246), 'SOUTH',
            0, player.instance.instanceId);
    }
}

export async function tutorialHandler(player: Player): Promise<void> {
    const progress = player.getQuest('tyn:goblin_diplomacy').progress;
    const handler = goblinDiplomacyStageHandler[progress];

    defaultPlayerTabWidgets().forEach((widgetId: number, tabIndex: number) => {
        if(widgetId !== -1) {
            player.setSidebarWidget(tabIndex, widgetId === widgets.logoutTab ? widgetId : null);
        }
    });

    if(handler) {
        player.outgoingPackets.resetNpcHintIcon();
        await handler(player);
    }
}

function spawnQuestNpcs(player: Player): void {
    activeWorld.spawnNpc('rs:runescape_guide', new Position(3230, 3238), 'SOUTH', 2, player.instance.instanceId);
    activeWorld.spawnNpc('rs:melee_combat_tutor', new Position(3219, 3238), 'EAST', 1, player.instance.instanceId);
}

const tutorialInitAction: playerInitActionHandler = async ({ player }) => {
    if(serverConfig.tutorialEnabled && !player.savedMetadata.tutorialComplete) {
        player.instance = new WorldInstance(uuidv4());
        player.metadata.blockObjectInteractions = true;
        spawnQuestNpcs(player);
        await tutorialHandler(player);
    } else {
        defaultPlayerTabWidgets().forEach((widgetId: number, tabIndex: number) => {
            if(widgetId !== -1) {
                player.setSidebarWidget(tabIndex, widgetId);
            }
        });
    }
};

const trainingSwordEquipAction: equipmentChangeActionHandler = async ({ player, itemDetails }) => {
    const progress = player.getQuest('tyn:goblin_diplomacy').progress;

    if(progress === 85) {
        const swordEquipped = player.isItemEquipped('rs:training_sword');
        const shieldEquipped = player.isItemEquipped('rs:training_shield');

        if((itemDetails.key === 'rs:training_sword' && shieldEquipped) ||
            (itemDetails.key === 'rs:training_shield' && swordEquipped)) {
            player.setQuestProgress('tyn:goblin_diplomacy', 90);
            await tutorialHandler(player);
        }
    }
};

const createCharacterAction: buttonActionHandler = ({ player }): void => {
    player.interfaceState.closeAllSlots();
};

const journalHandler: QuestJournalHandler = {

    0: `stinkyu hoomsn HAHA\n\n\nf1nglewuRt`

};


const QUEST_ID = 'tyn:goblin_diplomacy';

const QUEST = new Quest({
    id: QUEST_ID,
    questTabId: 28,
    name: `Goblin Diplomacy`,
    points: 1,
    journalHandler,
    onComplete: {
        questCompleteWidget: {
            rewardText: [ 'A training sword & shield' ],
            itemId: 9703,
            modelZoom: 200,
            modelRotationX: 0,
            modelRotationY: 180
        }
    }
});


/**
 * Custom Goblin Diplomacy tutorial quest!
 */
export default {
    pluginId: 'tyn:goblin_diplomacy_quest',
    quests: [ QUEST ],
    hooks: [
        {
            type: 'player_init',
            handler: tutorialInitAction
        },
        {
            type: 'npc_interaction',
            handler: questDialogueActionFactory(QUEST_ID, runescapeGuideDialogueHandler, tutorialHandler),
            npcs: 'rs:runescape_guide',
            options: 'talk-to',
            walkTo: true
        },
        {
            type: 'npc_interaction',
            handler: questDialogueActionFactory(QUEST_ID, harlanDialogueHandler, tutorialHandler),
            npcs: 'rs:melee_combat_tutor',
            options: 'talk-to',
            walkTo: true
        },
        {
            type: 'equipment_change',
            eventType: 'equip',
            handler: trainingSwordEquipAction,
            itemIds: [ 9703, 9704 ]
        },
        {
            type: 'button',
            widgetId: widgets.characterDesign,
            handler: createCharacterAction
        }
    ]
};
