import {Quest} from "@server/world/actor/player/quest";
import {pluginActions, world} from "@server/game-server";
import {MusicTrack} from "@server/config/music-regions-config";
import {SkillDetail} from "@server/world/actor/skills";
import {musicRegionMap, musicRegions} from "@server/config";



export interface MusicTrackDetail {
  readonly name: string;
}
export class PlayerMusicTrack {
  public readonly trackId: number;
  public unlocked: boolean;

  public constructor(trackId: number, unlocked?: boolean) {
    this.trackId = trackId;
    if(unlocked) {
      this.unlocked = unlocked;
    } else {
      this.unlocked = false;
    }
  }

  private defaultValues(): PlayerMusicTrack[] {
    const values: PlayerMusicTrack[] = [];
    musicRegions.forEach(track => values.push(new PlayerMusicTrack(track.songId)));
    return values;
  }
}


