import * as fs from 'fs';

export const pluginFilter = (ids: number | number[], id: number, options: string | string[], option: string): boolean => {
    if(Array.isArray(ids)) {
        if(ids.indexOf(id) === -1) {
            return false;
        }
    } else {
        if(ids !== id) {
            return false;
        }
    }

    if(Array.isArray(options)) {
        return options.indexOf(option) !== -1;
    } else {
        return options === option;
    }
};

const getAllFiles = (dirPath: string, arrayOfFiles = []) => {
    const files = fs.readdirSync(dirPath);

    files.forEach(file => {
        if(fs.statSync(dirPath + '/' + file).isDirectory()) {
            arrayOfFiles = getAllFiles(dirPath + '/' + file, arrayOfFiles);
        } else {
            if(!file.endsWith('.map') && !file.endsWith('plugin-loader.js')) {
                const fileName = './' + dirPath.replace('./dist/plugins/', '') + '/' + file.replace('.js', '');
                arrayOfFiles.push(fileName);
            }
        }
    });

    return arrayOfFiles;
};

export async function loadPlugins<T>(prefix: string): Promise<T[]> {
    const pluginFiles = getAllFiles('./dist/plugins/' + prefix);
    const plugins: T[] = [];

    for(const pluginPath of pluginFiles) {
        const plugin = await import(pluginPath);
        plugins.push(plugin.default as T);
    }

    return plugins;
}
