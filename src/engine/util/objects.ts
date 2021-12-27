/**
 * Merge two objects or arrays, first object takes priority in case where the values cannot be merged
 * @param objectA
 * @param objectB
 * @return objectC combination of objectA and objectB
 */
export function deepMerge<T>(objectA: T, objectB: T): T {
    if(!objectA) {
        return objectB;
    }
    if(!objectB) {
        return objectA;
    }
    if(Array.isArray(objectA)) {
        return [...new Set([...objectA as any, ...objectB as any])] as any;
    }
    if(typeof objectA === 'object') {
        const newObject: T = { ...objectA };
        const keys = [...new Set([...Object.keys(objectA), ...Object.keys(objectB)])];
        keys.forEach((key) => {
            if(!objectA[key]) {
                newObject[key] = objectB[key];
                return;
            }
            if(!objectB[key]){
                newObject[key] = objectA[key];
            }
            if(Array.isArray(objectA[key])) {
                if(!Array.isArray(objectB[key])) {
                    newObject[key] = [...objectA[key],  objectB[key]]
                    return;
                }
                newObject[key] = deepMerge(objectA[key], objectB[key]);
                return;
            }
            if(Array.isArray(objectB[key])) {
                if(!Array.isArray(objectA[key])) {
                    newObject[key] = [...objectB[key],  objectA[key]]
                    return;
                }
                console.error('Something is wrong with deepmerger', key, objectA, objectB);
            }
            if(typeof objectA[key] === 'object' || typeof objectB === 'object') {
                newObject[key] = deepMerge(objectA[key], objectB[key]);
                return;
            }
            newObject[key] = objectA[key];
        })
        return newObject
    }
    return objectA;
}
