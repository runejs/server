import { defaultPlayerTabWidgets, Player, playerInitAction, Tabs } from '@server/world/actor/player/player';
import { widgets } from '@server/world/config/widget';
import { dialogue, Emote, execute } from '@server/world/actor/dialogue';
import { serverConfig, world } from '@server/game-server';
import { npcAction } from '@server/world/action/npc-action';
import { Subject } from 'rxjs';
import uuidv4 from 'uuid/v4';
import { take } from 'rxjs/operators';
import { Npc } from '@server/world/actor/npc/npc';
import { logger } from '@runejs/core';
import { Position } from '@server/world/position';
import { WorldInstance } from '@server/world/instances';
import { findNpc } from '@server/config';
import { updateCombatStyleWidget } from '@server/plugins/combat/combat-styles';


const tutorialTabWidgetOrder = [
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

function unlockAvailableTabs(player: Player, availableTabs: number): void {
    let doCombatStyleTab = false;

    for(let i = 0; i < availableTabs; i++) {
        if(tutorialTabWidgetOrder[i][1] === -1) {
            doCombatStyleTab = true;
        }
        player.outgoingPackets.sendTabWidget(tutorialTabWidgetOrder[i][0], tutorialTabWidgetOrder[i][1]);
    }

    if(doCombatStyleTab) {
        updateCombatStyleWidget(player);
    }
}

function npcHint(player: Player, npcKey: string | number): void {
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

const startTutorial = async (player: Player): Promise<void> => {
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

    await player.openInteractiveWidget({
        widgetId: widgets.characterDesign,
        type: 'SCREEN',
        disablePlayerMovement: true
    }).toPromise();
};

const stageHandler: { [key: number]: (player: Player) => void } = {
    0: async player => {
        await startTutorial(player);
        player.savedMetadata.tutorialProgress = 5;
        await handleTutorial(player);
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
        player.metadata.tabClickEvent = {
            tabIndex: Tabs.settings,
            event: new Subject<boolean>()
        };

        dialogue([ player ], [
            titled => [ `Game Options`, `The Options menu can be used to modify various game settings.\nClick the blinking icon to open the Options menu.\n\nWhen you're finished, speak with the Guide to continue.` ]
        ], {
            permanent: true
        });

        unlockAvailableTabs(player, 1);
        player.outgoingPackets.blinkTabIcon(Tabs.settings);

        player.metadata.tabClickEvent.event.pipe(take(1)).subscribe(() => {
            player.savedMetadata.tutorialProgress = 15;
            player.metadata.tabClickEvent.event.complete();
            delete player.metadata.tabClickEvent;
            handleTutorial(player);
        });
    },
    15: player => {
        npcHint(player, 'rs:runescape_guide');

        unlockAvailableTabs(player, 1);

        if(!player.activeWidget) {
            dialogue([ player ], [
                titled => [ `Getting Started`, `\nSpeak with the Guide to continue.` ]
            ], {
                permanent: true
            });
        }
    },
    20: player => {
        player.metadata.tabClickEvent = {
            tabIndex: Tabs.friends,
            event: new Subject<boolean>()
        };
        dialogue([ player ], [
            titled => [ `Friends List`, `\nKeep track of your friends via the Friends List.` ]
        ], {
            permanent: true
        });

        unlockAvailableTabs(player, 2);
        player.outgoingPackets.blinkTabIcon(Tabs.friends);

        player.metadata.tabClickEvent.event.pipe(take(1)).subscribe(() => {
            player.savedMetadata.tutorialProgress = 25;
            player.metadata.tabClickEvent.event.complete();
            delete player.metadata.tabClickEvent;
            handleTutorial(player);
        });
    },
    25: player => {
        player.metadata.tabClickEvent = {
            tabIndex: Tabs.ignoreList,
            event: new Subject<boolean>()
        };
        dialogue([ player ], [
            titled => [ `Ignore List`, `\nThe Ignore List allows you to block messages from other users.\nCheck it out by clicking the blinking icon at the bottom right.` ]
        ], {
            permanent: true
        });

        unlockAvailableTabs(player, 3);
        player.outgoingPackets.blinkTabIcon(Tabs.ignoreList);

        player.metadata.tabClickEvent.event.pipe(take(1)).subscribe(() => {
            player.savedMetadata.tutorialProgress = 30;
            player.metadata.tabClickEvent.event.complete();
            delete player.metadata.tabClickEvent;
            handleTutorial(player);
        });
    },
    30: player => {
        player.metadata.tabClickEvent = {
            tabIndex: Tabs.emotes,
            event: new Subject<boolean>()
        };
        dialogue([ player ], [
            titled => [ `Emotes`, `Perform emotes for other players via the Emotes tab.\n\nClick on the blinking Emotes tab to see the list of emotes you can perform, then speak with the Guide to continue.` ]
        ], {
            permanent: true
        });

        unlockAvailableTabs(player, 4);
        player.outgoingPackets.blinkTabIcon(Tabs.emotes);

        player.metadata.tabClickEvent.event.pipe(take(1)).subscribe(() => {
            player.savedMetadata.tutorialProgress = 35;
            player.metadata.tabClickEvent.event.complete();
            delete player.metadata.tabClickEvent;
            handleTutorial(player);
        });
    },
    35: player => {
        npcHint(player, 'rs:runescape_guide');

        unlockAvailableTabs(player, 4);

        if(!player.activeWidget) {
            dialogue([ player ], [
                titled => [ `Continue`, `\nSpeak with the Guide to continue.` ]
            ], {
                permanent: true
            });
        }
    },
    40: player => {
        player.metadata.tabClickEvent = {
            tabIndex: Tabs.music,
            event: new Subject<boolean>()
        };
        dialogue([ player ], [
            titled => [ `Music`, `Check out the music tab to view and play all of your favorite old-school RuneScape tracks!\nOnce you've unlocked them, of course.` ]
        ], {
            permanent: true
        });

        unlockAvailableTabs(player, 5);
        player.outgoingPackets.blinkTabIcon(Tabs.music);

        player.metadata.tabClickEvent.event.pipe(take(1)).subscribe(() => {
            player.savedMetadata.tutorialProgress = 45;
            player.metadata.tabClickEvent.event.complete();
            delete player.metadata.tabClickEvent;
            handleTutorial(player);
        });
    },
    45: player => {
        npcHint(player, 'rs:runescape_guide');
        unlockAvailableTabs(player, 5);

        if(!player.activeWidget) {
            dialogue([ player ], [
                titled => [ `Continue`, `\nSpeak with the Guide to continue.` ]
            ], {
                permanent: true
            });
        }
    },
    50: player => {
        player.metadata.blockObjectInteractions = false;
        npcHint(player, 'rs:melee_combat_tutor');
        unlockAvailableTabs(player, 5);

        if(!player.activeWidget) {
            dialogue([ player ], [
                titled => [ `Continue`, `\nSpeak with the Melee Combat Tutor to continue.` ]
            ], {
                permanent: true
            });
        }
    },
    55: player => {
        player.metadata.tabClickEvent = {
            tabIndex: Tabs.inventory,
            event: new Subject<boolean>()
        };

        dialogue([ player ], [
            titled => [ `Inventory`, `Your inventory contains any items held on your person that aren't equipped. Click the blinking backpack icon to open your inventory.` ]
        ], {
            permanent: true
        });

        unlockAvailableTabs(player, 6);
        player.outgoingPackets.blinkTabIcon(Tabs.inventory);

        player.metadata.tabClickEvent.event.pipe(take(1)).subscribe(() => {
            player.savedMetadata.tutorialProgress = 60;
            player.metadata.tabClickEvent.event.complete();
            delete player.metadata.tabClickEvent;
            handleTutorial(player);
        });
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
        player.metadata.tabClickEvent = {
            tabIndex: Tabs.skills,
            event: new Subject<boolean>()
        };

        dialogue([ player ], [
            titled => [ `Skills`, `You can see your character's skill levels on the Skills tab, including your current number of hitpoints. ` +
                `If your hitpoints ever reach zero, you'll die - so be careful!` ]
        ], {
            permanent: true
        });

        unlockAvailableTabs(player, 7);
        player.outgoingPackets.blinkTabIcon(Tabs.skills);

        player.metadata.tabClickEvent.event.pipe(take(1)).subscribe(() => {
            player.savedMetadata.tutorialProgress = 70;
            player.metadata.tabClickEvent.event.complete();
            delete player.metadata.tabClickEvent;
            handleTutorial(player);
        });
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
        player.metadata.tabClickEvent = {
            tabIndex: Tabs.equipment,
            event: new Subject<boolean>()
        };

        dialogue([ player ], [
            titled => [ `Equipment`, `The equipment tab contains details on everything you have equipped, as well as any stat bonuses received from your equipment.` ]
        ], {
            permanent: true
        });

        unlockAvailableTabs(player, 8);
        player.outgoingPackets.blinkTabIcon(Tabs.equipment);

        player.metadata.tabClickEvent.event.pipe(take(1)).subscribe(() => {
            player.savedMetadata.tutorialProgress = 80;
            player.metadata.tabClickEvent.event.complete();
            delete player.metadata.tabClickEvent;
            handleTutorial(player);
        });
    },
    80: player => {
        npcHint(player, 'rs:melee_combat_tutor');
        unlockAvailableTabs(player, 8);

        const goblin = world.spawnNpc('rs:goblin', new Position(3215, 3262), 'SOUTH',
            0, player.instance.instanceId);

        goblin.pathfinding.walkTo(new Position(3219, 3246), {
            pathingSearchRadius: 36,
            ignoreDestination: false
        });

        dialogue([ player ], [
            titled => [ `Continue`, `\nTalk-to the Melee Combat Tutor to continue.` ]
        ], {
            permanent: true
        });
    }
};

const guideDialogueHandler: { [key: number]: (player: Player, npc: Npc) => void } = {
    5: async (player, npc) => {
        await dialogue([ player, { npc, key: 'guide' } ], [
            guide => [ Emote.GENERIC, `Greetings adventurer, welcome to RuneScape.` ],
            player => [ Emote.SKEPTICAL, `How did I get here?...` ],
            guide => [ Emote.GENERIC, `Seems like a goblin smacked you over the head on your way in. Nasty little things.` ],
            player => [ Emote.DROWZY, `I guess that explains the headache.` ],
            guide => [ Emote.GENERIC, `I would imagine so. Now, it's my job here is to show new players around.` ],
            options => [
                `Go on.`, [
                    player => [ Emote.GENERIC, `Carry on then.` ],
                    guide => [ Emote.GENERIC, `We'll start with the Options menu. Click on the blinking spanner icon at the bottom right of your game screen.` ],
                    execute(() => {
                        player.savedMetadata.tutorialProgress = 10;
                    })
                ],
                `I know how the game works already.`, [
                    player => [ Emote.HAPPY, `This isn't my first time here, I'm good.` ],
                    guide => [ Emote.HAPPY, `Oh good, I won't tell you what you already know then.` ],
                    execute(() => {
                        player.savedMetadata.tutorialProgress = 100;
                    })
                ]
            ]
        ]);
    },
    10: async (player, npc) => {
        await dialogue([ player, { npc, key: 'guide' } ], [
            guide => [ Emote.GENERIC, 'Please click on the blinking spanner icon, then we can continue.' ]
        ]);
    },
    15: async (player, npc) => {
        await dialogue([ player, { npc, key: 'guide' } ], [
            guide => [ Emote.HAPPY, `Next we'll move on to the more social side of things. Click on the blinking icon to learn about the Friends List.` ],
            execute(() => {
                player.savedMetadata.tutorialProgress = 20;
            })
        ]);
    },
    20: async (player, npc) => {
        await dialogue([ player, { npc, key: 'guide' } ], [
            guide => [ Emote.GENERIC, `Please return to me once you've gone through all three social tabs.` ]
        ]);
    },
    25: async (player, npc) => {
        await dialogue([ player, { npc, key: 'guide' } ], [
            guide => [ Emote.GENERIC, `Please return to me once you've gone through all three social tabs.` ]
        ]);
    },
    30: async (player, npc) => {
        await dialogue([ player, { npc, key: 'guide' } ], [
            guide => [ Emote.GENERIC, `Please return to me once you've gone through all three social tabs.` ]
        ]);
    },
    35: async (player, npc) => {
        await dialogue([ player, { npc, key: 'guide' } ], [
            player => [ Emote.HAPPY, `I've gone through the Friends List and everything. When do I get to kill things?` ],
            guide => [ Emote.LAUGH, `All in good time, ${player.username}. We've a little more to discuss yet - like music!` ],
            player => [ Emote.SKEPTICAL, `Music? Doesn't everyone turn that off?` ],
            guide => [ Emote.SAD, `Some people find it nostalgic.` ],
            player => [ Emote.SAD, `Sorry, go on...` ],
            guide => [ Emote.GENERIC, `Yes... As I was saying... Music can be accessed from the music tab.`],
            execute(() => {
                player.savedMetadata.tutorialProgress = 40;
            })
        ]);
    },
    45: async (player, npc) => {
        await dialogue([ player, { npc, key: 'guide' } ], [
            player => [ Emote.HAPPY, `That music tab is pretty nostalgic, I'll give ya that.` ],
            guide => [ Emote.LAUGH, `Isn't it? Sometimes I can hear Harmony in my sleep.` ],
            player => [ Emote.WONDERING, `So what's next?` ],
            guide => [ Emote.GENERIC, `Next you'll be moving on to my friend Harlan, to learn about your inventory and skills.` ],
            player => [ Emote.HAPPY, `So I finally get to kill something?` ],
            guide => [ Emote.SAD, `That's all you adventurers ever want to do...` ],
            guide => [ Emote.GENERIC, `Oh well. Head on over to Harlan, the melee combat tutor, and I'm sure he'll show you how to kill something.` ],
            execute(() => {
                player.savedMetadata.tutorialProgress = 50;
            })
        ]);
    },
    50: async (player, npc) => {
        await dialogue([ player, { npc, key: 'guide' } ], [
            guide => [ Emote.GENERIC, `Please speak to my friend Harlan, the melee combat tutor, to continue.` ]
        ]);
    }
};

const harlanDialogueHandler: { [key: number]: (player: Player, npc: Npc) => void } = {
    50: async (player, npc) => {
        await dialogue([ player, { npc, key: 'harlan' } ], [
            harlan => [ Emote.GENERIC, `Greetings, adventurer. How can I assist you?` ],
            player => [ Emote.WONDERING, `The guide in there said you could unlock my inventory and stuff.` ],
            harlan => [ Emote.LAUGH, `I suppose I could, yes. But where's the fun in that?` ],
            player => [ Emote.SAD, `I just want to fight something.` ],
            harlan => [ Emote.GENERIC, `I'm sure you'll get the chance, what with all the recent goblin attacks on this side of the River Lum.` ],
            harlan => [ Emote.GENERIC, `To that end, let me show you your inventory.` ],
            execute(() => {
                player.savedMetadata.tutorialProgress = 55;
            })
        ]);
    },
    55: async (player, npc) => {
        await dialogue([ player, { npc, key: 'harlan' } ], [
            harlan => [ Emote.GENERIC, `Speak with me once you've opened your inventory.` ]
        ]);
    },
    60: async (player, npc) => {
        await dialogue([ player, { npc, key: 'harlan' } ], [
            player => [ Emote.SAD, `Doesn't look like I had much on me...` ],
            harlan => [ Emote.GENERIC, `I would say the goblins likely ran through your pockets before the Guard hauled you in.` ],
            harlan => [ Emote.GENERIC, `Lets check out your hitpoints and make sure you're in proper shape after that.` ],
            execute(() => {
                player.savedMetadata.tutorialProgress = 65;
            })
        ]);
    },
    65: async (player, npc) => {
        await dialogue([ player, { npc, key: 'harlan' } ], [
            harlan => [ Emote.GENERIC, `Click on your skills tab to view your hitpoints stat. It should be blinking over near your inventory.` ]
        ]);
    },
    70: async (player, npc) => {
        await dialogue([ player, { npc, key: 'harlan' } ], [
            harlan => [ Emote.GENERIC, `You appear to be in good shape. Though with a backpack like that, ` +
                `I don't think you'll make much headway against those goblins...` ],
            harlan => [ Emote.GENERIC, `I'll provide you with some starter equipment - but from there, you're on your own.` ],
            harlan => [ Emote.GENERIC, `But before I can do that, you'll need to open your Equipment tab.` ],
            execute(() => {
                player.savedMetadata.tutorialProgress = 75;
            })
        ]);
    }
};

async function handleTutorial(player: Player): Promise<void> {
    const progress = player.savedMetadata.tutorialProgress;
    const handler = stageHandler[progress];

    defaultPlayerTabWidgets.forEach((widgetId: number, tabIndex: number) => {
        if(widgetId !== -1) {
            player.outgoingPackets.sendTabWidget(tabIndex, widgetId === widgets.logoutTab ? widgetId : null);
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

export const tutorialInitAction: playerInitAction = async ({ player }) => {
    if(serverConfig.tutorialEnabled && !player.savedMetadata.tutorialComplete) {
        player.instance = new WorldInstance(uuidv4());
        player.metadata.blockObjectInteractions = true;
        spawnQuestNpcs(player);
        await handleTutorial(player);
    } else {
        defaultPlayerTabWidgets.forEach((widgetId: number, tabIndex: number) => {
            player.outgoingPackets.sendTabWidget(tabIndex, widgetId);
        });
    }
};

export default [
    {
        type: 'player_init',
        action: tutorialInitAction
    },
    {
        type: 'npc_action',
        action: npcActionFactory(guideDialogueHandler),
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
    }
];
