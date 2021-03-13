import {findMusicTrack, musicRegionMap, musicRegions, widgets} from '@server/config';
import { songs } from '@server/world/config/songs';
import { playerRegionChangedHook } from '@server/world/action/player-region-changed';
import { playerInitAction } from '@server/world/actor/player/player';
import {PlayerMusicTrack} from "@server/plugins/music/music-track";
import {colors} from "@server/util/colors";


musicRegions.forEach(song => song.regionIds.forEach(region => musicRegionMap.set(region, song.songId)));

function getByValue(map, searchValue) {
    for (const [key, value] of map.entries()) {
        if (value === searchValue)
            return key;
    }
}

const regionChangedHandler = ({ player, currentMapRegionId }): void => {
    const songId: number = musicRegionMap.get(currentMapRegionId);
    const songName = findMusicTrack(songId).songName;
    // player.sendMessage(`Playing ${songId}:${getByValue(songs, songId)} at region ${currentMapRegionId}`);
    let playerTrack = new PlayerMusicTrack(songId, true);
    if(!player.musicTracks[songId]) {
      player.sendMessage('You have unlocked a new music track: <col=ef101f>' + songName + '.</col>');
      player.musicTracks[songId] = true;
      player.modifyWidget(widgets.musicPlayerTab, { childId:  findMusicTrack(songId).musicTabButtonId, textColor: colors.green });
    }
  player.modifyWidget(widgets.musicPlayerTab, { childId: 177, text: songName, textColor: colors.green });
  player.playSong(songId);
    //player.metadata['updateMusic'] = false;
};

const playerInitHandler: playerInitAction = ({ player }): void => {
    // Plays the appropriate location's song on player init
    regionChangedHandler({ player,
        currentMapRegionId: ((player.position.x >> 6) << 8) + (player.position.y >> 6) });
};

export default [{
    type: 'player_region_changed',
    regionType: 'map',
    handler: regionChangedHandler
}, {
    type: 'player_init',
    action: playerInitHandler
}];
