import type { playerInitActionHandler } from '@engine/action/pipe/player-init.action';
import { findMusicTrack, findSongIdByRegionId, musicRegionMap, musicRegions, widgets } from '@engine/config/config-handler';
import { colors } from '@engine/util/colors';
import { MusicPlayerMode } from '@engine/world/sound/music';

musicRegions.forEach(song => song.regionIds.forEach(region => musicRegionMap.set(region, song.songId)));

const regionChangedHandler = ({ player, currentMapRegionId }): void => {
    const songId = findSongIdByRegionId(currentMapRegionId);
    if (songId == null) {
        return;
    }

    const musicTrack = findMusicTrack(songId);

    if (!musicTrack) {
        return;
    }

    const songName = musicTrack.songName;
    if (!player.musicTracks.includes(songId)) {
        player.musicTracks.push(songId);
        player.sendMessage('You have unlocked a new music track: <col=ef101f>' + songName + '.</col>');
        player.modifyWidget(widgets.musicPlayerTab, { childId: musicTrack.musicTabButtonId, textColor: colors.green });
    }
    if (player.settings.musicPlayerMode === MusicPlayerMode.AUTO) {
        player.playSong(songId);
    }
};

const playerInitHandler: playerInitActionHandler = ({ player }): void => {
    // Plays the appropriate location's song on player init
    regionChangedHandler({ player, currentMapRegionId: ((player.position.x >> 6) << 8) + (player.position.y >> 6) });
};

export default {
    pluginId: 'rs:music_regions',
    hooks: [
        {
            type: 'region_change',
            regionType: 'region',
            handler: regionChangedHandler,
        },
        {
            type: 'player_init',
            handler: playerInitHandler,
        },
    ],
};
