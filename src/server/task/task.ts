export abstract class Task<T> {

    public abstract execute(): Promise<T>;

}
