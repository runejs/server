import util from 'util';
import fs from 'fs';
import { watch } from 'chokidar';
import { Observable, Subject } from 'rxjs';

const readdir = util.promisify(fs.readdir);
const stat = util.promisify(fs.stat);

export async function* getFiles(directory: string, blacklist: string[] = []): AsyncGenerator<string> {
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

export function watchSource(dir: string): Observable<void> {
    const subject = new Subject<void>();
    const watcher = watch(dir);
    watcher.on('ready', () => {
        watcher.on('all', () => {
            subject.next();
        });
    });

    return subject.asObservable();
}

export function watchForChanges(dir: string, regex: RegExp): void {
    const watcher = watch(dir);
    watcher.on('ready', () => {
        watcher.on('all', () => {
            Object.keys(require.cache).forEach((id) => {
                if(regex.test(id)) {
                    delete require.cache[id];
                }
            });
        });
    });
}
