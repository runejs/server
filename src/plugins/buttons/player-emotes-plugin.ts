import { buttonAction } from '@server/world/actor/player/action/button-action';
import { ActionType, RunePlugin } from '@server/plugins/plugin';
import { widgets } from '@server/world/config/widget';
import { Player } from '@server/world/actor/player/player';

interface Emote {
    animationId: number;
    name: string;
    unlockable?: boolean;
    graphicId?: number;
}

export const emotes: { [key:number]: Emote } = {
    1:  { animationId: 855,  name: 'YES' },
    2:  { animationId: 856,  name: 'NO' },
    3:  { animationId: 858,  name: 'BOW' },
    4:  { animationId: 859,  name: 'ANGRY' },
    5:  { animationId: 857,  name: 'THINKING' },
    6:  { animationId: 863,  name: 'WAVE' },
    7:  { animationId: 2113, name: 'SHRUG' },
    8:  { animationId: 862,  name: 'CHEER' },
    9:  { animationId: 864,  name: 'BECKON' },
    10: { animationId: 861,  name: 'LAUGH' },
    11: { animationId: 2109, name: 'JUMP FOR JOY' },
    12: { animationId: 2111, name: 'YAWN' },
    13: { animationId: 866,  name: 'DANCE' },
    14: { animationId: 2106, name: 'JIG' },
    15: { animationId: 2107, name: 'SPIN' },
    16: { animationId: 2108, name: 'HEADBANG' },
    17: { animationId: 860,  name: 'CRY' },
    18: { animationId: 1368, name: 'BLOW KISS' },
    19: { animationId: 2105, name: 'PANIC' },
    20: { animationId: 2110, name: 'RASPBERRY' },
    21: { animationId: 865,  name: 'CLAP' },
    22: { animationId: 2112, name: 'SALUTE' },
    23: { animationId: 2127, name: 'GOBLIN BOW', unlockable: true },
    24: { animationId: 2128, name: 'GOBLIN SALUTE', unlockable: true },
    25: { animationId: 1131, name: 'GLASS BOX', unlockable: true },
    26: { animationId: 1130, name: 'CLIMB ROPE', unlockable: true },
    27: { animationId: 1129, name: 'LEAN', unlockable: true },
    28: { animationId: 1128, name: 'GLASS WALL', unlockable: true },
    32: { animationId: 4276, name: 'IDEA', unlockable: true, graphicId: 712 },
    30: { animationId: 4278, name: 'STAMP', unlockable: true },
    31: { animationId: 4280, name: 'FLAP', unlockable: true },
    29: { animationId: 4275, name: 'FACEPALM', unlockable: true },
    33: { animationId: 3544, name: 'ZOMBIE WALK', unlockable: true },
    34: { animationId: 3543, name: 'ZOMBIE DANCE', unlockable: true },
    35: { animationId: 2836, name: 'SCARED', unlockable: true },
    36: { animationId: 6111, name: 'RABBIT HOP', unlockable: true }, // @TODO missing in 435 cache???
    37: { animationId: -1, name: 'SKILLCAPE' }, // @TODO skillcape emotes
};

export function unlockEmote(player: Player, emoteName: string): void {
    const unlockedEmotes: string[] = player.savedMetadata.unlockedEmotes || [];
    unlockedEmotes.push(emoteName);
    player.savedMetadata.unlockedEmotes = unlockedEmotes;
    unlockEmotes(player);
}

export function lockEmote(player: Player, emoteName: string): void {
    const unlockedEmotes: string[] = player.savedMetadata.unlockedEmotes || [];
    const index = unlockedEmotes.indexOf(emoteName);

    if(index !== -1) {
        unlockedEmotes.splice(index, 1);
        player.savedMetadata.unlockedEmotes = unlockedEmotes;
        unlockEmotes(player);
    }
}

export function unlockEmotes(player: Player): void {
    let sosConfig = 0;
    let eventConfig = 0;
    let goblinConfig = 0;

    const unlockedEmotes: string[] = player.savedMetadata.unlockedEmotes || [];

    for(const name of unlockedEmotes) {
        if((name === 'GOBLIN BOW' || name === 'GOBLIN SALUTE') && goblinConfig === 0)
            goblinConfig += 7;
        if(name === 'FLAP')
            sosConfig += 1;
        if(name === 'FACEPALM')
            sosConfig += 2;
        if(name === 'IDEA')
            sosConfig += 4;
        if(name === 'STAMP')
            sosConfig += 8;
        if(name === 'GLASS WALL')
            eventConfig += 1;
        if(name === 'GLASS BOX')
            eventConfig += 2;
        if(name === 'CLIMB ROPE')
            eventConfig += 4;
        if(name === 'LEAN')
            eventConfig += 8;
        if(name === 'SCARED')
            eventConfig += 16;
        if(name === 'ZOMBIE DANCE')
            eventConfig += 32;
        if(name === 'ZOMBIE WALK')
            eventConfig += 64;
        if(name === 'RABBIT HOP')
            eventConfig += 128;
        if(name === 'SKILLCAPE')
            eventConfig += 256;
    }

    player.outgoingPackets.updateClientConfig(465, goblinConfig);
    player.outgoingPackets.updateClientConfig(802, sosConfig);
    player.outgoingPackets.updateClientConfig(313, eventConfig);
}

const buttonIds = Object.keys(emotes).map(v => parseInt(v));

export const action: buttonAction = (details) => {
    const { player, buttonId } = details;

    const emote = emotes[buttonId];

    if(emote.name === 'SKILLCAPE') {
        player.outgoingPackets.chatboxMessage(`You need to be wearing a skillcape in order to perform that emote.`);
    } else {
        if(emote.unlockable) {
            const unlockedEmotes: string[] = player.savedMetadata.unlockedEmotes || [];

            if(unlockedEmotes.indexOf(emote.name) === -1) {
                player.sendMessage(`You have not unlocked this emote.`, true);
                return;
            }
        }

        player.playAnimation(emote.animationId);

        if(emote.graphicId !== undefined) {
            player.playGraphics({id: emote.graphicId, height: 0});
        }
    }
};

export default new RunePlugin({ type: ActionType.BUTTON, widgetId: widgets.emotesTab, buttonIds, action });
