import { loadConfigurationFiles } from '@engine/config/index';
import { XteaDefinition } from '@runejs/filestore';



export class XTEARegion implements XteaDefinition {

    public mapsquare: number;
    public key: [number,number,number,number];

    public constructor(mapsquare: number, key: [number,number,number,number]) {
        this.mapsquare = mapsquare;
        this.key = key;
    }
}

export function translateXTEARegionConfig(config: XteaDefinition): XTEARegion {
    return new XTEARegion(config.mapsquare, config.key);
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
