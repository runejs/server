import { musicRegionMap, musicRegions } from '@engine/config';
import { songs } from '@engine/world/config/songs';
import { regionChangeActionHandler } from '@engine/world/action/region-change.action';
import { playerInitAction } from '@engine/world/actor/player/player';


musicRegions.forEach(song => song.regionIds.forEach(region => musicRegionMap.set(region, song.songId)));

function getByValue(map, searchValue) {
    for (const [key, value] of map.entries()) {
        if (value === searchValue)
            return key;
    }
}

const regionChangedHandler = ({ player, currentMapRegionId }): void => {
    const songId: number = musicRegionMap.get(currentMapRegionId);
    player.sendMessage(`Playing ${songId}:${getByValue(songs, songId)} at region ${currentMapRegionId}`);
    player.playSong(songId);
    player.metadata['updateMusic'] = false;
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
