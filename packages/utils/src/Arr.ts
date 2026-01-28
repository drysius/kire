export class ArrManager {
    /**
     * Get an item from an array or object using "dot" notation.
     */
    get(array: any, key: string | number, defaultValue: any = null): any {
        if (key === null || key === undefined) return array;
        if (array === null || array === undefined) return defaultValue;

        if (typeof key === 'number') return array[key] ?? defaultValue;

        if (array[key] !== undefined) return array[key];

        const segments = key.split('.');
        let current = array;

        for (const segment of segments) {
            if (current === null || current === undefined || typeof current !== 'object') {
                return defaultValue;
            }
            current = current[segment];
        }

        return current ?? defaultValue;
    }

    /**
     * Check if an item or items exist in an array or object using "dot" notation.
     */
    has(array: any, keys: string | string[]): boolean {
        const keyList = Array.isArray(keys) ? keys : [keys];
        const unique = Symbol('missing');

        for (const key of keyList) {
            if (this.get(array, key, unique) === unique) {
                return false;
            }
        }

        return true;
    }

    /**
     * Get a random value from an array.
     */
    random<T>(array: T[], number: number | null = null): T | T[] {
        const requested = number === null ? 1 : number;
        const count = array.length;

        if (requested > count) {
            throw new Error(`You requested ${requested} items, but there are only ${count} items in the array.`);
        }

        if (number === null) {
            return array[Math.floor(Math.random() * count)]!;
        }

        const keys = Object.keys(array);
        const results: T[] = [];

        // Simple shuffle and pick
        for (let i = 0; i < requested; i++) {
            const randomIndex = Math.floor(Math.random() * keys.length);
            const key = keys[randomIndex];
            results.push(array[parseInt(key!)]!);
            keys.splice(randomIndex, 1);
        }

        return results;
    }

    /**
     * Wrap the given value in an array if it is not already an array.
     */
    wrap<T>(value: T | T[]): T[] {
        if (value === null || value === undefined) return [];
        return Array.isArray(value) ? value : [value];
    }
}

export const Arr = new ArrManager();
