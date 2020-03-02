import { ActionType, RunePlugin } from '@server/plugins/plugin';
import { playerInitAction } from '@server/world/actor/player/player';
import { validateSettings } from '@server/world/actor/player/player-data';
import { widgetSettings } from '@server/world/config/widget';

export const action: playerInitAction = (details) => {
    const { player } = details;

    validateSettings(player);

    const settings = player.settings;
    player.outgoingPackets.updateClientConfig(widgetSettings.brightness, settings.screenBrightness);
    player.outgoingPackets.updateClientConfig(widgetSettings.mouseButtons, settings.twoMouseButtonsEnabled ? 0 : 1);
    player.outgoingPackets.updateClientConfig(widgetSettings.splitPrivateChat, settings.splitPrivateChatEnabled ? 1 : 0);
    player.outgoingPackets.updateClientConfig(widgetSettings.chatEffects, settings.chatEffectsEnabled ? 0 : 1);
    player.outgoingPackets.updateClientConfig(widgetSettings.acceptAid, settings.acceptAidEnabled ? 1 : 0);
    player.outgoingPackets.updateClientConfig(widgetSettings.musicVolume, settings.musicVolume);
    player.outgoingPackets.updateClientConfig(widgetSettings.soundEffectVolume, settings.soundEffectVolume);
    player.outgoingPackets.updateClientConfig(widgetSettings.areaEffectVolume, settings.areaEffectVolume);
    player.outgoingPackets.updateClientConfig(widgetSettings.runMode, settings.runEnabled ? 1 : 0);
    player.outgoingPackets.updateClientConfig(widgetSettings.autoRetaliate, settings.autoRetaliateEnabled ? 0 : 1);
    player.outgoingPackets.updateClientConfig(widgetSettings.attackStyle, settings.attackStyle);
    player.outgoingPackets.updateClientConfig(widgetSettings.bankInsertMode, settings.bankInsertMode);
};

export default new RunePlugin({ type: ActionType.PLAYER_INIT, action });
