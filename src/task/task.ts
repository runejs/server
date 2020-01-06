export abstract class Task<T> {

    public abstract async execute(): Promise<T>;

}
