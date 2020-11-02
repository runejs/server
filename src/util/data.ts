export function hasValueNotNull(variable: unknown): boolean {
    return typeof variable !== 'undefined' && variable !== null;
}
