import * as musicRegionsFile from '../../data/config/music/musicRegions.json';

export interface MusicRegionsConfiguration {
  songId: number;
  songName: string;
  musicTabButtonId: number;
  musicTabInterfaceId: number;
  regionIds: number[];
}


export class MusicRegions {

  public songId: number;
  public songName: string;
  public musicTabButtonId: number;
  public musicTabInterfaceId: number;
  public regionIds: number[];

  public constructor(songId: number, songName: string, musicTabButtonId: number, musicTabInterfaceId: number, regionIds: number[]) {
      this.songId = songId;
      this.songName = songName;
      this.musicTabButtonId = musicTabButtonId;
      this.musicTabInterfaceId = musicTabInterfaceId;
      this.regionIds = regionIds;
  }
}

export function translateMusicRegionsConfig(config: MusicRegionsConfiguration): MusicRegions {
    return new MusicRegions(config.songId, config.songName, config.musicTabButtonId, config.musicTabInterfaceId, config.regionIds);
}

export async function loadMusicRegionConfigurations(): Promise<MusicRegions[]> {
    const regions = [];

    await musicRegionsFile.musicRegions.forEach(musicRegion => regions.push(translateMusicRegionsConfig(musicRegion)));
    return regions;
}
