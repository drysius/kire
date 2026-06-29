import type { LiveComponent } from "./component";
import { ownMeta } from "./metadata";

export type ComponentClass = new () => LiveComponent;

/** Maps component names to their classes and instantiates fresh instances. */
export class ComponentRegistry {
	private readonly byName = new Map<string, ComponentClass>();

	/** Register under an explicit name. */
	register(name: string, ctor: ComponentClass): this {
		this.byName.set(name, ctor);
		return this;
	}

	/** Register using the name from the class's `@Component("name")` decorator. */
	registerClass(ctor: ComponentClass): this {
		const name = ownMeta(ctor).name;
		if (!name) {
			throw new Error(
				`Component class ${ctor.name} has no @Component("name"); pass a name to register().`,
			);
		}
		return this.register(name, ctor);
	}

	has(name: string): boolean {
		return this.byName.has(name);
	}

	/** Create a fresh, named instance. Throws if the name is unknown. */
	make(name: string): LiveComponent {
		const ctor = this.byName.get(name);
		if (!ctor) throw new Error(`Unknown component "${name}".`);
		const instance = new ctor();
		instance.$name = name;
		return instance;
	}
}
