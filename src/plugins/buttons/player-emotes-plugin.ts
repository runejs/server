import { buttonAction } from '@server/world/action/button-action';
import { Player } from '@server/world/actor/player/player';
import { itemIds } from '@server/world/config/item-ids';
import { widgets } from '@server/config';

interface Emote {
    animationId: number;
    name: string;
    unlockable?: boolean;
    graphicId?: number;
}

interface SkillcapeEmote extends Emote {
    itemIds: Array<number>;
}

const { skillCapes } = itemIds;

export const skillCapeEmotes: SkillcapeEmote[]  = [
    { animationId: 4959, name: 'Attack', itemIds: [skillCapes.attack.untrimmed, skillCapes.attack.trimmed], graphicId: 823 },
    { animationId: 4981, name: 'Strength', itemIds: [skillCapes.strength.untrimmed, skillCapes.strength.trimmed], graphicId: 828 },
    { animationId: 4961, name: 'Defence', itemIds: [skillCapes.defence.untrimmed, skillCapes.defence.trimmed], graphicId: 824 },
    { animationId: 4973, name: 'Ranged', itemIds: [skillCapes.ranged.untrimmed, skillCapes.ranged.trimmed], graphicId: 832 },
    { animationId: 4979, name: 'Prayer', itemIds: [skillCapes.prayer.untrimmed, skillCapes.prayer.trimmed], graphicId: 829 },
    { animationId: 4939, name: 'Magic', itemIds: [skillCapes.magic.untrimmed, skillCapes.magic.trimmed], graphicId: 813 },
    { animationId: 4947, name: 'Runecrafting', itemIds: [skillCapes.runecrafting.untrimmed, skillCapes.runecrafting.trimmed], graphicId: 817 },
    { animationId: 4971, name: 'Constitution', itemIds: [skillCapes.constitution.untrimmed, skillCapes.constitution.trimmed], graphicId: 833 },
    { animationId: 4977, name: 'Agility', itemIds: [skillCapes.agility.untrimmed, skillCapes.agility.trimmed], graphicId: 830 },
    { animationId: 4969, name: 'Herblore', itemIds: [skillCapes.herblore.untrimmed, skillCapes.herblore.trimmed], graphicId: 835 },
    { animationId: 4965, name: 'Thieving', itemIds: [skillCapes.thieving.untrimmed, skillCapes.thieving.trimmed], graphicId: 826 },
    { animationId: 4949, name: 'Crafting', itemIds: [skillCapes.crafting.untrimmed, skillCapes.crafting.trimmed], graphicId: 818 },
    { animationId: 4937, name: 'Fletching', itemIds: [skillCapes.fletching.untrimmed, skillCapes.fletching.trimmed], graphicId: 812 },
    { animationId: 4967, name: 'Slayer', itemIds: [skillCapes.slayer.untrimmed, skillCapes.slayer.trimmed], graphicId: 827 },
    { animationId: 4953, name: 'Construction', itemIds: [skillCapes.construction.untrimmed, skillCapes.construction.trimmed], graphicId: 820 },
    { animationId: 4941, name: 'Mining', itemIds: [skillCapes.mining.untrimmed, skillCapes.mining.trimmed], graphicId: 814 },
    { animationId: 4943, name: 'Smithing', itemIds: [skillCapes.smithing.untrimmed, skillCapes.smithing.trimmed], graphicId: 815 },
    { animationId: 4951, name: 'Fishing', itemIds: [skillCapes.fishing.untrimmed, skillCapes.fishing.trimmed], graphicId: 819 },
    { animationId: 4955, name: 'Cooking', itemIds: [skillCapes.cooking.untrimmed, skillCapes.cooking.trimmed], graphicId: 821 },
    { animationId: 4975, name: 'Firemaking', itemIds: [skillCapes.firemaking.untrimmed, skillCapes.firemaking.trimmed], graphicId: 831 },
    { animationId: 4957, name: 'Woodcutting', itemIds: [skillCapes.woodcutting.untrimmed, skillCapes.woodcutting.trimmed], graphicId: 822 },
    { animationId: 4963, name: 'Farming', itemIds: [skillCapes.farming.untrimmed, skillCapes.farming.trimmed], graphicId: 825 },
    { animationId: 4945, name: 'Quest point', itemIds: [skillCapes.questpoint.untrimmed], graphicId: 816 },
];

export const emotes: { [key: number]: Emote } = {
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
    if(unlockedEmotes.indexOf(emoteName) === -1) {
        unlockedEmotes.push(emoteName);
        player.savedMetadata.unlockedEmotes = unlockedEmotes;
    }
    unlockEmotes(player);
}

export function lockEmote(player: Player, emoteName: string): void {
    const unlockedEmotes: string[] = player.savedMetadata.unlockedEmotes || [];
    const index = unlockedEmotes.indexOf(emoteName);

    if(index !== -1) {
        unlockedEmotes.splice(index, 1);
        player.savedMetadata.unlockedEmotes = unlockedEmotes;
    }

    unlockEmotes(player);
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
        if (player.getEquippedItem('back')) {
            if (skillCapeEmotes.some(item => item.itemIds.includes(player.getEquippedItem('back')?.itemId))) {
                const skillcapeEmote = skillCapeEmotes.filter(item => item.itemIds.includes(player.getEquippedItem('back')?.itemId));
                player.playAnimation(skillcapeEmote[0].animationId);
                player.playGraphics({ id: skillcapeEmote[0].graphicId, delay: 0, height: 0 });
            }
        }  else {
            player.sendMessage(`You need to be wearing a skillcape in order to perform that emote.`, true);
        }
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
            player.playGraphics({ id: emote.graphicId, height: 0 });
        }
    }
};

export default { type: 'button', widgetId: widgets.emotesTab, buttonIds, action };
