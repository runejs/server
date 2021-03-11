import { Player } from '../actor/player/player';
import { logger } from '@runejs/core';
import { ActionHook, getActionHooks } from '@engine/world/action/hooks';


/**
 * Defines a player command action hook.
 */
export interface PlayerCommandActionHook extends ActionHook<commandActionHandler> {
    // The single command or list of commands that this action applies to.
    commands: string | string[];
    // The potential arguments for this command action.
    args?: {
        name: string;
        type: 'number' | 'string' | 'either';
        defaultValue?: number | string;
    }[];
}

/**
 * The player command action hook handler function to be called when the hook's conditions are met.
 */
export type commandActionHandler = (playerCommandAction: PlayerCommandAction) => void;


/**
 * Details about a player command action being performed.
 */
export interface PlayerCommandAction {
    // The player performing the action.
    player: Player;
    // The command that the player entered.
    command: string;
    // If the player used the console
    isConsole: boolean;
    // The arguments that the player entered for their command.
    args: { [key: string]: number | string };
}


/**
 * The pipe that the game engine hands player command actions off to.
 * @param player
 * @param command
 * @param isConsole
 * @param inputArgs
 */
const playerCommandActionPipe = (player: Player, command: string, isConsole: boolean, inputArgs: string[]): void => {
    command = command.toLowerCase();

    const plugins = getActionHooks<PlayerCommandActionHook>('player_command_action').filter(plugin => {
        if(Array.isArray(plugin.commands)) {
            return plugin.commands.indexOf(command) !== -1;
        } else {
            return plugin.commands === command;
        }
    });

    if(plugins.length === 0) {
        player.sendLogMessage(`Unhandled command: ${ command }`, isConsole);
        return;
    }

    plugins.forEach(plugin => {
        try {
            if(plugin.args) {
                const pluginArgs = plugin.args;
                let syntaxError = `Syntax error. Try ::${ command }`;

                pluginArgs.forEach(pluginArg => {
                    syntaxError += ` ${ pluginArg.name }:${ pluginArg.type }${ pluginArg.defaultValue === undefined ? '' : '?' }`;
                });

                const requiredArgLength = plugin.args.filter(arg => arg.defaultValue === undefined).length;
                if(requiredArgLength > inputArgs.length) {
                    player.sendLogMessage(syntaxError, isConsole);
                    return;
                }

                const actionArgs = {};

                for(let i = 0; i < plugin.args.length; i++) {
                    let argValue: string | number = inputArgs[i] || null;
                    const pluginArg = plugin.args[i];

                    if(argValue === null || argValue === undefined) {
                        if(pluginArg.defaultValue === undefined) {
                            player.sendLogMessage(syntaxError, isConsole);
                            return;
                        } else {
                            argValue = pluginArg.defaultValue;
                        }
                    } else {
                        if(pluginArg.type === 'number') {
                            argValue = parseInt(argValue);
                            if(isNaN(argValue)) {
                                player.sendLogMessage(syntaxError, isConsole);
                                return;
                            }
                        } else if(pluginArg.type === 'string') {
                            if(!argValue || argValue.trim() === '') {
                                player.sendLogMessage(syntaxError, isConsole);
                                return;
                            }
                        }
                    }

                    actionArgs[pluginArg.name] = argValue;
                }

                plugin.handler({ player, command, isConsole, args: actionArgs });
            } else {
                plugin.handler({ player, command, isConsole, args: {} });
            }
        } catch(commandError) {
            player.sendLogMessage(`Command error: ${ commandError }`, isConsole);
            logger.error(commandError);
        }
    });
};


/**
 * Player command action pipe definition.
 */
export default [ 'player_command_action',  playerCommandActionPipe ];
