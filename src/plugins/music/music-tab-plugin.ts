import { buttonAction } from '@server/world/action/button-action';
import { widgets, findMusicTrackByButtonId, findSongIdByRegionId } from '@server/config';
import { widgetScripts } from '@server/world/config/widget';
import { world } from '@server/game-server';

export const action: buttonAction = ({ player, buttonId }) => {
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

export enum MusicPlayerMode {
  MANUAL = 0,
  AUTO = 1
}

export enum MusicPlayerLoopMode {
  ENABLED = 0,
  DISABLED = 1
}

export enum MusicTabButtonIds {
  AUTO_BUTTON_ID = 180,
  MANUAL_BUTTON_ID = 181,
  LOOP_BUTTON_ID = 251
}

export default { type: 'button', widgetId: widgets.musicPlayerTab, action };
