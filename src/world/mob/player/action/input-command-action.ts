import { Player } from '../player';
import { logger } from '@runejs/logger/dist/logger';
import { gameCache, injectPlugins, world } from '@server/game-server';
import { npcAction } from '@server/world/mob/player/action/npc-action';
import { Skill } from '@server/world/mob/skills';
import { Position } from '@server/world/position';
import { ActionPlugin } from '@server/plugins/plugin';
import { pluginFilter } from '@server/plugins/plugin-loader';

type commandHandler = (player: Player, args?: string[]) => void;

const commands: { [key: string]: commandHandler } = {

    pos: (player: Player) => {
        player.packetSender.chatboxMessage(`@[ ${player.position.x}, ${player.position.y}, ${player.position.level} ]`);
    },

    move: (player: Player, args: string[]) => {
        if(args.length < 2 || args.length > 3) {
            throw `move x y [level]`;
        }

        const x: number = parseInt(args[0], 10);
        const y: number = parseInt(args[1], 10);
        let level: number = 0;

        if(args.length === 3) {
            level = parseInt(args[2]);
        }

        if(isNaN(x) || isNaN(y) || isNaN(level)) {
            throw `move x y [level]`;
        }

        player.teleport(new Position(x, y, level));
    },

    give: (player: Player, args: string[]) => {
        if(args.length < 1) {
            throw `give itemId [amount?]`;
        }

        const inventorySlot = player.inventory.getFirstOpenSlot();

        if(inventorySlot === -1) {
            player.packetSender.chatboxMessage(`You don't have enough free space to do that.`);
            return;
        }

        const itemId: number = parseInt(args[0]);

        if(isNaN(itemId)) {
            throw `give itemId [amount?]`;
        }

        let amount = 1;
        if(args.length === 2) {
            amount = parseInt(args[1]);
            if(isNaN(amount) || amount < 1 || amount > 5000) {
                amount = 1;
            }
        }

        const itemDefinition = gameCache.itemDefinitions.get(itemId);
        if(!itemDefinition) {
            player.packetSender.chatboxMessage(`Item ID ${itemId} not found!`);
            return;
        }

        player.packetSender.chatboxMessage(`amount = ${amount}`);
        let actualAmount = 0;
        if(itemDefinition.stackable) {
            const item = { itemId, amount };
            player.giveItem(item);
            actualAmount = amount;
        } else {
            for(let i = 0; i < amount; i++) {
                if(player.giveItem({ itemId, amount: 1 })) {
                    actualAmount++;
                } else {
                    break;
                }
            }
        }

        player.packetSender.chatboxMessage(`Added ${actualAmount}x ${itemDefinition.name} to inventory.`);
    },

    npcaction: (player: Player) => {
        npcAction(player, world.npcList[0], world.npcList[0].position, 'talk-to');
    },

    chati: (player: Player, args: string[]) => {
        if(args.length !== 1) {
            throw `chati widgetId`;
        }

        const widgetId: number = parseInt(args[0]);

        if(isNaN(widgetId)) {
            throw `chati widgetId`;
        }

        player.packetSender.showChatboxWidget(widgetId);
    },

    sound: (player, args) => {
        if(args.length !== 1 && args.length !== 2) {
            throw `sound soundId [volume?]`;
        }

        const soundId: number = parseInt(args[0]);

        if(isNaN(soundId)) {
            throw `sound soundId [volume?]`;
        }

        let volume: number = 0;

        if(args.length === 2) {
            volume = parseInt(args[1]);

            if(isNaN(volume)) {
                throw `sound soundId volume`;
            }
        }

        player.packetSender.playSound(soundId, volume);
    },

    plugins: player => {
        player.packetSender.chatboxMessage('Reloading plugins...');

        injectPlugins()
            .then(() => player.packetSender.chatboxMessage('Plugins reloaded.'))
            .catch(() => player.packetSender.chatboxMessage('Error reloading plugins.'));
    },

    exptest: player => {
        player.skills.addExp(Skill.WOODCUTTING, 420);
    },

    song: (player, args) => {
        if(args.length !== 1) {
            throw `song songId`;
        }

        const songId: number = parseInt(args[0]);

        if(isNaN(songId)) {
            throw `song songId`;
        }

        player.packetSender.playSong(songId);
    },

    quicksong: (player, args) => {
        if(args.length !== 1 && args.length !== 2) {
            throw `quicksong songId [previousSongId?]`;
        }

        const songId: number = parseInt(args[0]);

        if(isNaN(songId)) {
            throw `quicksong songId [previousSongId?]`;
        }

        let previousSongId: number = 76;

        if(args.length === 2) {
            previousSongId = parseInt(args[1]);

            if(isNaN(previousSongId)) {
                throw `quicksong songId [previousSongId?]`;
            }
        }

        player.packetSender.playQuickSong(songId, previousSongId);
    },

    anim: (player, args) => {
        if(args.length !== 1) {
            throw `anim animationId`;
        }

        const animationId: number = parseInt(args[0]);

        if(isNaN(animationId)) {
            throw `anim animationId`;
        }

        player.playAnimation(animationId);
    },

    quadtree: player => {
        // console.log(world.playerTree);
        const values = world.playerTree.colliding({
            x: player.position.x - 2,
            y: player.position.y - 2,
            width: 5,
            height: 5
        });
        console.log(values);
    },

    trackedplayers: player => {
        player.packetSender.chatboxMessage(`Tracked players: ${player.trackedPlayers.length}`);
    },

    trackednpcs: player => {
        player.packetSender.chatboxMessage(`Tracked Npcs: ${player.trackedNpcs.length}`);
    },

};

/**
 * The definition for a command action function.
 */
export type commandAction = (details: CommandActionDetails) => void;

/**
 * Details about a command action.
 */
export interface CommandActionDetails {
    player: Player;
    command: string;
    args: { [key: string]: number | string };
}

/**
 * Defines a command interaction plugin.
 */
export interface CommandActionPlugin extends ActionPlugin {
    commands: string | string[];
    args?: {
        name: string;
        type: 'number' | 'string';
        defaultValue?: number | string;
    }[];
    action: commandAction;
}

/**
 * A directory of all command interaction plugins.
 */
let commandInteractions: CommandActionPlugin[] = [
];

/**
 * Sets the list of command interaction plugins.
 * @param plugins The plugin list.
 */
export const setCommandPlugins = (plugins: ActionPlugin[]): void => {
    commandInteractions = plugins as CommandActionPlugin[];
};

export const inputCommandAction = (player: Player, command: string, inputArgs: string[]): void => {
    const plugins = commandInteractions.filter(plugin => {
        if(Array.isArray(plugin.commands)) {
            return plugin.commands.indexOf(command) !== -1;
        } else {
            return plugin.commands === command;
        }
    });

    if(plugins.length === 0) {
        player.packetSender.chatboxMessage(`Unhandled command: ${command}`);
        return;
    }

    plugins.forEach(plugin => {
        if(plugin.args) {
            const pluginArgs = plugin.args;
            let syntaxError = `Syntax error. Try ::${command}`;

            pluginArgs.forEach(pluginArg => {
                syntaxError += ` ${pluginArg.name}:${pluginArg.type}${pluginArg.defaultValue === undefined ? '?' : ''}`
            });

            const requiredArgLength = plugin.args.map(arg => arg.defaultValue !== undefined).length;
            if(requiredArgLength !== inputArgs.length) {
                player.packetSender.chatboxMessage(syntaxError);
                return;
            }

            const actionArgs = {};

            for(let i = 0; i < inputArgs.length; i++) {
                let argValue: string | number = inputArgs[i];
                const pluginArg = plugin.args[i];

                if(pluginArg.type === 'number') {
                    argValue = parseInt(argValue);
                    if(isNaN(argValue) || argValue < 1) {
                        player.packetSender.chatboxMessage(syntaxError);
                        return;
                    }
                } else {
                    if(!argValue || argValue.trim() === '') {
                        player.packetSender.chatboxMessage(syntaxError);
                        return;
                    }
                }

                actionArgs[pluginArg.name] = argValue;
                plugin.action({ player, command, args: actionArgs });
            }
        } else {
            plugin.action({ player, command, args: {} });
        }
    });
};
