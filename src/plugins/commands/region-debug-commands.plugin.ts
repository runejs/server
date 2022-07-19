import { commandActionHandler } from '@engine/action';
import { Player } from '@engine/world/actor/player/player';
import { logger } from '@runejs/common';
import { Position } from '@engine/world/position';
import { activeWorld } from '@engine/world';



const debugMapRegion = (player: Player, mapRegionX: number, mapRegionY: number,
                        worldX: number, worldY: number, level: number = -1): void => {
    const key = `${mapRegionX},${mapRegionY}`;
    player.sendMessage(`Region ${key} - ${activeWorld.chunkManager.getRegionIdForWorldPosition(player.position)}`);

    if(!activeWorld.chunkManager.regionMap.has(key)) {
        player.sendMessage(`Map region not loaded.`);
        return;
    }

    if(level === -1) {
        level = player.position.level;
    }

    const region = activeWorld.chunkManager.regionMap.get(key);

    let debug: string = `\nRegion ${key},${level}\n\n`;
    for(let y = 63; y >= 0; y--) {
        const line = new Array(64).fill('?');
        for(let x = 0; x < 64; x++) {
            const tileWorldX = worldX + x;
            const tileWorldY = worldY + y;
            if(tileWorldX === player.position.x && tileWorldY === player.position.y) {
                line[x] = '@';
            } else if(region.mapFile?.tileSettings) {
                const tileSettings = activeWorld.chunkManager
                    .getTile(new Position(tileWorldX, tileWorldY, level)).settings;

                if(!tileSettings) {
                    line[x] = '.';
                } else if(tileSettings > 9) {
                    line[x] = 'x';
                } else {
                    line[x] = tileSettings + '';
                }
            }
        }
        debug += `|${line.join('')}|\n`;
    }

    logger.info(debug);
};

const regionDebugHandler: commandActionHandler = ({ player, args }) => {
    const chunkX = player.position.chunkX + 6;
    const chunkY = player.position.chunkY + 6;
    const mapRegionX = Math.floor(chunkX / 8);
    const mapRegionY = Math.floor(chunkY / 8);
    const worldX = (mapRegionX & 0xff) * 64;
    const worldY = mapRegionY * 64;

    debugMapRegion(player, mapRegionX, mapRegionY, worldX, worldY, args?.level as number || -1);
};

const tileDebugHandler: commandActionHandler = ({ player }) => {
    const tile = activeWorld.chunkManager.getTile(player.position);

    const tile0 = activeWorld.chunkManager.getTile(player.position.copy().setLevel(0));
    const tile1 = activeWorld.chunkManager.getTile(player.position.copy().setLevel(1));
    const tile2 = activeWorld.chunkManager.getTile(player.position.copy().setLevel(2));
    const tile3 = activeWorld.chunkManager.getTile(player.position.copy().setLevel(3));

    const chunkX = player.position.chunkX + 6;
    const chunkY = player.position.chunkY + 6;
    const mapRegionX = Math.floor(chunkX / 8);
    const mapRegionY = Math.floor(chunkY / 8);
    const worldX = (mapRegionX & 0xff) * 64;
    const worldY = mapRegionY * 64;

    player.sendMessage([
        `Tile ${player.position.key} settings: ${tile.settings}`,
        `Local Pos: ${player.position.x - worldX},${player.position.y - worldY}`,
        `Tile@0=(${tile0.settings}), Tile@1=(${tile1.settings}), Tile@2=(${tile2.settings}), Tile@3=(${tile3.settings})`
    ], { console: true });
};

export default {
    pluginId: 'rs:region_debug_commands',
    hooks: [
        {
            type: 'player_command',
            commands: [
                'regioninfo', 'region', 'myregion', 'regiondebug', 'region_info', 'my_region', 'region_debug'
            ],
            args: [
                {
                    name: 'level',
                    type: 'number',
                    defaultValue: -1
                }
            ],
            handler: regionDebugHandler
        },
        {
            type: 'player_command',
            commands: [
                'tileinfo', 'tile', 'mytile', 'tiledebug', 'tile_info', 'my_tile', 'tile_debug'
            ],
            handler: tileDebugHandler
        }
    ]
};
