import { RunePlugin } from '@server/plugins/plugin';
import { getFiles } from '@server/util/files';
import { logger } from '@runejs/core';


export const basicStringFilter = (pluginValues: string | string[], searchValue: string): boolean => {
    if(Array.isArray(pluginValues)) {
        if(pluginValues.indexOf(searchValue) === -1) {
            return false;
        }
    } else {
        if(pluginValues !== searchValue) {
            return false;
        }
    }

    return true;
};

export const basicNumberFilter = (pluginValues: number | number[], searchValue: number): boolean => {
    if(Array.isArray(pluginValues)) {
        if(pluginValues.indexOf(searchValue) === -1) {
            return false;
        }
    } else {
        if(pluginValues !== searchValue) {
            return false;
        }
    }

    return true;
};

export const pluginFilter = (pluginIds: number | number[], searchId: number, pluginOptions?: string | string[], searchOption?: string): boolean => {
    if(pluginIds !== undefined) {
        if(Array.isArray(pluginIds)) {
            if(pluginIds.indexOf(searchId) === -1) {
                return false;
            }
        } else {
            if(pluginIds !== searchId) {
                return false;
            }
        }
    }

    if(pluginOptions !== undefined && searchOption !== undefined) {
        if(Array.isArray(pluginOptions)) {
            return pluginOptions.indexOf(searchOption) !== -1;
        } else {
            return pluginOptions === searchOption;
        }
    } else {
        return true;
    }
};

const blacklist = ['plugin-loader.js', 'plugin.js', 'rune.js'];

export const PLUGIN_DIRECTORY = './dist/plugins';

export async function parsePluginFiles(): Promise<RunePlugin[]> {
    const plugins: RunePlugin[] = [];

    for await(const path of getFiles(PLUGIN_DIRECTORY, blacklist)) {
        const location = '.' + path.substring(PLUGIN_DIRECTORY.length).replace('.js', '');

        try {
            const plugin = require(location);
            if(plugin) {
                if(plugin.default) {
                    // TS plugin
                    plugins.push(new RunePlugin(plugin.default));
                } else {
                    // JS plugin
                    plugins.push(new RunePlugin(plugin));
                }
            }
        } catch(error) {
            logger.error(`Error loading plugin file at ${location}:`);
            logger.error(error);
        }
    }

    return plugins;
}
