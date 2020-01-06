/**
 * A message sent by the client that can be intercepted.
 *
 * @author Graham
 * @author Major
 */
export abstract class Message {

    /**
     * Indicates whether or not the Message chain has been terminated.
     */
    private terminated: boolean;

    /**
     * Terminates the Message chain.
     */
    public terminate(): void {
        this.terminated = true;
    }

    /**
     * Returns whether or not the Message chain has been terminated.
     *
     * @return {@code true} if the Message chain has been terminated, otherwise {@code false}.
     */
    public isTerminated(): boolean {
        return this.terminated;
    }

}
