/**
 * A {@link Message} sent by the client to send a public chat message to other players.
 *
 * @author Graham
 */
import {ChatMessage} from "@server/world/mob/player/message/impl/chat-message";

export class PublicChatMessage extends ChatMessage {


    /**
     * The text color.
     */
    private readonly color: number;

    /**
     * The text effects.
     */
    private readonly effects: number;

    /**
     * Creates a new chat message.
     *
     * @param message The message.
     * @param compressedMessage The compressed message.
     * @param color The text color.
     * @param effects The text effects.
     */
    constructor(message: string, compressedMessage: number[], color: number, effects: number) {
        super(message, compressedMessage);
        this.color = color;
        this.effects = effects;
    }

    /**
     * Gets the text color.
     *
     * @return The text color.
     */
    public getTextColor(): number {
        return this.color;
    }

    /**
     * Gets the text effects.
     *
     * @return The text effects.
     */
    public getTextEffects(): number {
        return this.effects;
    }
}
