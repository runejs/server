import { Player } from '../actor/player/player';
import { ActionHook, getActionHooks } from '@engine/world/action/hooks';
import { ActionPipe, RunnableHooks } from '@engine/world/action/index';


/**
 * Defines a player command action hook.
 */
export interface PlayerCommandActionHook extends ActionHook<PlayerCommandAction, commandActionHandler> {
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
const playerCommandActionPipe = (player: Player, command: string, isConsole: boolean,
                                 inputArgs: string[]): RunnableHooks<PlayerCommandAction> => {
    command = command.toLowerCase();

    const actionArgs = {};

    const plugins = getActionHooks<PlayerCommandActionHook>('player_command').filter(actionHook => {
        let valid: boolean;
        if(Array.isArray(actionHook.commands)) {
            valid = actionHook.commands.indexOf(command) !== -1;
        } else {
            valid = actionHook.commands === command;
        }

        if(!valid) {
            return false;
        }

        if(actionHook.args) {
            const args = actionHook.args;
            let syntaxError = `Syntax error. Try ::${command}`;

            args.forEach(commandArg => {
                syntaxError += ` ${commandArg.name}:${commandArg.type}${commandArg.defaultValue === undefined ? '' : '?'}`;
            });

            const requiredArgLength = actionHook.args.filter(arg => arg.defaultValue === undefined).length;
            if(requiredArgLength > inputArgs.length) {
                player.sendLogMessage(syntaxError, isConsole);
                return;
            }


            for(let i = 0; i < actionHook.args.length; i++) {
                let argValue: string | number = inputArgs[i] || null;
                const pluginArg = actionHook.args[i];

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
        }

        return true;
    });

    if(plugins.length === 0) {
        player.sendLogMessage(`Unhandled command: ${ command }`, isConsole);
        return;
    }

    return {
        hooks: plugins,
        action: {
            player,
            command,
            isConsole,
            args: actionArgs
        }
    }
};


/**
 * Player command action pipe definition.
 */
export default [ 'player_command',  playerCommandActionPipe ] as ActionPipe;
