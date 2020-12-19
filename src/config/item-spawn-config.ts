import { Position } from '@server/world/position';
import { loadConfigurationFiles } from '@server/config/index';


export interface ItemSpawnConfiguration {
    item: string;
    amount?: number;
    spawn_x: number;
    spawn_y: number;
    spawn_level?: number;
    instance?: 'global' | 'player';
    respawn?: number;
    metadata?: { [key: string]: unknown };
}

export class ItemSpawn {

    public itemKey: string;
    public amount: number = 1;
    public spawnPosition: Position;
    public instance: 'global' | 'player' = 'global';
    public respawn: number = 30;
    public metadata: { [key: string]: unknown } = {};

    public constructor(itemKey: string, position: Position) {
        this.itemKey = itemKey;
        this.spawnPosition = position;
    }

}

export function translateItemSpawnConfig(config: ItemSpawnConfiguration): ItemSpawn {
    const spawn = new ItemSpawn(config.item, new Position(config.spawn_x, config.spawn_y, config.spawn_level || 0));
    if(config.amount !== undefined) {
        spawn.amount = config.amount;
    }
    if(config.instance !== undefined) {
        spawn.instance = config.instance;
    }
    if(config.respawn !== undefined) {
        spawn.respawn = config.respawn;
    }
    if(config.metadata !== undefined) {
        spawn.metadata = config.metadata;
    }

    return spawn;
}

export async function loadItemSpawnConfigurations(path: string): Promise<ItemSpawn[]> {
    const itemSpawns = [];

    const files = await loadConfigurationFiles(path);
    files.forEach(spawns => spawns.forEach(itemSpawn => itemSpawns.push(translateItemSpawnConfig(itemSpawn))));

    return itemSpawns;
}
