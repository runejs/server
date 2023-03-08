import { Position } from '@engine/world/position';
import { loadConfigurationFiles } from '@runejs/common/fs';
import { Direction } from '@engine/world/direction';


export interface NpcSpawnConfiguration {
    npc: string;
    spawn_x: number;
    spawn_y: number;
    spawn_level?: number;
    movement_radius?: number;
    face?: Direction;
}

export class NpcSpawn {

    public npcKey: string;
    public spawnPosition: Position;
    public movementRadius: number;
    public faceDirection: Direction;

    public constructor(npcKey: string, spawnPosition: Position, movementRadius: number = 0,
        faceDirection: Direction = 'WEST') {
        this.npcKey = npcKey;
        this.spawnPosition = spawnPosition;
        this.movementRadius = movementRadius;
        this.faceDirection = faceDirection;
    }

}

export function translateNpcSpawnConfig(config: NpcSpawnConfiguration): NpcSpawn {
    return new NpcSpawn(config.npc, new Position(config.spawn_x, config.spawn_y, config.spawn_level || 0),
        config.movement_radius || 0, config.face || 'WEST');
}

export async function loadNpcSpawnConfigurations(path: string): Promise<NpcSpawn[]> {
    const npcSpawns: NpcSpawn[] = [];

    const files = await loadConfigurationFiles(path);
    files.forEach(spawns => spawns.forEach(npcSpawn => npcSpawns.push(translateNpcSpawnConfig(npcSpawn))));

    return npcSpawns;
}
