import * as musicRegionsFile from '../../../data/config/music/musicRegions.json';

export interface MusicRegionsConfiguration {
    songId: number;
    songName: string;
    musicTabButtonId: number;
    regionIds: number[];
}


export class MusicTrack {

    public songId: number;
    public songName: string;
    public musicTabButtonId: number;
    public regionIds: number[];

    public constructor(songId: number, songName: string, musicTabButtonId: number, regionIds: number[]) {
        this.songId = songId;
        this.songName = songName;
        this.musicTabButtonId = musicTabButtonId;
        this.regionIds = regionIds;
    }
}

export function translateMusicRegionsConfig(config: MusicRegionsConfiguration): MusicTrack {
    return new MusicTrack(config.songId, config.songName, config.musicTabButtonId, config.regionIds);
}

export async function loadMusicRegionConfigurations(): Promise<MusicTrack[]> {
    const regions = [];

    await musicRegionsFile.musicRegions.forEach(musicRegion => regions.push(translateMusicRegionsConfig(musicRegion)));
    return regions;
}
