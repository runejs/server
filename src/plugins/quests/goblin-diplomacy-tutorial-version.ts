import { defaultPlayerTabWidgets, Player, playerInitAction, Tabs } from '@server/world/actor/player/player';
import { widgets } from '@server/world/config/widget';
import { dialogue, Emote, execute } from '@server/world/actor/dialogue';
import { serverConfig, world } from '@server/game-server';
import { npcIds } from '@server/world/config/npc-ids';
import { npcAction } from '@server/world/action/npc-action';
import { Subject } from 'rxjs';
import { take } from 'rxjs/operators';
import { Npc } from '@server/world/actor/npc/npc';
import { logger } from '@runejs/core';

function npcHint(player: Player, npcId: number): void {
    const npc = world.findNearbyNpcsById(player.position, npcId, 10)[0] || null;
    if(npc) {
        player.outgoingPackets.showNpcHintIcon(npc);
    }
}

const startTutorial = async (player: Player): Promise<void> => {
    player.savedMetadata.tutorialProgress = 0;
    player.metadata.blockObjectInteractions = true;

    defaultPlayerTabWidgets.forEach((widgetId: number, tabIndex: number) => {
        if(widgetId !== -1) {
            player.outgoingPackets.sendTabWidget(tabIndex, widgetId === widgets.logoutTab ? widgetId : null);
        }
    });

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
        npcHint(player, npcIds.questGuide);

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

        player.outgoingPackets.sendTabWidget(Tabs.settings, widgets.settingsTab);
        player.outgoingPackets.blinkTabIcon(Tabs.settings);

        player.metadata.tabClickEvent.event.pipe(take(1)).subscribe(() => {
            player.savedMetadata.tutorialProgress = 15;
            player.metadata.tabClickEvent.event.complete();
            delete player.metadata.tabClickEvent;
            handleTutorial(player);
        });
    },
    15: player => {
        npcHint(player, npcIds.questGuide);

        player.outgoingPackets.sendTabWidget(Tabs.settings, widgets.settingsTab);

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

        player.outgoingPackets.sendTabWidget(Tabs.settings, widgets.settingsTab);
        player.outgoingPackets.sendTabWidget(Tabs.friends, widgets.friendsList);
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

        player.outgoingPackets.sendTabWidget(Tabs.settings, widgets.settingsTab);
        player.outgoingPackets.sendTabWidget(Tabs.friends, widgets.friendsList);
        player.outgoingPackets.sendTabWidget(Tabs.ignoreList, widgets.ignoreList);
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

        player.outgoingPackets.sendTabWidget(Tabs.settings, widgets.settingsTab);
        player.outgoingPackets.sendTabWidget(Tabs.friends, widgets.friendsList);
        player.outgoingPackets.sendTabWidget(Tabs.ignoreList, widgets.ignoreList);
        player.outgoingPackets.sendTabWidget(Tabs.emotes, widgets.emotesTab);
        player.outgoingPackets.blinkTabIcon(Tabs.emotes);

        player.metadata.tabClickEvent.event.pipe(take(1)).subscribe(() => {
            player.savedMetadata.tutorialProgress = 35;
            player.metadata.tabClickEvent.event.complete();
            delete player.metadata.tabClickEvent;
            handleTutorial(player);
        });
    },
    35: player => {
        npcHint(player, npcIds.questGuide);

        player.outgoingPackets.sendTabWidget(Tabs.settings, widgets.settingsTab);
        player.outgoingPackets.sendTabWidget(Tabs.friends, widgets.friendsList);
        player.outgoingPackets.sendTabWidget(Tabs.ignoreList, widgets.ignoreList);
        player.outgoingPackets.sendTabWidget(Tabs.emotes, widgets.emotesTab);

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

        player.outgoingPackets.sendTabWidget(Tabs.settings, widgets.settingsTab);
        player.outgoingPackets.sendTabWidget(Tabs.friends, widgets.friendsList);
        player.outgoingPackets.sendTabWidget(Tabs.ignoreList, widgets.ignoreList);
        player.outgoingPackets.sendTabWidget(Tabs.emotes, widgets.emotesTab);
        player.outgoingPackets.sendTabWidget(Tabs.music, widgets.musicPlayerTab);
        player.outgoingPackets.blinkTabIcon(Tabs.music);

        player.metadata.tabClickEvent.event.pipe(take(1)).subscribe(() => {
            player.savedMetadata.tutorialProgress = 45;
            player.metadata.tabClickEvent.event.complete();
            delete player.metadata.tabClickEvent;
            handleTutorial(player);
        });
    },
    45: player => {
        npcHint(player, npcIds.questGuide);

        player.outgoingPackets.sendTabWidget(Tabs.settings, widgets.settingsTab);
        player.outgoingPackets.sendTabWidget(Tabs.friends, widgets.friendsList);
        player.outgoingPackets.sendTabWidget(Tabs.ignoreList, widgets.ignoreList);
        player.outgoingPackets.sendTabWidget(Tabs.emotes, widgets.emotesTab);
        player.outgoingPackets.sendTabWidget(Tabs.music, widgets.musicPlayerTab);

        if(!player.activeWidget) {
            dialogue([ player ], [
                titled => [ `Continue`, `\nSpeak with the Guide to continue.` ]
            ], {
                permanent: true
            });
        }
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
        return Promise.resolve();
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

export const guideAction: npcAction = async (details) => {
    if(!serverConfig.tutorialEnabled) {
        return;
    }

    const { player, npc } = details;

    const progress = player.savedMetadata.tutorialProgress;
    const dialogueHandler = guideDialogueHandler[progress];
    if(dialogueHandler) {
        try {
            await dialogueHandler(player, npc);
        } catch(e) {
            logger.error(e);
        }

        await handleTutorial(player);
    }
};

export const tutorialInitAction: playerInitAction = async ({ player }) => {
    if(serverConfig.tutorialEnabled && !player.metadata.tutorialComplete) {
        await handleTutorial(player);
    } else {
        defaultPlayerTabWidgets.forEach((widgetId: number, tabIndex: number) =>
            this.outgoingPackets.sendTabWidget(tabIndex, widgetId));
    }
};

export default [{
    type: 'player_init',
    action: tutorialInitAction
}, {
    type: 'npc_action',
    action: guideAction,
    npcIds: npcIds.runescapeGuide,
    walkTo: true
}];
