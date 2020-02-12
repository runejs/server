export async function loadPlugins<T>(prefix: string, pluginList: string[]): Promise<T[]> {
    const plugins: T[] = [];

    for(const pluginPath of pluginList) {
        const plugin = await import(`@server/plugins/${prefix}/${pluginPath}`);
        plugins.push(plugin.default as T);
    }

    return plugins;
}
