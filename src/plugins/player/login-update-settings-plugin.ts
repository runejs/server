import { ActionType, RunePlugin } from '@server/plugins/plugin';
import { playerInitAction } from '@server/world/actor/player/player';
import { validateSettings } from '@server/world/actor/player/player-data';
import { widgetScripts } from '@server/world/config/widget';

export const action: playerInitAction = (details) => {
    const { player } = details;

    validateSettings(player);

    const settings = player.settings;
    player.outgoingPackets.updateClientConfig(widgetScripts.brightness, settings.screenBrightness);
    player.outgoingPackets.updateClientConfig(widgetScripts.mouseButtons, settings.twoMouseButtonsEnabled ? 0 : 1);
    player.outgoingPackets.updateClientConfig(widgetScripts.splitPrivateChat, settings.splitPrivateChatEnabled ? 1 : 0);
    player.outgoingPackets.updateClientConfig(widgetScripts.chatEffects, settings.chatEffectsEnabled ? 0 : 1);
    player.outgoingPackets.updateClientConfig(widgetScripts.acceptAid, settings.acceptAidEnabled ? 1 : 0);
    player.outgoingPackets.updateClientConfig(widgetScripts.musicVolume, settings.musicVolume);
    player.outgoingPackets.updateClientConfig(widgetScripts.soundEffectVolume, settings.soundEffectVolume);
    player.outgoingPackets.updateClientConfig(widgetScripts.areaEffectVolume, settings.areaEffectVolume);
    player.outgoingPackets.updateClientConfig(widgetScripts.runMode, settings.runEnabled ? 1 : 0);
    player.outgoingPackets.updateClientConfig(widgetScripts.autoRetaliate, settings.autoRetaliateEnabled ? 0 : 1);
    player.outgoingPackets.updateClientConfig(widgetScripts.attackStyle, settings.attackStyle);
    player.outgoingPackets.updateClientConfig(widgetScripts.bankInsertMode, settings.bankInsertMode);
    player.outgoingPackets.updateClientConfig(widgetScripts.bankWithdrawNoteMode, settings.bankWithdrawNoteMode);
};

export default new RunePlugin({ type: ActionType.PLAYER_INIT, action });
