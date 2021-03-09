import { RunePlugin } from '@server/plugins/plugin';
import { getFiles } from '@server/util/files';
import { logger } from '@runejs/core';


export const basicStringFilter = (expected: string | string[], input: string): boolean => {
    if(Array.isArray(expected)) {
        if(expected.indexOf(input) === -1) {
            return false;
        }
    } else {
        if(expected !== input) {
            return false;
        }
    }

    return true;
};


export const basicNumberFilter = (expected: number | number[], input: number): boolean => {
    if(Array.isArray(expected)) {
        if(expected.indexOf(input) === -1) {
            return false;
        }
    } else {
        if(expected !== input) {
            return false;
        }
    }

    return true;
};


export const advancedNumberFilter = (expected: number | number[], input: number, options?: string | string[],
                                     searchOption?: string): boolean => {
    if(expected !== undefined) {
        if(Array.isArray(expected)) {
            if(expected.indexOf(input) === -1) {
                return false;
            }
        } else {
            if(expected !== input) {
                return false;
            }
        }
    }

    if(options !== undefined && searchOption !== undefined) {
        if(Array.isArray(options)) {
            return options.indexOf(searchOption) !== -1;
        } else {
            return options === searchOption;
        }
    } else {
        return true;
    }
};



export async function loadPluginFiles(): Promise<RunePlugin[]> {
    const WHITELIST = ['.plugin.js'];
    const PLUGIN_DIRECTORY = './dist/plugins';
    const plugins: RunePlugin[] = [];

    for await(const path of getFiles(PLUGIN_DIRECTORY, WHITELIST, true)) {
        const location = '.' + path.substring(PLUGIN_DIRECTORY.length).replace('.js', '');

        try {
            let pluginFile = require(location);
            if(!pluginFile) {
                continue;
            }

            if(pluginFile.default) {
                pluginFile = pluginFile.default;
            }

            const plugin = pluginFile as RunePlugin;
            if(!plugin.pluginId) {
                logger.error(`Plugin ID not provided for file at ${path}`);
                continue;
            }

            plugins.push(plugin);
        } catch(error) {
            logger.error(`Error loading plugin file at ${location}:`);
            logger.error(error);
        }
    }

    return plugins;
}
