import { logger } from '@runejs/core';
import { Player } from '@server/world/actor/player/player';
import { musicRegionMap, musicRegions } from '@server/config';
import { songs } from '@server/world/config/songs';

musicRegions.forEach(song => song.regionIds.forEach(region => musicRegionMap.set(region, song.songId)));

export function playSongForRegion(player: Player): void {
    const regionId = ((player.position.x >> 6) * 256) + (player.position.y >> 6);
    const songId: number = musicRegionMap.get(regionId);
    logger.info('Song ID for this region: ' + songId);
    logger.info('Size: ' + regionId);
    player.sendMessage('Song playing: ' + getByValue(songs, songId));

    player.playSong(songId);
    player.metadata['updateMusic'] = false;
}

function getByValue(map, searchValue) {
    for (const [key, value] of map.entries()) {
        if (value === searchValue)
            return key;
    }
}
