import { loadConfigurationFiles } from '@engine/config/index';
import { XteaDefinition } from '@runejs/filestore';

export class XTEARegion implements XteaDefinition {
    public mapsquare: number;
    public key: [number,number,number,number];
    public archive: number;
    public group: number;
    public name: string;
    public name_hash: number;

    public constructor(
        mapsquare: number,
        key: [number,number,number,number],
        archive: number,
        group: number,
        name: string,
        name_hash: number
    ) {
        this.mapsquare = mapsquare;
        this.key = key;
        this.archive = archive;
        this.group = group;
        this.name = name;
        this.name_hash = name_hash;
    }
}

export function translateXTEARegionConfig(config: XteaDefinition): XTEARegion {
    return new XTEARegion(config.mapsquare, config.key, config.archive, config.group, config.name, config.name_hash);
}

export async function loadXTEARegionConfigurations(path: string): Promise<{ [key: number]: XTEARegion }> {
    const regions = {};
    const files = await loadConfigurationFiles(path);
    for(const file of files) {
        for (const region of file) {
            const xteaRegion = translateXTEARegionConfig(region)
            regions[xteaRegion.mapsquare] =  xteaRegion;
        }
    }
    return regions;
}
