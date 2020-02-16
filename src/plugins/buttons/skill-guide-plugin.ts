import { buttonAction, ButtonActionPlugin } from '@server/world/mob/player/action/button-action';

const attackGuide: any[] = [
    {
        itemId: 1205,
        text: 'Bronze Weapons',
        level: 1
    },
    {
        itemId: 1203,
        text: 'Iron Weapons',
        level: 1
    }
];

const guides = {
    8654: attackGuide,
    //8668 firemaking
};

const buttonIds = Object.keys(guides).map(Number);

export const action: buttonAction = (details) => {
    const { player, buttonId } = details;

    const sidebarIds = [8849,8846,8823,8824,8827,8837,8840,8843,8859,8862,8865,15303,15306,15309];
    sidebarIds.forEach(i => player.packetSender.updateInterfaceString(i, ''));

    const guide: any[] = guides[buttonId];
    const itemIds: number[] = guide.map(g => g.itemId);
    player.packetSender.sendUpdateAllInterfaceItemsById(8847, itemIds);

    player.packetSender.updateInterfaceString(8716, 'Attack');

    const levels: string[] = guide.map(g => g.level.toString());
    levels.forEach((level, i) => player.packetSender.updateInterfaceString(8720 + i, level));

    const texts: string[] = guide.map(g => g.text);
    texts.forEach((text, i) => player.packetSender.updateInterfaceString(8760 + i, text));

    for(let i = levels.length; i < 30; i++) {
        player.packetSender.updateInterfaceString(8720 + i, '');
    }
    for(let i = texts.length; i < 30; i++) {
        player.packetSender.updateInterfaceString(8760 + i, '');
    }

    player.activeInterface = {
        interfaceId: 8714,
        type: 'SCREEN',
        closeOnWalk: false
    };
};

export default { buttonIds, action } as ButtonActionPlugin;
