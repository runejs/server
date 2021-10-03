import { Player, PrivateMessaging } from '@engine/world/actor';
import { PacketData } from '@engine/net';

export default {
    opcode: 32,
    size: 3,
    handler: (player: Player, packet: PacketData) => {
        const { buffer } = packet;

        const currentPrivateChatMode = player.settings.privateChatMode;

        player.settings.publicChatMode = buffer.get('byte');
        player.settings.privateChatMode = buffer.get('byte');
        player.settings.tradeMode = buffer.get('byte');

        if(currentPrivateChatMode !== player.settings.privateChatMode) {
            PrivateMessaging.playerPrivateChatModeChanged(player);
        }
    }
};
