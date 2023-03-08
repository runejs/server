import { buttonActionHandler } from '@engine/action';
import { findMusicTrackByButtonId, findSongIdByRegionId, widgets } from '@engine/config';
import { widgetScripts } from '@engine/world/config';
import { MusicPlayerMode, MusicTabButtonIds } from '@engine/world/sound';
import { activeWorld } from '@engine/world';
import { logger } from '@runejs/common';

export const handler: buttonActionHandler = (details) => {
    const { player, buttonId } = details;

    if(buttonId === MusicTabButtonIds.AUTO_BUTTON_ID) {
        player.settings.musicPlayerMode = MusicPlayerMode.AUTO;
        const songIdForCurrentRegion = findSongIdByRegionId(
            activeWorld.chunkManager.getRegionIdForWorldPosition(player.position));

        if (!songIdForCurrentRegion) {
            logger.warn(`No song found for current region`);
            return;
        }

        if(player.savedMetadata['currentSongIdPlaying'] !== songIdForCurrentRegion) {
            player.playSong(songIdForCurrentRegion);
        }
    } else if(buttonId === MusicTabButtonIds.MANUAL_BUTTON_ID) {
        player.settings.musicPlayerMode = MusicPlayerMode.MANUAL;
    } else if(buttonId === MusicTabButtonIds.LOOP_BUTTON_ID) {
        player.settings.musicPlayerLoopMode ^= 1;
    }

    const musicTrack = findMusicTrackByButtonId(buttonId);
    if(musicTrack === null) {
        return;
    } else if(player.musicTracks.includes(musicTrack.songId)) {
        player.playSong(musicTrack.songId);
        player.settings.musicPlayerMode = MusicPlayerMode.MANUAL;
        player.outgoingPackets.updateClientConfig(widgetScripts.musicPlayerAutoManual, 0);
    } else {
        player.sendMessage('You haven\'t unlocked this piece of music yet!');
    }
};

export default {
    pluginId: 'rs:music_tab',
    hooks: [
        { type: 'button', widgetId: widgets.musicPlayerTab, handler }
    ]
};
