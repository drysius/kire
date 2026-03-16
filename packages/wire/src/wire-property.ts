/**
 * Base class for specialized component properties.
 * Enables O(N) hydration and dehydration in Wire components.
 */
export abstract class WireProperty {
	/**
	 * Unique identifier for this property type.
	 */
	public abstract readonly __wire_type: string;

	/**
	 * Hydrates the property from a plain data structure.
	 */
	public abstract hydrate(value: any): void;

	/**
	 * Dehydrates the property into a serializable data structure.
	 */
	public abstract dehydrate(): any;
}
