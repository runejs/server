import { commandActionHandler } from '@engine/action';
import { objectIds } from '@engine/world/config/object-ids';
import { safeDump } from 'js-yaml';
import { writeFileSync } from 'fs';
import { logger } from '@runejs/core';
import { LandscapeObject } from '@runejs/filestore';

const spawnSceneryAction: commandActionHandler = ({ player, args }) => {
    const locationObjectSearch: string = (args.locationObjectSearch as string).trim();
    let locationObjectId: number;

    if(locationObjectSearch.match(/^[0-9]+$/)) {
        locationObjectId = parseInt(locationObjectSearch, 10);
    } else {
        // @TODO nested object ids
        locationObjectId = objectIds[locationObjectSearch];
    }

    if(isNaN(locationObjectId)) {
        throw new Error(`Location object name not found.`);
    }

    const objectType = args.objectType as number;
    const objectOrientation = args.objectOrientation as number;

    const position = player.position.copy();

    const locationObject: LandscapeObject = {
        objectId: locationObjectId,
        x: position.x,
        y: position.y,
        level: position.level,
        type: objectType,
        orientation: objectOrientation
    };

    player.metadata.lastSpawnedScenery = locationObject;

    if(!player.metadata.spawnedScenery) {
        player.metadata.spawnedScenery = [];
    }

    player.metadata.spawnedScenery.push(locationObject);

    player.instance.spawnGameObject(locationObject);
};

const undoSceneryAction: commandActionHandler = (details) => {
    const { player } = details;

    const o: LandscapeObject = player.metadata.lastSpawnedScenery;

    if(!o) {
        return;
    }

    player.instance.despawnGameObject(o);
    delete player.metadata.lastSpawnedScenery;

    if(player.metadata.spawnedScenery) {
        player.metadata.spawnedScenery.pop();
    }
};

const dumpSceneryAction: commandActionHandler = (details) => {
    const { player } = details;

    const path = `data/dump/scene-${ new Date().getTime() }.yml`;
    writeFileSync(path, safeDump(player.metadata.spawnedScenery));
    logger.info(path);
    player.metadata.spawnedScenery = [];
};

export default {
    pluginId: 'rs:spawn_scenery_command',
    hooks: [
        {
            type: 'player_command',
            commands: [ 'scene', 'sc' ],
            args: [
                {
                    name: 'locationObjectSearch',
                    type: 'string'
                },
                {
                    name: 'objectOrientation',
                    type: 'number',
                    defaultValue: 0
                },
                {
                    name: 'objectType',
                    type: 'number',
                    defaultValue: 10
                }
            ],
            handler: spawnSceneryAction
        }, {
            type: 'player_command',
            commands: [ 'undoscene', 'undosc' ],
            handler: undoSceneryAction
        }, {
            type: 'player_command',
            commands: [ 'dumpscene', 'dumpsc' ],
            handler: dumpSceneryAction
        }
    ]
};
