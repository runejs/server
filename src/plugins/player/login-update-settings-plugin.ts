import { playerInitAction } from '@server/world/actor/player/player';
import { validateSettings } from '@server/world/actor/player/player-data';
import { interfaceScripts } from '@server/world/config/widget';

export const action: playerInitAction = (details) => {
    const { player } = details;

    validateSettings(player);

    const settings = player.settings;
    player.outgoingPackets.updateClientConfig(interfaceScripts.brightness, settings.screenBrightness);
    player.outgoingPackets.updateClientConfig(interfaceScripts.mouseButtons, settings.twoMouseButtonsEnabled ? 0 : 1);
    player.outgoingPackets.updateClientConfig(interfaceScripts.splitPrivateChat, settings.splitPrivateChatEnabled ? 1 : 0);
    player.outgoingPackets.updateClientConfig(interfaceScripts.chatEffects, settings.chatEffectsEnabled ? 0 : 1);
    player.outgoingPackets.updateClientConfig(interfaceScripts.acceptAid, settings.acceptAidEnabled ? 1 : 0);
    player.outgoingPackets.updateClientConfig(interfaceScripts.musicVolume, settings.musicVolume);
    player.outgoingPackets.updateClientConfig(interfaceScripts.soundEffectVolume, settings.soundEffectVolume);
    player.outgoingPackets.updateClientConfig(interfaceScripts.areaEffectVolume, settings.areaEffectVolume);
    player.outgoingPackets.updateClientConfig(interfaceScripts.runMode, settings.runEnabled ? 1 : 0);
    player.outgoingPackets.updateClientConfig(interfaceScripts.autoRetaliate, settings.autoRetaliateEnabled ? 0 : 1);
    player.outgoingPackets.updateClientConfig(interfaceScripts.attackStyle, settings.attackStyle);
    player.outgoingPackets.updateClientConfig(interfaceScripts.bankInsertMode, settings.bankInsertMode);
    player.outgoingPackets.updateClientConfig(interfaceScripts.bankWithdrawNoteMode, settings.bankWithdrawNoteMode);
    player.outgoingPackets.updateSocialSettings();
};

export default { type: 'player_init', action };
