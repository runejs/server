import { loadConfigurationFiles } from '@engine/config/index';

export interface XTEARegionConfiguration {
    region: number;
    keys: [number, number, number, number];
}


export class XTEARegion {

    public region: number;
    public keys: [number,number,number,number];

    public constructor(region: number, keys: [number,number,number,number]) {
        this.region = region;
        this.keys = keys;
    }
}

export function translateXTEARegionConfig(config: XTEARegionConfiguration): XTEARegion {
    return new XTEARegion(config.region, config.keys);
}

export async function loadXTEARegionConfigurations(path: string): Promise< Map<number, XTEARegion>> {
    const regions = new Map<number, XTEARegion>();
    const files = await loadConfigurationFiles(path);
    for(const file of files) {
        for (const region of file) {
            const xteaRegion = translateXTEARegionConfig(region)
            regions.set(xteaRegion.region, xteaRegion)
        }
    }
    return regions;
}
