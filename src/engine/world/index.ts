import { World } from '@engine/world/world';

export * from './items';
export * from './map';

export * from './direction';
export * from './instances';
export * from './position';
export * from './task';
export * from './world';

/**
 * The singleton instance of this game world.
 */
export let world: World;


/**
 * Creates a new instance of the game world and assigns it to the singleton world variable.
 */
export const createWorld = async (): Promise<World> => {
    world = new World();
    await world.startup();
    return world;
};
