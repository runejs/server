import * as fs from 'fs';

const getAllFiles = function(dirPath: string, arrayOfFiles = []) {
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
