import * as fs from 'fs';
import * as util from 'util';

export const pluginFilter = (pluginIds: number | number[], searchId: number, pluginOptions?: string | string[], searchOption?: string): boolean => {
    if(Array.isArray(pluginIds)) {
        if(pluginIds.indexOf(searchId) === -1) {
            return false;
        }
    } else {
        if(pluginIds !== searchId) {
            return false;
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

const readdir = util.promisify(fs.readdir);
const stat = util.promisify(fs.stat);
const blacklist = ['.map', 'plugin-loader.js'];

async function* getFiles(directory: string): AsyncGenerator<string> {
    const files = await readdir(directory);

    for (const file of files) {
        const invalid = blacklist.some(component => file.endsWith(component));

        if (invalid) {
            continue;
        }

        const path = directory + '/' + file;
        const statistics = await stat(path);

        if (statistics.isDirectory()) {
            for await (const child of getFiles(path)) {
                yield child;
            }
        } else {
            yield path;
        }
    }
}

export const BASE_PLUGIN_DIRECTORY = '/dist/plugins';

export async function loadPlugins<T>(directory: string): Promise<T[]> {
    const plugins: T[] = [];

    for await (const path of getFiles(directory)) {
        const location = '.' + path.substring(directory.indexOf(BASE_PLUGIN_DIRECTORY) + BASE_PLUGIN_DIRECTORY.length).replace('.js', '');
        const plugin = await import(location);
        plugins.push(plugin.default as T);
    }

    return plugins;
}
