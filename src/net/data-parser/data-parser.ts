import { ClientConnection } from '@server/net/client-connection';
import { RsBuffer } from '@server/net/rs-buffer';

export abstract class DataParser {

    public constructor(protected readonly clientConnection: ClientConnection) {
    }

    public abstract parse(buffer?: RsBuffer, packetId?: number): void | boolean;

}
