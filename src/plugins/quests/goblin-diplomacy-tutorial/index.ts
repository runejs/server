import { defaultPlayerTabWidgets, Player, playerInitAction, Tabs } from '@server/world/actor/player/player';
import { widgets } from '@server/world/config/widget';
import { serverConfig, world } from '@server/game-server';
import { npcAction } from '@server/world/action/npc-action';
import uuidv4 from 'uuid/v4';
import { Npc } from '@server/world/actor/npc/npc';
import { logger } from '@runejs/core';
import { Position } from '@server/world/position';
import { WorldInstance } from '@server/world/instances';
import { findNpc } from '@server/config';
import { updateCombatStyleWidget } from '@server/plugins/combat/combat-styles';
import { runescapeGuideDialogueHandler } from '@server/plugins/quests/goblin-diplomacy-tutorial/runescape-guide-dialogue';
import { harlanDialogueHandler } from '@server/plugins/quests/goblin-diplomacy-tutorial/melee-tutor-dialogue';
import { goblinDiplomacyStageHandler } from '@server/plugins/quests/goblin-diplomacy-tutorial/stage-handler';
import { Subject } from 'rxjs';
import { dialogue } from '@server/world/actor/dialogue';
import { take } from 'rxjs/operators';
import { equipAction } from '@server/world/action/equip-action';


export const tutorialTabWidgetOrder = [
    [ Tabs.settings, widgets.settingsTab ],
    [ Tabs.friends, widgets.friendsList ],
    [ Tabs.ignoreList, widgets.ignoreList ],
    [ Tabs.emotes, widgets.emotesTab ],
    [ Tabs.music, widgets.musicPlayerTab ],
    [ Tabs.inventory, widgets.inventory.widgetId ],
    [ Tabs.skills, widgets.skillsTab ],
    [ Tabs.equipment, widgets.equipment.widgetId ],
    [ Tabs.combatStyle, -1 ],
    // @TODO prayer, magic,
];

export function showTabWidgetHint(player: Player, tabIndex: number, availableTabs: number, finalProgress: number, helpTitle: string, helpText: string): void {
    player.metadata.tabClickEvent = {
        tabIndex,
        event: new Subject<boolean>()
    };

    dialogue([ player ], [
        titled => [ helpTitle, helpText ]
    ], {
        permanent: true
    });

    unlockAvailableTabs(player, availableTabs);
    player.outgoingPackets.blinkTabIcon(tabIndex);

    player.metadata.tabClickEvent.event.pipe(take(1)).subscribe(async () => {
        player.savedMetadata.tutorialProgress = finalProgress;
        player.metadata.tabClickEvent.event.complete();
        delete player.metadata.tabClickEvent;
        await handleTutorial(player);
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

    const npc = world.findNpcsById(npcKey as number, player.instance.instanceId)[0] || null;

    if(npc) {
        player.outgoingPackets.showNpcHintIcon(npc);
    }
}

export const startTutorial = async (player: Player): Promise<void> => {
    player.savedMetadata.tutorialProgress = 0;

    defaultPlayerTabWidgets.forEach((widgetId: number, tabIndex: number) => {
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

    await player.openInteractiveWidget({
        widgetId: widgets.characterDesign,
        type: 'SCREEN',
        disablePlayerMovement: true
    }).toPromise();
};

export async function spawnGoblinBoi(player: Player, spawnPoint: 'beginning' | 'end'): Promise<void> {
    const nearbyGoblins = world.findNpcsByKey('rs:goblin', player.instance.instanceId);
    if(nearbyGoblins && nearbyGoblins.length > 0) {
        // Goblin is already spawned, do nothing
        return;
    }

    // Spawn the goblin where it needs to be :)
    if(spawnPoint === 'beginning') {
        //const goblin = await world.spawnNpc('rs:goblin', new Position(3219, 3246), 'SOUTH',
        //    0, player.instance.instanceId);
        const goblin = await world.spawnNpc('rs:goblin', new Position(3221, 3257), 'SOUTH',
            0, player.instance.instanceId);

        goblin.pathfinding.walkTo(new Position(3219, 3246), {
            pathingSearchRadius: 16,
            ignoreDestination: false
        });
    } else {
        await world.spawnNpc('rs:goblin', new Position(3219, 3246), 'SOUTH',
            0, player.instance.instanceId);
    }
}

export async function handleTutorial(player: Player): Promise<void> {
    const progress = player.savedMetadata.tutorialProgress;
    const handler = goblinDiplomacyStageHandler[progress];

    defaultPlayerTabWidgets.forEach((widgetId: number, tabIndex: number) => {
        if(widgetId !== -1) {
            player.setSidebarWidget(tabIndex, widgetId === widgets.logoutTab ? widgetId : null);
        }
    });

    if(handler) {
        player.outgoingPackets.resetNpcHintIcon();
        await handler(player);
    }
}

function npcActionFactory(npcDialogueHandler: { [key: number]: (player: Player, npc: Npc) => void }): npcAction {
    return async({ player, npc }) => {
        if(!serverConfig.tutorialEnabled) {
            return;
        }

        const progress = player.savedMetadata.tutorialProgress;
        const dialogueHandler = npcDialogueHandler[progress];
        if(dialogueHandler) {
            try {
                await dialogueHandler(player, npc);
            } catch(e) {
                logger.error(e);
            }

            await handleTutorial(player);
        }
    };
}

function spawnQuestNpcs(player: Player): void {
    world.spawnNpc('rs:runescape_guide', new Position(3230, 3238), 'SOUTH', 2, player.instance.instanceId);
    world.spawnNpc('rs:melee_combat_tutor', new Position(3219, 3238), 'EAST', 1, player.instance.instanceId);
}

const tutorialInitAction: playerInitAction = async ({ player }) => {
    if(serverConfig.tutorialEnabled && !player.savedMetadata.tutorialComplete) {
        player.instance = new WorldInstance(uuidv4());
        player.metadata.blockObjectInteractions = true;
        spawnQuestNpcs(player);
        await handleTutorial(player);
    } else {
        defaultPlayerTabWidgets.forEach((widgetId: number, tabIndex: number) => {
            if(widgetId !== -1) {
                player.setSidebarWidget(tabIndex, widgetId);
            }
        });
    }
};

const trainingSwordEquipAction: equipAction = async ({ player, itemDetails }) => {
    const progress = player.savedMetadata.tutorialProgress || 0;

    if(progress === 85) {
        const swordEquipped = player.isItemEquipped('rs:training_sword');
        const shieldEquipped = player.isItemEquipped('rs:training_shield');

        if((itemDetails.key === 'rs:training_sword' && shieldEquipped) ||
            (itemDetails.key === 'rs:training_shield' && swordEquipped)) {
            player.savedMetadata.tutorialProgress = 90;
            await handleTutorial(player);
        }
    }
};

export default [
    {
        type: 'player_init',
        action: tutorialInitAction
    },
    {
        type: 'npc_action',
        action: npcActionFactory(runescapeGuideDialogueHandler),
        npcs: 'rs:runescape_guide',
        options: 'talk-to',
        walkTo: true
    },
    {
        type: 'npc_action',
        action: npcActionFactory(harlanDialogueHandler),
        npcs: 'rs:melee_combat_tutor',
        options: 'talk-to',
        walkTo: true
    },
    {
        type: 'equip_action',
        equipType: 'EQUIP',
        action: trainingSwordEquipAction,
        itemIds: [ 9703, 9704 ]
    }
];
