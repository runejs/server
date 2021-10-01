import { buttonActionHandler } from '@engine/world/action';
import { findMusicTrackByButtonId, findSongIdByRegionId, widgets } from '@engine/config';
import { widgetScripts } from '@engine/world/config';
import { world } from '@engine/game-server';
import { MusicPlayerMode, MusicTabButtonIds } from '@engine/world/sound';

export const handler: buttonActionHandler = (details) => {
    const { player, buttonId } = details;

    if(buttonId === MusicTabButtonIds.AUTO_BUTTON_ID) {
        player.settings.musicPlayerMode = MusicPlayerMode.AUTO;
        const songIdForCurrentRegion = findSongIdByRegionId(
            world.chunkManager.getRegionIdForWorldPosition(player.position));

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
