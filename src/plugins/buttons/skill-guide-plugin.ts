import { buttonAction, ButtonActionPlugin } from '@server/world/mob/player/action/button-action';

const attackGuide = [
    {
        itemId: 1321,
        text: 'Bronze Weapons',
        level: 1
    },
    {
        itemId: 1323,
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
    const { player } = details;
    player.packetSender.chatboxMessage(`Skill guide button clicked`);
};

export default { buttonIds, action } as ButtonActionPlugin;
