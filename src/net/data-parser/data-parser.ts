import { ClientConnection } from '../client-connection';
import { RsBuffer } from '../rs-buffer';

export abstract class DataParser {

    public constructor(protected readonly clientConnection: ClientConnection) {
    }

    public abstract parse(buffer?: RsBuffer): void;

}
