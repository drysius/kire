export class LayeredMap<K, V> extends Map<K, V> {
	constructor(private parent?: Map<K, V> | LayeredMap<K, V>) {
		super();
	}

	get(key: K): V | undefined {
		if (super.has(key)) {
			return super.get(key);
		}
		return this.parent?.get(key);
	}

	has(key: K): boolean {
		return super.has(key) || (this.parent?.has(key) ?? false);
	}

    /**
     * Returns an iterator of keys including those from the parent.
     * Note: This creates a Set to ensure uniqueness, which has a small performance cost.
     */
	keys(): MapIterator<K> {
        if (!this.parent) return super.keys();
        const keys = new Set(super.keys());
        for (const k of this.parent.keys()) {
            keys.add(k);
        }
        return keys.values() as MapIterator<K>;
	}

    /**
     * Returns flattened object representation
     */
    toObject(): any {
        const obj: any = this.parent && 'toObject' in this.parent ? (this.parent as any).toObject() : {};
        if (this.parent && !('toObject' in this.parent)) {
             for (const [k, v] of this.parent.entries()) {
                 obj[k] = v;
             }
        }
        for (const [k, v] of this.entries()) {
            obj[k] = v;
        }
        return obj;
    }
}
