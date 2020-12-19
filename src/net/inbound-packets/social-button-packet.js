import { PrivateMessaging } from '../../world/actor/player/private-messaging';

export default {
    opcode: 32,
    size: 3,
    handler: (player, packet) => {
        const { buffer } = packet;

        const currentPrivateChatMode = player.settings.privateChatMode;

        player.settings.publicChatMode = buffer.get();
        player.settings.privateChatMode = buffer.get();
        player.settings.tradeMode = buffer.get();

        if(currentPrivateChatMode !== player.settings.privateChatMode) {
            PrivateMessaging.playerPrivateChatModeChanged(player);
        }
    }
};
