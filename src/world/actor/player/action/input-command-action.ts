import { Player } from '../player';
import { ActionPlugin } from '@server/plugins/plugin';

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
        player.outgoingPackets.chatboxMessage(`Unhandled command: ${command}`);
        return;
    }

    plugins.forEach(plugin => {
        try {
            if(plugin.args) {
                const pluginArgs = plugin.args;
                let syntaxError = `Syntax error. Try ::${command}`;

                pluginArgs.forEach(pluginArg => {
                    syntaxError += ` ${pluginArg.name}:${pluginArg.type}${pluginArg.defaultValue === undefined ? '' : '?'}`
                });

                const requiredArgLength = plugin.args.filter(arg => arg.defaultValue !== undefined).length;
                if(requiredArgLength > inputArgs.length) {
                    player.outgoingPackets.chatboxMessage(syntaxError);
                    return;
                }

                const actionArgs = {};

                for(let i = 0; i < plugin.args.length; i++) {
                    let argValue: string | number = inputArgs[i] || null;
                    const pluginArg = plugin.args[i];

                    if(argValue === null) {
                        if(pluginArg.defaultValue === undefined) {
                            player.outgoingPackets.chatboxMessage(syntaxError);
                            return;
                        } else {
                            argValue = pluginArg.defaultValue;
                        }
                    } else {
                        if(pluginArg.type === 'number') {
                            argValue = parseInt(argValue);
                            if(isNaN(argValue) || argValue < 1) {
                                player.outgoingPackets.chatboxMessage(syntaxError);
                                return;
                            }
                        } else {
                            if(!argValue || argValue.trim() === '') {
                                player.outgoingPackets.chatboxMessage(syntaxError);
                                return;
                            }
                        }
                    }

                    actionArgs[pluginArg.name] = argValue;
                }

                plugin.action({player, command, args: actionArgs});
            } else {
                plugin.action({player, command, args: {}});
            }
        } catch(commandError) {
            player.outgoingPackets.chatboxMessage(`Command error: ${commandError}`);
        }
    });
};
