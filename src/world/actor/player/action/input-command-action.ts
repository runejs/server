import { Player } from '../player';
import { ActionPlugin } from '@server/plugins/plugin';
import { logger } from '@runejs/logger';

/**
 * The definition for a command action function.
 */
export type commandAction = (details: CommandActionDetails) => void;

/**
 * Details about a command action.
 */
export interface CommandActionDetails {
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
 * Defines a command interaction plugin.
 */
export interface CommandActionPlugin extends ActionPlugin {
    // The single command or list of commands that this action applies to.
    commands: string | string[];
    // The potential arguments for this command action.
    args?: {
        name: string;
        type: 'number' | 'string' | 'either';
        defaultValue?: number | string;
    }[];
    // The action function to be performed.
    action: commandAction;
}

/**
 * A directory of all command interaction plugins.
 */
let commandInteractions: CommandActionPlugin[] = [];

/**
 * Sets the list of command interaction plugins.
 * @param plugins The plugin list.
 */
export const setCommandPlugins = (plugins: ActionPlugin[]): void => {
    commandInteractions = plugins as CommandActionPlugin[];
};

export const inputCommandAction = (player: Player, command: string, isConsole: boolean, inputArgs: string[]): void => {
    const plugins = commandInteractions.filter(plugin => {
        if (Array.isArray(plugin.commands)) {
            return plugin.commands.indexOf(command) !== -1;
        } else {
            return plugin.commands === command;
        }
    });

    if (plugins.length === 0) {
        player.sendLogMessage(`Unhandled command: ${command}`, isConsole);
        return;
    }

    plugins.forEach(plugin => {
        try {
            if (plugin.args) {
                const pluginArgs = plugin.args;
                let syntaxError = `Syntax error. Try ::${command}`;

                pluginArgs.forEach(pluginArg => {
                    syntaxError += ` ${pluginArg.name}:${pluginArg.type}${pluginArg.defaultValue === undefined ? '' : '?'}`;
                });

                const requiredArgLength = plugin.args.filter(arg => arg.defaultValue === undefined).length;
                if (requiredArgLength > inputArgs.length) {
                    player.sendLogMessage(syntaxError, isConsole);
                    return;
                }

                const actionArgs = {};

                for (let i = 0; i < plugin.args.length; i++) {
                    let argValue: string | number = inputArgs[i] || null;
                    const pluginArg = plugin.args[i];

                    if (argValue === null || argValue === undefined) {
                        if (pluginArg.defaultValue === undefined) {
                            player.sendLogMessage(syntaxError, isConsole);
                            return;
                        } else {
                            argValue = pluginArg.defaultValue;
                        }
                    } else {
                        if (pluginArg.type === 'number') {
                            argValue = parseInt(argValue);
                            if(isNaN(argValue)) {
                                player.sendLogMessage(syntaxError, isConsole);
                                return;
                            }
                        } else if(pluginArg.type === 'string') {
                            if (!argValue || argValue.trim() === '') {
                                player.sendLogMessage(syntaxError, isConsole);
                                return;
                            }
                        }
                    }

                    actionArgs[pluginArg.name] = argValue;
                }

                plugin.action({player, command, isConsole, args: actionArgs});
            } else {
                plugin.action({player, command, isConsole, args: {}});
            }
        } catch (commandError) {
            player.sendLogMessage(`Command error: ${commandError}`, isConsole);
            logger.error(commandError);
        }
    });
};
