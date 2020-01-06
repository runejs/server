/**
 * A {@link Message} sent by the client to send a chat message to other players.
 *
 * @author AymericDu
 */
import {Message} from "@server/net/message/message";

export abstract class ChatMessage extends Message {

    /**
     * The message.
     */
    private readonly message: string;

    /**
     * The compressed message.
     */
    private readonly compressedMessage: number[];

    /**
     * Creates a new chat message.
     *
     * @param message The message.
     * @param compressedMessage The compressed message.
     */
    constructor(message: string, compressedMessage: number[]) {
        super();
        this.message = message;
        this.compressedMessage = [...compressedMessage];
    }

    /**
     * Gets the compressed message.
     *
     * @return The compressed message.
     */
    public getCompressedMessage(): number[] {
        return [...this.compressedMessage];
    }

    /**
     * Gets the message.
     *
     * @return The message.
     */
    public getMessage(): string {
        return this.message;
    }
}
