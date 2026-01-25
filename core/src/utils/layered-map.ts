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

	entries(): MapIterator<[K, V]> {
		if (!this.parent) return super.entries();
		const entries = new Map<K, V>();
		// Parent first
		for (const [k, v] of this.parent.entries()) {
			entries.set(k, v);
		}
		// Layer overrides
		for (const [k, v] of super.entries()) {
			entries.set(k, v);
		}
		return entries.entries() as MapIterator<[K, V]>;
	}

	values(): MapIterator<V> {
		if (!this.parent) return super.values();
		const values: V[] = [];
		for (const k of this.keys()) {
			values.push(this.get(k)!);
		}
		return values.values() as MapIterator<V>;
	}

	forEach(
		callbackfn: (value: V, key: K, map: Map<K, V>) => void,
		thisArg?: any,
	): void {
		for (const [k, v] of this.entries()) {
			callbackfn.call(thisArg, v, k, this);
		}
	}

	get size(): number {
		if (!this.parent) return super.size;
		let size = super.size;
		for (const k of this.parent.keys()) {
			if (!super.has(k)) {
				size++;
			}
		}
		return size;
	}

	[Symbol.iterator](): MapIterator<[K, V]> {
		return this.entries();
	}

	/**
	 * Returns flattened object representation
	 */
	toObject(): any {
		const obj: any =
			this.parent && "toObject" in this.parent
				? (this.parent as any).toObject()
				: {};
		if (this.parent && !("toObject" in this.parent)) {
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
