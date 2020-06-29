import util from 'util';
import fs from 'fs';

const readdir = util.promisify(fs.readdir);
const stat = util.promisify(fs.stat);

export async function* getFiles(directory: string, blacklist: string[]): AsyncGenerator<string> {
    const files = await readdir(directory);

    for(const file of files) {
        const invalid = blacklist.some(component => file === component || file.endsWith('.map'));

        if(invalid) {
            continue;
        }

        const path = directory + '/' + file;
        const statistics = await stat(path);

        if(statistics.isDirectory()) {
            for await (const child of getFiles(path, blacklist)) {
                yield child;
            }
        } else {
            yield path;
        }
    }
}
