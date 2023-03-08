import { findMusicTrack, findSongIdByRegionId, musicRegionMap, musicRegions, widgets } from '@engine/config/config-handler';
import { colors } from '@engine/util/colors';
import { playerInitActionHandler } from '@engine/action';
import { MusicPlayerMode } from '@engine/world/sound';


musicRegions.forEach(song => song.regionIds.forEach(region => musicRegionMap.set(region, song.songId)));

function getByValue(map, searchValue) {
    for (const [key, value] of map.entries()) {
        if (value === searchValue)
            return key;
    }
}

const regionChangedHandler = ({ player, currentMapRegionId }): void => {
    const songId = findSongIdByRegionId(currentMapRegionId);
    if(songId == null) {
        return;
    }

    const musicTrack = findMusicTrack(songId)

    if (!musicTrack) {
        return;
    }

    const songName = musicTrack.songName;
    // player.sendMessage(`Playing ${songId}:${getByValue(songs, songId)} at region ${currentMapRegionId}`);
    if(!player.musicTracks.includes(songId)) {
        player.musicTracks.push(songId);
        player.sendMessage('You have unlocked a new music track: <col=ef101f>' + songName + '.</col>');
        player.modifyWidget(widgets.musicPlayerTab, { childId:  musicTrack.musicTabButtonId, textColor: colors.green });
    }
    if(player.settings.musicPlayerMode === MusicPlayerMode.AUTO) {
        player.playSong(songId);
    }
};

const playerInitHandler: playerInitActionHandler = ({ player }): void => {
    // Plays the appropriate location's song on player init
    regionChangedHandler({ player,
        currentMapRegionId: ((player.position.x >> 6) << 8) + (player.position.y >> 6) });
};

export default {
    pluginId: 'rs:music_regions',
    hooks: [{
        type: 'region_change',
        regionType: 'region',
        handler: regionChangedHandler
    }, {
        type: 'player_init',
        handler: playerInitHandler
    }]
};
